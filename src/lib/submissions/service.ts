import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionContext } from "@/lib/auth";
import { HttpError, isUuid } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/admin";
import { renderSubmissionPdf } from "@/lib/pdf/generate";
import {
    allSignatures,
    getDefinition,
    isStatus,
    type SubmissionStatus,
} from "@/lib/forms/definitions";
import { requiredSignatureNames, sanitizeValues } from "@/lib/forms/validation";
import type {
    SaveSubmissionInput,
    SaveSubmissionResult,
    SubmissionFileRow,
    SubmissionRow,
} from "./types";

/* ==========================================================
   Server-side submission logic.

   Pattern used throughout: first prove the caller may touch a row
   by reading it through their own RLS-scoped client, THEN perform
   the write with the service-role client. The browser never
   writes to the database or storage directly.
   ========================================================== */

const SIGNATURE_BUCKET = "signatures";
const PDF_BUCKET = "pdfs";
const MAX_SIGNATURE_BYTES = 400 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

type Service = SupabaseClient;

/* ----------------------------------------------------------
   Audit log
   ---------------------------------------------------------- */

export async function logEvent(
    service: Service,
    event: { submissionId: string | null; reference?: string | null; actorId: string | null; action: string; details?: Record<string, unknown> },
) {
    const { error } = await service.from("submission_events").insert({
        submission_id: event.submissionId,
        reference: event.reference ?? null,
        actor_id: event.actorId,
        action: event.action,
        details: event.details ?? {},
    });
    // Audit failures must never break the user's action — log and move on.
    if (error) console.error("[audit] failed to record event", event.action, error.message);
}

/* ----------------------------------------------------------
   Signatures
   ---------------------------------------------------------- */

function decodeSignature(name: string, dataUrl: string): Uint8Array {
    const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) throw new HttpError(422, "A signature could not be read. Please clear it and sign again.", { fieldErrors: { [`signature:${name}`]: "Invalid signature image." } });
    const bytes = Uint8Array.from(Buffer.from(match[1], "base64"));
    if (bytes.length > MAX_SIGNATURE_BYTES) {
        throw new HttpError(422, "A signature image is too large. Please clear it and sign again.", { fieldErrors: { [`signature:${name}`]: "Signature image too large." } });
    }
    if (!PNG_MAGIC.every((b, i) => bytes[i] === b)) {
        throw new HttpError(422, "A signature could not be read. Please clear it and sign again.", { fieldErrors: { [`signature:${name}`]: "Invalid signature image." } });
    }
    return bytes;
}

async function applySignatureChanges(
    service: Service,
    submission: { id: string; user_id: string | null },
    changes: Record<string, Uint8Array | null>,
    actorId: string,
) {
    for (const [name, bytes] of Object.entries(changes)) {
        const storagePath = `${submission.user_id ?? "unassigned"}/${submission.id}/${name}.png`;

        if (bytes === null) {
            await service.storage.from(SIGNATURE_BUCKET).remove([storagePath]);
            const { error } = await service
                .from("submission_files")
                .delete()
                .match({ submission_id: submission.id, kind: "signature", field_name: name });
            if (error) throw error;
            continue;
        }

        const { error: upErr } = await service.storage
            .from(SIGNATURE_BUCKET)
            .upload(storagePath, bytes, { contentType: "image/png", upsert: true });
        if (upErr) throw upErr;

        const { error: rowErr } = await service.from("submission_files").upsert(
            {
                submission_id: submission.id,
                kind: "signature",
                field_name: name,
                bucket: SIGNATURE_BUCKET,
                storage_path: storagePath,
                mime_type: "image/png",
                size_bytes: bytes.length,
                uploaded_by: actorId,
            },
            { onConflict: "submission_id,kind,field_name" },
        );
        if (rowErr) throw rowErr;
    }
}

async function downloadBytes(service: Service, bucket: string, path: string): Promise<Uint8Array> {
    const { data, error } = await service.storage.from(bucket).download(path);
    if (error || !data) throw error ?? new Error(`Empty download: ${bucket}/${path}`);
    return new Uint8Array(await data.arrayBuffer());
}

