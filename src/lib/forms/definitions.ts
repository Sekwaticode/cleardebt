/* ==========================================================
   Form definitions — the single source of truth for every form.

   Ported field-for-field from the original static pages
   (client-contract.html, transfer-form.html, power-of-attorney.html).
   The same definition drives:
     * the React form renderer        (src/components/portal/FormRenderer.tsx)
     * server-side validation          (src/lib/forms/validation.ts)
     * the admin submission view       (src/app/admin/(protected)/submissions/[id])
     * PDF generation                  (src/lib/pdf/generate.ts)
   Field `name`s match the keys stored in `submissions.fields`, so
   renaming one here is a data migration — don't do it casually.
   ========================================================== */

export type FormTypeId = "client_contract" | "counsellor_transfer" | "power_of_attorney";

export type Rule = "required" | "email" | "tel" | "saId";

export type FieldType =
    | "text"
    | "email"
    | "tel"
    | "number"
    | "date"
    | "textarea"
    | "radio"
    | "checkbox"
    | "checkboxGroup";

export interface FieldOption {
    value: string;
    label: string;
    description?: string;
    /** No longer offered. Kept so older submissions that picked it still display its label. */
    retired?: boolean;
}

export interface FieldDef {
    name: string;
    label: string;
    type: FieldType;
    rules?: Rule[];
    /** Occupies both columns of the two-column grid. */
    span?: 2;
    placeholder?: string;
    defaultValue?: string;
    inputMode?: "numeric" | "tel" | "email" | "text";
    min?: number;
    step?: number;
    options?: FieldOption[];
    /** Supporting line under a single checkbox (the original "check-desc"). */
    description?: string;
    maxLength?: number;
    /** Completed by Clear Debt staff from the admin; read-only for clients and ignored if they send it. */
    adminOnly?: boolean;
}

export interface SignatureDef {
    name: string;
    label: string;
    hint: string;
    required?: boolean;
    /** Signed by Clear Debt staff from the admin; clients can't draw on it. */
    adminOnly?: boolean;
}

export type Block =
    | { kind: "fields"; fields: FieldDef[] }
    | { kind: "static"; items: { label: string; value: string; span?: 2 }[] }
    | { kind: "paragraphs"; items: { lead?: string; text: string }[] }
    | { kind: "list"; ordered?: boolean; items: string[] }
    | { kind: "signatures"; signatures: SignatureDef[] };

export interface SectionDef {
    id: string;
    badge: string;
    title: string;
    /** Short label for the sticky "Sections" aside. */
    navLabel: string;
    description?: string;
    blocks: Block[];
}

export interface FormDefinition {
    id: FormTypeId;
    slug: string;
    title: string;
    heading: string;
    intro: string;
    /** Card copy on the /forms hub. */
    summary: string;
    submitLabel: string;
    successTitle: string;
    successMessage: string;
    /** Which fields feed the indexed, searchable columns on `submissions`. */
    indexed: {
        /** One field, or several joined with spaces (e.g. name + surname). */
        clientName: string | string[];
        idNumber: string;
        phone: string;
        email?: string;
    };
    sections: SectionDef[];
}

export const COMPANY = {
    name: "Clear Debt (Pty) Ltd",
    registration: "2025/687143/07",
    address: "Office no 424 Richards Bay 3900",
    email: "info@clear-debt.co.za",
    phone: "0793932311",
};

