import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { getDefinitionBySlug, type FormValues } from "@/lib/forms/definitions";
import { isUuid } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/admin";
import { loadSignatureDataUrls } from "@/lib/submissions/service";
import type { SubmissionRow } from "@/lib/submissions/types";
import FormRenderer, { type ExistingDraft } from "@/components/portal/FormRenderer";
import PageHead from "@/components/portal/PageHead";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
    const def = getDefinitionBySlug(params.slug);
    return { title: def ? `${def.title} — Clear Debt` : "Form — Clear Debt" };
}

export default async function FormPage({ params, searchParams }: { params: { slug: string }; searchParams: { id?: string } }) {
    const def = getDefinitionBySlug(params.slug);
    if (!def) notFound();

    const path = `/forms/${def.slug}${searchParams.id ? `?id=${encodeURIComponent(searchParams.id)}` : ""}`;
    const { supabase, user } = await requireUserPage(path);

    let existing: ExistingDraft | undefined;
    let loadError: string | null = null;

    if (searchParams.id) {
        if (!isUuid(searchParams.id)) notFound();
        // RLS + explicit owner filter: another user's id simply isn't found.
        const { data, error } = await supabase
            .from("submissions")
            .select("id, reference, status, form_type, fields, updated_at")
            .eq("id", searchParams.id)
            .eq("user_id", user.id)
            .maybeSingle();
        const row = data as Pick<SubmissionRow, "id" | "reference" | "status" | "form_type" | "fields" | "updated_at"> | null;

        if (error) loadError = "We couldn't load your saved draft. Please refresh the page.";
        else if (!row || row.form_type !== def.id) notFound();
        else if (row.status !== "draft") redirect(`/forms/success/${row.id}`);
        else {
            let signatures: Record<string, string> = {};
            try {
                signatures = await loadSignatureDataUrls(createServiceClient(), row.id);
            } catch (err) {
                console.error("[forms] could not load saved signatures", err);
                loadError = "Your saved signatures couldn't be loaded. Please sign again before submitting.";
            }
            existing = {
                id: row.id,
                reference: row.reference,
                status: row.status,
                updatedAt: row.updated_at,
                values: (row.fields ?? {}) as FormValues,
                signatures,
            };
        }
    }

    return (
        <>
            <PageHead
                crumbs={[{ label: "Home", href: "/" }, { label: "Forms", href: "/forms" }, { label: def.title }]}
                title={def.heading}
                description={def.intro}
            />
            {loadError && <div className="cd-alert cd-alert-warning">{loadError}</div>}
            <FormRenderer formType={def.id} existing={existing} />
        </>
    );
}