/** Loads every stored signature for a submission as PNG bytes. */
export async function loadSignatureBytes(service: Service, submissionId: string): Promise<Record<string, Uint8Array>> {
    const { data: files, error } = await service
        .from("submission_files")
        .select("*")
        .eq("submission_id", submissionId)
        .eq("kind", "signature");
    if (error) throw error;

    const out: Record<string, Uint8Array> = {};
    await Promise.all(
        (files as SubmissionFileRow[]).map(async (f) => {
            try {
                out[f.field_name] = await downloadBytes(service, f.bucket, f.storage_path);
            } catch (err) {
                console.error(`[signatures] missing file ${f.bucket}/${f.storage_path}`, err);
            }
        }),
    );
    return out;
}

/** data: URLs for rendering stored signatures in the browser (small PNGs). */
export async function loadSignatureDataUrls(service: Service, submissionId: string): Promise<Record<string, string>> {
    const bytes = await loadSignatureBytes(service, submissionId);
    return Object.fromEntries(
        Object.entries(bytes).map(([name, b]) => [name, `data:image/png;base64,${Buffer.from(b).toString("base64")}`]),
    );
}

/* ----------------------------------------------------------
   Save draft / submit
   ---------------------------------------------------------- */

export async function saveSubmission(ctx: SessionContext, input: SaveSubmissionInput): Promise<SaveSubmissionResult> {
    const def = getDefinition(input.formType);
    if (!def) throw new HttpError(400, "Unknown form type.");
    if (input.action !== "draft" && input.action !== "submit") throw new HttpError(400, "Unknown action.");
    const submit = input.action === "submit";

    const { values, errors } = sanitizeValues(def, input.fields, submit);

    // Decode signature changes up front so a bad image fails before any write.
    const allowedPads = new Set(allSignatures(def).map((s) => s.name));
    const sigChanges: Record<string, Uint8Array | null> = {};
    for (const [name, value] of Object.entries(input.signatures ?? {})) {
        if (!allowedPads.has(name)) continue;
        if (value === null) sigChanges[name] = null;
        else if (typeof value === "string") sigChanges[name] = decodeSignature(name, value);
    }

    // Ownership check through RLS: the row must be visible to, and owned by, this user.
    let existing: Pick<SubmissionRow, "id" | "reference" | "status" | "user_id" | "form_type"> | null = null;
    if (input.id !== undefined && input.id !== null) {
        if (!isUuid(input.id)) throw new HttpError(404, "We couldn't find that submission.");
        const { data, error } = await ctx.supabase
            .from("submissions")
            .select("id, reference, status, user_id, form_type")
            .eq("id", input.id)
            .maybeSingle();
        if (error) throw error;
        if (!data || data.user_id !== ctx.user.id) throw new HttpError(404, "We couldn't find that submission.");
        if (data.form_type !== def.id) throw new HttpError(400, "This submission belongs to a different form.");
        if (data.status !== "draft") {
            throw new HttpError(409, "This form has already been submitted and can no longer be edited.", { id: data.id });
        }
        existing = data;
    }

    const service = createServiceClient();

    if (submit) {
        let stored = new Set<string>();
        if (existing) {
            const { data: files, error } = await service
                .from("submission_files")
                .select("field_name")
                .eq("submission_id", existing.id)
                .eq("kind", "signature");
            if (error) throw error;
            stored = new Set((files ?? []).map((f) => f.field_name as string));
        }
        for (const name of requiredSignatureNames(def)) {
            const present = name in sigChanges ? sigChanges[name] !== null : stored.has(name);
            if (!present) errors[`signature:${name}`] = "A signature is required.";
        }
    }

    if (Object.keys(errors).length) {
        throw new HttpError(422, "Please fix the highlighted fields.", { fieldErrors: errors });
    }

    const text = (key: string | undefined) => (key && typeof values[key] === "string" ? (values[key] as string) : "");
    const columns = {
        form_type: def.id,
        fields: values,
        client_name: text(def.indexed.clientName) || null,
        id_number: text(def.indexed.idNumber) || null,
        phone: text(def.indexed.phone) || null,
        email: text(def.indexed.email) || null,
        updated_by: ctx.user.id,
    };

    // 1) Persist as draft first; only flip to "submitted" once signatures are stored.
    let row: { id: string; reference: string; user_id: string | null; updated_at: string };
    if (existing) {
        const { data, error } = await service
            .from("submissions")
            .update(columns)
            .eq("id", existing.id)
            .eq("status", "draft")
            .select("id, reference, user_id, updated_at")
            .single();
        if (error) throw error;
        row = data;
    } else {
        const { data, error } = await service
            .from("submissions")
            .insert({ ...columns, user_id: ctx.user.id, status: "draft" })
            .select("id, reference, user_id, updated_at")
            .single();
        if (error) throw error;
        row = data;
        await logEvent(service, { submissionId: row.id, reference: row.reference, actorId: ctx.user.id, action: "created" });
    }

    // 2) Signatures.
    try {
        await applySignatureChanges(service, row, sigChanges, ctx.user.id);
    } catch (err) {
        console.error("[submissions] signature upload failed", err);
        throw new HttpError(502, "Your details were saved as a draft, but a signature couldn't be stored. Please try again.", {
            id: row.id,
            reference: row.reference,
        });
    }

    if (!submit) {
        if (existing) await logEvent(service, { submissionId: row.id, reference: row.reference, actorId: ctx.user.id, action: "draft_saved" });
        return { id: row.id, reference: row.reference, status: "draft", updatedAt: row.updated_at, pdfReady: false };
    }

    // 3) Submit.
    const { data: submitted, error: submitErr } = await service
        .from("submissions")
        .update({ status: "submitted", submitted_at: new Date().toISOString(), pdf_error: null })
        .eq("id", row.id)
        .select("updated_at")
        .single();
    if (submitErr) throw submitErr;
    await logEvent(service, { submissionId: row.id, reference: row.reference, actorId: ctx.user.id, action: "submitted" });

    // 4) PDF. A failure here must not lose the submission — it's retried on download.
    let pdfReady = false;
    try {
        await generateAndStorePdf(row.id, ctx.user.id);
        pdfReady = true;
    } catch (err) {
        console.error("[submissions] PDF generation failed after submit", err);
    }

    return { id: row.id, reference: row.reference, status: "submitted", updatedAt: submitted.updated_at, pdfReady };
}