const clientContract: FormDefinition = {
    id: "client_contract",
    slug: "client-contract",
    title: "Client Contract",
    heading: "Debt Assistance Agreement",
    intro: "Complete every section below. Fields marked with an asterisk are required. You can save a draft at any time and come back to finish it.",
    summary: "Debt assistance agreement between Clear Debt (Pty) Ltd and the client.",
    submitLabel: "Submit Contract",
    successTitle: "Contract submitted",
    successMessage: "Your debt assistance agreement has been recorded and your signed copy is ready.",
    indexed: { clientName: "fullName", idNumber: "idNumber", phone: "phone", email: "email" },
    sections: [
        {
            id: "company",
            badge: "1",
            title: "Company Details",
            navLabel: "Company Details",
            blocks: [
                {
                    kind: "static",
                    items: [
                        { label: "Company", value: COMPANY.name },
                        { label: "Registration", value: COMPANY.registration },
                        { label: "Address", value: COMPANY.address, span: 2 },
                        { label: "Email", value: COMPANY.email },
                        { label: "Phone", value: COMPANY.phone },
                    ],
                },
            ],
        },
        {
            id: "client",
            badge: "2",
            title: "Client Details",
            navLabel: "Client Details",
            description: "Personal information of the client entering into this agreement.",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "fullName", label: "Full Name", type: "text", rules: ["required"], span: 2, placeholder: "e.g. Fazlyn Mack" },
                        { name: "idNumber", label: "ID Number", type: "text", rules: ["required", "saId"], inputMode: "numeric", placeholder: "13-digit SA ID" },
                        { name: "phone", label: "Phone", type: "tel", rules: ["required", "tel"], placeholder: "+27 ..." },
                        { name: "address", label: "Residential Address", type: "text", rules: ["required"], span: 2 },
                        { name: "email", label: "Email", type: "email", rules: ["required", "email"], span: 2 },
                    ],
                },
            ],
        },
        {
            id: "services",
            badge: "3",
            title: "Services Provided",
            navLabel: "Services Provided",
            description: "Select each service to be included in this agreement.",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        {
                            name: "services",
                            label: "Services Selected",
                            type: "checkboxGroup",
                            span: 2,
                            options: [
                                { value: "credit_report_checks", label: "Credit report checks", description: "We review your credit report to identify issues and opportunities, helping you improve your credit and make smarter financial decisions." },
                                { value: "removal_prescribed_debt", label: "Removal of prescribed debt", description: "Helping remove old debts that are no longer legally enforceable, improving your credit report and giving you a fresh financial start." },
                                { value: "removal_debt_review", label: "Removal from debt review", description: "The process of clearing your name from debt review once you qualify, so you can regain full financial freedom." },
                                { value: "credit_bureau_updates", label: "Credit bureau updates", description: "Ensures your credit profile reflects correct and up-to-date information, removing outdated or incorrect listings." },
                                { value: "restructuring_payments", label: "Restructuring of monthly payments", description: "We help reorganise your debts and monthly payments to make them more manageable." },
                                { value: "administration_order", label: "Administration order", description: "We help you apply to the court to rescind (cancel) your administration order once you qualify, so the administrator is removed and your credit bureau records are updated to show the order has been lifted." },
                                { value: "financial_credit_advice", label: "Financial & credit advice", retired: true },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: "fees",
            badge: "4",
            title: "Fees and Payment",
            navLabel: "Fees and Payment",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "serviceFee", label: "Service fee (R)", type: "number", rules: ["required"], min: 0, step: 0.01 },
                        { name: "paymentDue", label: "Payment due", type: "date", rules: ["required"] },
                        {
                            name: "paymentMethod",
                            label: "Payment method",
                            type: "radio",
                            rules: ["required"],
                            span: 2,
                            options: [
                                { value: "debit_order", label: "Debit Order" },
                                { value: "eft", label: "EFT" },
                                { value: "other", label: "Other" },
                            ],
                        },
                        { name: "paymentMethodOther", label: "Other payment details (if applicable)", type: "text", span: 2 },
                    ],
                },
            ],
        },
        {
            id: "terms",
            badge: "5",
            title: "Duration, Obligations & Liability",
            navLabel: "Duration & Obligations",
            blocks: [
                {
                    kind: "paragraphs",
                    items: [
                        { lead: "Duration and Termination.", text: "This Agreement begins on the signature date and continues until completion of services, unless terminated by either party with 7 days’ written notice." },
                        { lead: "Client Obligations.", text: "The Client must provide all required documents and truthful information and cooperate with Clear Debt to enable service delivery." },
                        { lead: "Clear Debt Obligations.", text: "Clear Debt will provide the services agreed upon and protect all personal information under the POPI Act." },
                        { lead: "Dispute Resolution.", text: "Both parties agree to attempt to resolve any disputes through negotiation before pursuing legal remedies." },
                        { lead: "Liability.", text: "The Client acknowledges that Clear Debt shall not be held responsible for any fees, charges, or costs incurred as a result of a previous debt counsellor, financial institution or any other account. The Client remains fully liable for settling all such fees and obligations directly with the relevant parties." },
                    ],
                },
                {
                    kind: "fields",
                    fields: [
                        { name: "acceptTerms", label: "I have read and accept the above terms", type: "checkbox", rules: ["required"], span: 2, description: "Required to submit this agreement." },
                    ],
                },
            ],
        },
        {
            id: "signatures",
            badge: "6",
            title: "Signatures",
            navLabel: "Signatures",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "signedAt", label: "Signed at (Place)", type: "text", rules: ["required"] },
                        { name: "signedDate", label: "Date", type: "date", rules: ["required"] },
                    ],
                },
                { kind: "signatures", signatures: [{ name: "clientSignature", label: "Client Signature", hint: "Sign inside the box", required: true }] },
                { kind: "fields", fields: [{ name: "clearDebtRep", label: "For Clear Debt (Name)", type: "text", span: 2, adminOnly: true }] },
                { kind: "signatures", signatures: [{ name: "clearDebtSignature", label: "Clear Debt Signature", hint: "Representative signature", adminOnly: true }] },
            ],
        },
    ],
};

