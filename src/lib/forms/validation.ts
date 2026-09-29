/* ==========================================================
   Validation shared by the browser and the server.
   The rule set is the original validation.js, unchanged in
   behaviour; the server additionally sanitises types/lengths
   and whitelists option values.
   ========================================================== */

import {
    allFields,
    allSignatures,
    type FieldDef,
    type FieldValue,
    type FormDefinition,
    type FormValues,
    type Rule,
} from "./definitions";

const VALIDATORS: Record<Rule, (v: FieldValue) => true | string> = {
    required: (v) => {
        if (typeof v === "boolean") return v || "This field is required.";
        if (Array.isArray(v)) return v.length > 0 || "This field is required.";
        return (v && String(v).trim().length > 0) || "This field is required.";
    },
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) || "Enter a valid email address.",
    tel: (v) => !v || /^[+0-9()\-\s]{7,20}$/.test(String(v)) || "Enter a valid phone number.",
    saId: (v) => !v || /^\d{13}$/.test(String(v)) || "SA ID number must be 13 digits.",
};

/** Returns an error message, or null when the value passes every rule. */
export function validateValue(field: FieldDef, value: FieldValue): string | null {
    for (const rule of field.rules ?? []) {
        const res = VALIDATORS[rule](value);
        if (res !== true) return res;
    }
    return null;
}

export type FieldErrors = Record<string, string>;

export function validateValues(def: FormDefinition, values: FormValues): FieldErrors {
    const errors: FieldErrors = {};
    for (const field of allFields(def)) {
        const msg = validateValue(field, values[field.name] ?? "");
        if (msg) errors[field.name] = msg;
    }
    return errors;
}

/* ----------------------------------------------------------
   Server-side sanitising
   ---------------------------------------------------------- */

const DEFAULT_MAX = { text: 300, textarea: 4000 };

function sanitizeField(field: FieldDef, raw: unknown): { value: FieldValue; error?: string } {
    switch (field.type) {
        case "checkbox":
            // Legacy rows stored single checkboxes as ["on"].
            return { value: raw === true || raw === "true" || raw === "on" || (Array.isArray(raw) && raw.length > 0) };

        case "checkboxGroup": {
            if (raw == null || raw === "") return { value: [] };
            if (!Array.isArray(raw)) return { value: [], error: "Invalid selection." };
            const allowed = new Set(field.options?.map((o) => o.value));
            const picked = Array.from(new Set(raw.filter((v): v is string => typeof v === "string")));
            if (picked.some((v) => !allowed.has(v))) return { value: [], error: "Invalid selection." };
            return { value: picked };
        }

        case "radio": {
            const v = typeof raw === "string" ? raw : "";
            if (v && !field.options?.some((o) => o.value === v)) return { value: "", error: "Invalid option." };
            return { value: v };
        }

        default: {
            if (raw != null && typeof raw !== "string" && typeof raw !== "number") {
                return { value: "", error: "Invalid value." };
            }
            const v = raw == null ? "" : String(raw).trim();
            const max = field.maxLength ?? (field.type === "textarea" ? DEFAULT_MAX.textarea : DEFAULT_MAX.text);
            if (v.length > max) return { value: v.slice(0, max), error: `Must be ${max} characters or fewer.` };
            if (!v) return { value: "" };

            if (field.type === "date") {
                const d = new Date(`${v}T00:00:00Z`);
                if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(d.getTime())) {
                    return { value: "", error: "Enter a valid date." };
                }
            }
            if (field.type === "number") {
                const n = Number(v);
                if (!Number.isFinite(n)) return { value: "", error: "Enter a valid number." };
                if (field.min !== undefined && n < field.min) return { value: v, error: `Must be at least ${field.min}.` };
            }
            return { value: v };
        }
    }
}

export interface SanitizeResult {
    values: FormValues;
    errors: FieldErrors;
}

/**
 * Keeps only fields defined for this form, coerces types and, when
 * `enforceRules` is true (final submit), applies the validation rules.
 * Drafts are sanitised but may be incomplete.
 */
export function sanitizeValues(def: FormDefinition, input: unknown, enforceRules: boolean): SanitizeResult {
    const source = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const values: FormValues = {};
    const errors: FieldErrors = {};

    for (const field of allFields(def)) {
        const { value, error } = sanitizeField(field, source[field.name]);
        values[field.name] = value;
        if (error) {
            errors[field.name] = error;
            continue;
        }
        if (enforceRules) {
            const msg = validateValue(field, value);
            if (msg) errors[field.name] = msg;
        }
    }
    return { values, errors };
}

export function requiredSignatureNames(def: FormDefinition): string[] {
    return allSignatures(def)
        .filter((s) => s.required)
        .map((s) => s.name);
}