/* ----------------------------------------------------------
   PDF
   ---------------------------------------------------------- */

/** Builds the PDF from the stored row and stores it in the private `pdfs` bucket. */
export async function generateAndStorePdf(submissionId: string, actorId: string | null): Promise<string> {
    const service = createServiceClient();
    const { data: submission, error } = await service.from("submissions").select("*").eq("id", submissionId).single();
    if (error) throw error;
    const sub = submission as SubmissionRow;

    try {
        const def = getDefinition(sub.form_type);
        if (!def) throw new Error(`No definition for form type ${sub.form_type}`);

        const signatures = await loadSignatureBytes(service, sub.id);
        const bytes = await renderSubmissionPdf({ def, submission: sub, signatures });

        const storagePath = `${sub.user_id ?? "unassigned"}/${sub.id}/${sub.reference}.pdf`;
        const { error: upErr } = await service.storage
            .from(PDF_BUCKET)
            .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
        if (upErr) throw upErr;

        if (sub.pdf_path && sub.pdf_path !== storagePath) {
            await service.storage.from(PDF_BUCKET).remove([sub.pdf_path]);
        }

        const { error: updErr } = await service
            .from("submissions")
            .update({ pdf_path: storagePath, pdf_generated_at: new Date().toISOString(), pdf_error: null })
            .eq("id", sub.id);
        if (updErr) throw updErr;

        await logEvent(service, {
            submissionId: sub.id,
            reference: sub.reference,
            actorId,
            action: sub.pdf_path ? "pdf_regenerated" : "pdf_generated",
            details: { size_bytes: bytes.length },
        });
        return storagePath;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Recorded so admins can see the failure on the dashboard/detail page.
        await service.from("submissions").update({ pdf_error: message.slice(0, 500) }).eq("id", sub.id);
        await logEvent(service, { submissionId: sub.id, reference: sub.reference, actorId, action: "pdf_failed", details: { message: message.slice(0, 500) } });
        throw err;
    }
}