const counsellorTransfer: FormDefinition = {
    id: "counsellor_transfer",
    slug: "debt-counsellor-transfer",
    title: "Debt Counsellor Transfer",
    heading: "Debt Counsellor Transfer Form",
    intro: "Request the transfer of a consumer under debt review from their current counsellor to Clear Debt.",
    summary: "Transfer a consumer from a previous debt counsellor to Clear Debt.",
    submitLabel: "Submit Transfer",
    successTitle: "Transfer submitted",
    successMessage: "Your transfer request has been recorded and your signed copy is ready.",
    indexed: { clientName: "consumerFullName", idNumber: "consumerIdNumber", phone: "consumerPhone", email: "consumerEmail" },
    sections: [
        {
            id: "consumer",
            badge: "A",
            title: "Consumer Details",
            navLabel: "Consumer Details",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "consumerFullName", label: "Full Name", type: "text", rules: ["required"], span: 2 },
                        { name: "consumerIdNumber", label: "ID Number", type: "text", rules: ["required", "saId"], inputMode: "numeric" },
                        { name: "consumerPhone", label: "Contact Number", type: "tel", rules: ["required", "tel"] },
                        { name: "consumerEmail", label: "Email", type: "email", rules: ["required", "email"], span: 2 },
                        { name: "consumerAddress", label: "Residential Address", type: "text", rules: ["required"], span: 2 },
                    ],
                },
            ],
        },
        {
            id: "current",
            badge: "B",
            title: "Current Debt Counsellor Details",
            navLabel: "Current Debt Counsellor",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "currentCounsellorName", label: "Debt Counsellor Name", type: "text", rules: ["required"] },
                        { name: "currentCounsellorNcr", label: "NCR Registration Number", type: "text", rules: ["required"] },
                        { name: "currentCounsellorCompany", label: "Company Name", type: "text", rules: ["required"], span: 2 },
                        { name: "currentCounsellorPhone", label: "Contact Number", type: "tel", rules: ["required", "tel"] },
                        { name: "currentCounsellorEmail", label: "Email", type: "email", rules: ["required", "email"] },
                    ],
                },
            ],
        },
        {
            id: "new",
            badge: "C",
            title: "New Debt Counsellor Details",
            navLabel: "New Debt Counsellor",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "newCounsellorName", label: "Debt Counsellor Name", type: "text", defaultValue: "Tasmin Ramkissoon" },
                        { name: "newCounsellorNcr", label: "NCR Registration Number", type: "text", defaultValue: "NCRDC4086" },
                        { name: "newCounsellorCompany", label: "Company Name", type: "text", defaultValue: "CLEAR DEBT", span: 2 },
                        { name: "newCounsellorPhone", label: "Contact Number", type: "tel", defaultValue: "079 393 2311" },
                        { name: "newCounsellorEmail", label: "Email", type: "email", defaultValue: "info@clear-debt.co.za" },
                    ],
                },
            ],
        },
        {
            id: "confirmation",
            badge: "D",
            title: "Confirmation of Transfer",
            navLabel: "Confirmation of Transfer",
            blocks: [
                {
                    kind: "list",
                    ordered: true,
                    items: [
                        "I, the undersigned consumer, confirm my request to transfer from the above-mentioned current debt counsellor to the new debt counsellor.",
                        "I understand that the new debt counsellor will take over all responsibilities relating to my debt review process as regulated by the National Credit Act.",
                        "I authorize the release of all documents, information, and court applications related to my debt review to the new debt counsellor.",
                    ],
                },
                {
                    kind: "fields",
                    fields: [
                        { name: "confirmTransfer", label: "I confirm and authorize the transfer", type: "checkbox", rules: ["required"], span: 2, description: "Required to submit this transfer request." },
                    ],
                },
            ],
        },
        {
            id: "signatures",
            badge: "E",
            title: "Signatures",
            navLabel: "Signatures",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "consumerSignDate", label: "Consumer Signature Date", type: "date", rules: ["required"] },
                        { name: "counsellorSignDate", label: "New Debt Counsellor Signature Date", type: "date", rules: ["required"] },
                    ],
                },
                {
                    kind: "signatures",
                    signatures: [
                        { name: "consumerSignature", label: "Consumer Signature", hint: "Sign inside the box", required: true },
                        { name: "newCounsellorSignature", label: "New Debt Counsellor Signature", hint: "Counsellor signature" },
                    ],
                },
            ],
        },
    ],
};

