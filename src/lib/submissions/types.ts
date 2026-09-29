import type { FormTypeId, SubmissionStatus } from "@/lib/forms/definitions";

/** Shape of a row in public.submissions (see supabase/migrations). */
export interface SubmissionRow {
    id: string;
    reference: string;
    form_type: FormTypeId;
    status: SubmissionStatus;
    user_id: string | null;
    client_name: string | null;
    id_number: string | null;
    phone: string | null;
    email: string | null;
    fields: Record<string, unknown>;
    form_version: number;
    submitted_at: string | null;
    pdf_path: string | null;
    pdf_generated_at: string | null;
    pdf_error: string | null;
    status_note: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface SubmissionFileRow {
    id: string;
    submission_id: string;
    kind: "signature" | "attachment";
    field_name: string;
    bucket: string;
    storage_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    uploaded_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface SubmissionEventRow {
    id: number;
    submission_id: string | null;
    reference: string | null;
    actor_id: string | null;
    action: string;
    details: Record<string, unknown>;
    created_at: string;
}

/** Body accepted by POST /api/submissions. */
export interface SaveSubmissionInput {
    id?: string;
    formType: string;
    action: "draft" | "submit";
    fields: Record<string, unknown>;
    /** data:image/png;base64 URL = new drawing, null = cleared, absent = unchanged. */
    signatures?: Record<string, string | null>;
}

export interface SaveSubmissionResult {
    id: string;
    reference: string;
    status: SubmissionStatus;
    updatedAt: string;
    pdfReady: boolean;
}

export interface SubmissionStats {
    total: number;
    drafts: number;
    today: number;
    this_week: number;
    this_month: number;
    last_month: number;
    awaiting_review: number;
    unique_clients: number;
    pdf_issues: number;
    by_status: Partial<Record<SubmissionStatus, number>>;
    by_type: Partial<Record<FormTypeId, number>>;
    daily: { date: string; count: number }[];
}