/**
 * Returns the PDF bytes for a submission the caller can see (owner or
 * admin — enforced by RLS on the lookup). Generates it on first request
 * if the post-submit generation failed.
 */
export async function getPdfForViewer(ctx: SessionContext, id: string): Promise<{ bytes: Uint8Array; reference: string }> {
    if (!isUuid(id)) throw new HttpError(404, "We couldn't find that document.");
    const { data, error } = await ctx.supabase
        .from("submissions")
        .select("id, reference, status, pdf_path")
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "We couldn't find that document.");
    if (data.status === "draft") throw new HttpError(409, "A PDF is only available once the form has been submitted.");

    let pdfPath = data.pdf_path as string | null;
    if (!pdfPath) {
        try {
            pdfPath = await generateAndStorePdf(data.id, ctx.user.id);
        } catch {
            throw new HttpError(503, "Your PDF couldn't be generated right now. Please try again in a moment.");
        }
    }

    const service = createServiceClient();
    try {
        return { bytes: await downloadBytes(service, PDF_BUCKET, pdfPath), reference: data.reference };
    } catch (err) {
        // Stored file missing (e.g. deleted in the dashboard) — rebuild it once.
        console.error("[pdf] stored file unavailable, regenerating", err);
        pdfPath = await generateAndStorePdf(data.id, ctx.user.id);
        return { bytes: await downloadBytes(service, PDF_BUCKET, pdfPath), reference: data.reference };
    }
}

/* ----------------------------------------------------------
   Admin actions (callers must already be verified admins)
   ---------------------------------------------------------- */

export async function updateStatus(ctx: SessionContext, id: string, status: unknown, note: unknown) {
    if (!isUuid(id)) throw new HttpError(404, "Submission not found.");
    if (!isStatus(status)) throw new HttpError(400, "Invalid status.");
    const statusNote = typeof note === "string" ? note.trim().slice(0, 1000) : null;

    const { data: current, error } = await ctx.supabase
        .from("submissions")
        .select("id, reference, status")
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;
    if (!current) throw new HttpError(404, "Submission not found.");
    if (current.status === "draft" && status !== "draft") {
        throw new HttpError(409, "Drafts must be submitted by the client before they can be reviewed.");
    }

    const now = new Date().toISOString();
    const reviewed = status === "approved" || status === "rejected";
    const service = createServiceClient();
    const { data, error: updErr } = await service
        .from("submissions")
        .update({
            status: status as SubmissionStatus,
            status_note: statusNote || null,
            updated_by: ctx.user.id,
            reviewed_by: reviewed ? ctx.user.id : null,
            reviewed_at: reviewed ? now : null,
        })
        .eq("id", id)
        .select("*")
        .single();
    if (updErr) throw updErr;

    await logEvent(service, {
        submissionId: id,
        reference: current.reference,
        actorId: ctx.user.id,
        action: "status_changed",
        details: { from: current.status, to: status, note: statusNote || undefined },
    });
    return data as SubmissionRow;
}

export async function deleteSubmission(ctx: SessionContext, id: string) {
    if (!isUuid(id)) throw new HttpError(404, "Submission not found.");
    const { data: current, error } = await ctx.supabase
        .from("submissions")
        .select("id, reference, pdf_path")
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;
    if (!current) throw new HttpError(404, "Submission not found.");

    const service = createServiceClient();
    const { data: files } = await service.from("submission_files").select("bucket, storage_path").eq("submission_id", id);

    const byBucket = new Map<string, string[]>();
    for (const f of files ?? []) byBucket.set(f.bucket, [...(byBucket.get(f.bucket) ?? []), f.storage_path]);
    if (current.pdf_path) byBucket.set(PDF_BUCKET, [...(byBucket.get(PDF_BUCKET) ?? []), current.pdf_path]);
    for (const [bucket, paths] of Array.from(byBucket)) {
        const { error: rmErr } = await service.storage.from(bucket).remove(paths);
        if (rmErr) console.error(`[delete] could not remove files from ${bucket}`, rmErr.message);
    }

    const { error: delErr } = await service.from("submissions").delete().eq("id", id);
    if (delErr) throw delErr;

    await logEvent(service, { submissionId: null, reference: current.reference, actorId: ctx.user.id, action: "deleted" });
}