const powerOfAttorney: FormDefinition = {
    id: "power_of_attorney",
    slug: "power-of-attorney",
    title: "Power of Attorney",
    heading: "Power of Attorney",
    intro: "Appoint a lawful agent to manage and transact business on behalf of the principal in the Republic of South Africa.",
    summary: "Grant Clear Debt a power of attorney to act on behalf of the principal.",
    submitLabel: "Submit POA",
    successTitle: "Power of Attorney submitted",
    successMessage: "Your power of attorney has been recorded and your executed copy is ready.",
    indexed: { clientName: ["principalFirstName", "principalSurname"], idNumber: "principalIdNumber", phone: "principalPhone" },
    sections: [
        {
            id: "principal",
            badge: "1",
            title: "Principal",
            navLabel: "Principal",
            description: "The person granting the power of attorney.",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "principalFirstName", label: "Name(s) of Principal", type: "text", rules: ["required"] },
                        { name: "principalSurname", label: "Surname of Principal", type: "text", rules: ["required"] },
                        { name: "principalIdNumber", label: "Identity Number", type: "text", rules: ["required", "saId"], inputMode: "numeric" },
                        { name: "principalPhone", label: "Contact Number", type: "tel", rules: ["tel"] },
                        { name: "principalAddress", label: "Residential Address", type: "text", rules: ["required"], span: 2 },
                    ],
                },
            ],
        },
        {
            id: "agent",
            badge: "2",
            title: "Agent",
            navLabel: "Agent",
            description: "The appointed lawful agent (typically Clear Debt or its representative).",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "agentFullName", label: "Full Name of Agent", type: "text", span: 2 },
                        { name: "agentIdNumber", label: "Identity Number", type: "text", rules: ["saId"], inputMode: "numeric" },
                        { name: "agentCompany", label: "Company / Firm / Institution", type: "text", defaultValue: COMPANY.name },
                    ],
                },
            ],
        },
        {
            id: "powers",
            badge: "3",
            title: "Powers Granted",
            navLabel: "Powers Granted",
            blocks: [
                {
                    kind: "paragraphs",
                    items: [
                        { text: "The Principal appoints the Agent, with power of substitution, to be the Principal's lawful agent for managing and transacting business in the Republic of South Africa with full power and authority on behalf and for the account and benefit of the Principal." },
                    ],
                },
                {
                    kind: "fields",
                    fields: [
                        { name: "additionalPowers", label: "Additional powers or scope (optional)", type: "textarea", span: 2, placeholder: "Describe any specific powers, limitations or scope." },
                        { name: "ratifyActs", label: "I ratify all acts done by the Agent under this Power of Attorney", type: "checkbox", rules: ["required"], span: 2, description: "Required to submit this document." },
                    ],
                },
            ],
        },
        {
            id: "signing",
            badge: "4",
            title: "Signing",
            navLabel: "Signing",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "signedAtPlace", label: "Signed at (Place)", type: "text", rules: ["required"] },
                        { name: "signedDate", label: "Date of signing", type: "date", rules: ["required"] },
                    ],
                },
                {
                    kind: "signatures",
                    signatures: [
                        { name: "principalSignature", label: "Principal Signature", hint: "Principal signs inside the box", required: true },
                        { name: "agentSignature", label: "Agent Signature", hint: "Agent signature" },
                    ],
                },
            ],
        },
        {
            id: "witnesses",
            badge: "5",
            title: "Witnesses",
            navLabel: "Witnesses",
            blocks: [
                {
                    kind: "fields",
                    fields: [
                        { name: "witness1Name", label: "Witness 1 Full Name", type: "text", rules: ["required"] },
                        { name: "witness2Name", label: "Witness 2 Full Name", type: "text", rules: ["required"] },
                    ],
                },
                {
                    kind: "signatures",
                    signatures: [
                        { name: "witness1Signature", label: "Witness 1 Signature", hint: "Witness 1" },
                        { name: "witness2Signature", label: "Witness 2 Signature", hint: "Witness 2" },
                    ],
                },
            ],
        },
    ],
};

export const FORM_DEFINITIONS: FormDefinition[] = [clientContract, counsellorTransfer, powerOfAttorney];

export const FORM_TYPE_IDS = FORM_DEFINITIONS.map((d) => d.id);

export const STATUSES = ["draft", "submitted", "approved", "rejected"] as const;
export type SubmissionStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
    draft: "Draft",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
};

export function getDefinition(id: string): FormDefinition | undefined {
    return FORM_DEFINITIONS.find((d) => d.id === id);
}

export function getDefinitionBySlug(slug: string): FormDefinition | undefined {
    return FORM_DEFINITIONS.find((d) => d.slug === slug);
}

export function isFormTypeId(value: unknown): value is FormTypeId {
    return typeof value === "string" && FORM_TYPE_IDS.includes(value as FormTypeId);
}

export function isStatus(value: unknown): value is SubmissionStatus {
    return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function allFields(def: FormDefinition): FieldDef[] {
    return def.sections.flatMap((s) =>
        s.blocks.flatMap((b) => (b.kind === "fields" ? b.fields : [])),
    );
}

export function allSignatures(def: FormDefinition): SignatureDef[] {
    return def.sections.flatMap((s) =>
        s.blocks.flatMap((b) => (b.kind === "signatures" ? b.signatures : [])),
    );
}

export function adminOnlyFields(def: FormDefinition): FieldDef[] {
    return allFields(def).filter((f) => f.adminOnly);
}

export function adminOnlySignatures(def: FormDefinition): SignatureDef[] {
    return allSignatures(def).filter((s) => s.adminOnly);
}

/** The client's name as stored in the indexed `client_name` column. */
export function clientNameOf(def: FormDefinition, values: Record<string, unknown>): string {
    const keys = Array.isArray(def.indexed.clientName) ? def.indexed.clientName : [def.indexed.clientName];
    return keys
        .map((k) => (typeof values[k] === "string" ? (values[k] as string).trim() : ""))
        .filter(Boolean)
        .join(" ");
}

export function defaultValues(def: FormDefinition): FormValues {
    const values: FormValues = {};
    for (const f of allFields(def)) {
        if (f.type === "checkboxGroup") values[f.name] = [];
        else if (f.type === "checkbox") values[f.name] = false;
        else values[f.name] = f.defaultValue ?? "";
    }
    return values;
}

export type FieldValue = string | boolean | string[];
export type FormValues = Record<string, FieldValue>;

/** Human-readable rendering of a stored value (admin view, PDF, tables). */
export function formatFieldValue(field: FieldDef | undefined, value: unknown): string {
    if (value === undefined || value === null || value === "") return "—";
    if (Array.isArray(value)) {
        if (value.length === 0) return "—";
        const labels = value.map((v) => field?.options?.find((o) => o.value === v)?.label ?? String(v));
        return labels.join(", ");
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    const str = String(value);
    if (!field) return str;
    if (field.type === "radio") return field.options?.find((o) => o.value === str)?.label ?? str;
    if (field.type === "date") return formatDate(str);
    if (field.type === "number" && field.name === "serviceFee") {
        const n = Number(str);
        return Number.isFinite(n)
            ? `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : str;
    }
    return str;
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "2-digit" });
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Johannesburg",
    });
}
