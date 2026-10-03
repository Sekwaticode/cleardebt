"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    STATUS_LABELS,
    allFields,
    allSignatures,
    defaultValues,
    getDefinition,
    type Block,
    type FieldDef,
    type FieldValue,
    type FormTypeId,
    type FormValues,
    type SubmissionStatus,
} from "@/lib/forms/definitions";
import { validateValue, validateValues, type FieldErrors } from "@/lib/forms/validation";
import type { SaveSubmissionResult } from "@/lib/submissions/types";
import { SignaturePad, type SignaturePadHandle } from "./SignaturePad";
import { useToast } from "./Toast";

/* ==========================================================
   Client-side form controller — the React port of forms.js:
   collect fields, live validation, signature pads, save draft,
   submit, reset. Persistence goes through POST /api/submissions.
   ========================================================== */

export interface ExistingDraft {
    id: string;
    reference: string;
    status: SubmissionStatus;
    updatedAt: string;
    values: FormValues;
    signatures: Record<string, string>;
}

const sigKey = (name: string) => `signature:${name}`;
const stashKey = (formType: string) => `cd-unsaved-${formType}`;

export default function FormRenderer({ formType, existing }: { formType: FormTypeId; existing?: ExistingDraft }) {
    const def = getDefinition(formType)!;
    const router = useRouter();
    const toast = useToast();

    const fieldsByName = useMemo(() => new Map(allFields(def).map((f) => [f.name, f])), [def]);
    const [values, setValues] = useState<FormValues>(() => ({ ...defaultValues(def), ...(existing?.values ?? {}) }));
    const [errors, setErrors] = useState<FieldErrors>({});
    const [meta, setMeta] = useState(() => ({
        id: existing?.id ?? null,
        reference: existing?.reference ?? null,
        status: existing?.status ?? null,
        savedAt: existing?.updatedAt ?? null,
    }));
    const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const dirty = useRef(false);
    const pads = useRef<Record<string, SignaturePadHandle | null>>({});

    // Restore values stashed when a session expired mid-edit.
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(stashKey(formType));
            if (!raw) return;
            sessionStorage.removeItem(stashKey(formType));
            const stash = JSON.parse(raw) as { id: string | null; values: FormValues };
            if ((stash.id ?? null) !== (existing?.id ?? null)) return;
            setValues((v) => ({ ...v, ...stash.values }));
            dirty.current = true;
            toast("We restored the details you entered before signing in again. Please re-draw any signatures.", "info");
        } catch {
            /* storage unavailable — nothing to restore */
        }
    }, [formType, existing?.id, toast]);

    // Warn before leaving with unsaved changes.
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!dirty.current) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    const setValue = (name: string, value: FieldValue) => {
        dirty.current = true;
        setValues((v) => ({ ...v, [name]: value }));
        // Same as the original: once a field shows an error, re-check it as the user types.
        if (errors[name]) {
            const field = fieldsByName.get(name);
            const msg = field ? validateValue(field, value) : null;
            setErrors((e) => {
                const next = { ...e };
                if (msg) next[name] = msg;
                else delete next[name];
                return next;
            });
        }
    };

    const validateOnBlur = (field: FieldDef) => {
        const msg = validateValue(field, values[field.name] ?? "");
        setErrors((e) => {
            const next = { ...e };
            if (msg) next[field.name] = msg;
            else delete next[field.name];
            return next;
        });
    };

    const onSignatureChange = useCallback((name: string) => {
        dirty.current = true;
        setErrors((e) => {
            if (!e[sigKey(name)]) return e;
            const next = { ...e };
            if (!pads.current[name]?.isEmpty()) delete next[sigKey(name)];
            return next;
        });
    }, []);

    const focusFirstError = (errs: FieldErrors) => {
        const first = Object.keys(errs)[0];
        if (!first) return;
        const el = document.getElementById(`fld-${first.replace(":", "-")}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
    };

    const collectSignatures = () => {
        const out: Record<string, string | null> = {};
        for (const sig of allSignatures(def)) {
            const pad = pads.current[sig.name];
            if (!pad || !pad.isDirty()) continue;
            out[sig.name] = pad.isEmpty() ? null : pad.toDataURL();
        }
        return out;
    };

    async function persist(action: "draft" | "submit") {
        if (action === "submit") {
            const errs = validateValues(def, values);
            for (const sig of allSignatures(def)) {
                if (sig.required && pads.current[sig.name]?.isEmpty()) errs[sigKey(sig.name)] = "A signature is required.";
            }
            setErrors(errs);
            if (Object.keys(errs).length) {
                toast("Please fix the highlighted fields.", "error");
                focusFirstError(errs);
                return;
            }
        }

        setBusy(action);
        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: meta.id ?? undefined, formType, action, fields: values, signatures: collectSignatures() }),
            });
            const body = await res.json().catch(() => ({}));

            if (res.status === 401) {
                try {
                    sessionStorage.setItem(stashKey(formType), JSON.stringify({ id: meta.id, values }));
                } catch {
                    /* ignore */
                }
                dirty.current = false;
                toast(body.error ?? "Your session has expired. Please sign in again.", "error");
                const here = window.location.pathname + window.location.search;
                router.push(`/forms/login?next=${encodeURIComponent(here)}`);
                return;
            }

            if (!res.ok) {
                if (body.fieldErrors) {
                    setErrors(body.fieldErrors);
                    focusFirstError(body.fieldErrors);
                }
                if (body.id && !meta.id) adoptId(body.id, body.reference);
                if (res.status === 409 && body.id) {
                    dirty.current = false;
                    router.push(`/forms/success/${body.id}`);
                }
                toast(body.error ?? "Couldn't save — check your connection and try again.", "error");
                return;
            }

            const result = body as SaveSubmissionResult;
            Object.values(pads.current).forEach((p) => p?.markClean());
            dirty.current = false;

            if (action === "submit") {
                router.push(`/forms/success/${result.id}`);
                return;
            }
            adoptId(result.id, result.reference);
            setMeta({ id: result.id, reference: result.reference, status: result.status, savedAt: result.updatedAt });
            toast("Draft saved.", "success");
        } catch {
            toast("Couldn't reach the server — check your connection and try again.", "error");
        } finally {
            setBusy(null);
        }
    }

    // Keep ?id= in the URL so a reload resumes the same draft.
    function adoptId(id: string, reference?: string) {
        setMeta((m) => ({ ...m, id, reference: reference ?? m.reference }));
        const url = new URL(window.location.href);
        if (url.searchParams.get("id") !== id) {
            url.searchParams.set("id", id);
            window.history.replaceState(null, "", url.toString());
        }
    }

    function resetForm() {
        setValues(defaultValues(def));
        setErrors({});
        Object.values(pads.current).forEach((p) => p?.clear());
        setConfirmReset(false);
        toast("Form cleared.", "info");
    }

    const sectionHasError = (blocks: Block[]) =>
        blocks.some(
            (b) =>
                (b.kind === "fields" && b.fields.some((f) => errors[f.name])) ||
                (b.kind === "signatures" && b.signatures.some((s) => errors[sigKey(s.name)])),
        );

    const statusText = meta.reference
        ? `Reference: ${meta.reference} · Status: ${STATUS_LABELS[meta.status ?? "draft"]} · Last saved ${meta.savedAt ? new Date(meta.savedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "—"}`
        : "No draft saved yet.";

    return (
        <div className="cd-form-layout">
            <form
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    persist("submit");
                }}
            >
                {def.sections.map((section) => (
                    <section className="cd-card" id={`sec-${section.id}`} key={section.id} aria-labelledby={`sec-${section.id}-title`}>
                        <div className="cd-card-header">
                            <div>
                                <h2 id={`sec-${section.id}-title`}>
                                    <span className="cd-step-badge">{section.badge}</span>
                                    {section.title}
                                </h2>
                                {section.description && <p>{section.description}</p>}
                            </div>
                        </div>
                        <div className="cd-card-body">
                            {section.blocks.map((block, i) => (
                                <BlockView
                                    key={i}
                                    block={block}
                                    values={values}
                                    errors={errors}
                                    setValue={setValue}
                                    onBlur={validateOnBlur}
                                    pads={pads}
                                    existingSignatures={existing?.signatures ?? {}}
                                    onSignatureChange={onSignatureChange}
                                />
                            ))}
                        </div>
                    </section>
                ))}

                <div className="cd-form-footer">
                    <div className="cd-form-status">{statusText}</div>
                    <div className="cd-actions">
                        <button type="button" className="cd-btn cd-btn-outline" onClick={() => setConfirmReset(true)} disabled={!!busy}>
                            Reset
                        </button>
                        <button type="button" className="cd-btn cd-btn-outline" onClick={() => persist("draft")} disabled={!!busy}>
                            {busy === "draft" && <span className="cd-spinner" aria-hidden />}
                            Save Draft
                        </button>
                        <button type="submit" className="cd-btn cd-btn-primary" disabled={!!busy}>
                            {busy === "submit" && <span className="cd-spinner" aria-hidden />}
                            {busy === "submit" ? "Submitting…" : def.submitLabel}
                        </button>
                    </div>
                </div>
            </form>

            <aside className="cd-form-aside" aria-label="Form sections">
                <h4>Sections</h4>
                <ol>
                    {def.sections.map((s) => (
                        <li key={s.id}>
                            <a href={`#sec-${s.id}`}>
                                <span className={`cd-dot${sectionHasError(s.blocks) ? " is-error" : ""}`} />
                                {s.navLabel}
                            </a>
                        </li>
                    ))}
                </ol>
                <div className="cd-aside-meta">
                    <span>
                        <span className="cd-req">*</span> Required field
                    </span>
                    {meta.reference && <span>Ref. {meta.reference}</span>}
                </div>
            </aside>

            {confirmReset && (
                <div className="cd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(e) => e.target === e.currentTarget && setConfirmReset(false)}>
                    <div className="cd-modal">
                        <div className="cd-modal-header" id="reset-title">
                            Clear the form?
                        </div>
                        <div className="cd-modal-body">All fields and signatures on this page will be cleared. Your last saved draft is not affected until you save again.</div>
                        <div className="cd-modal-footer">
                            <button type="button" className="cd-btn cd-btn-outline" onClick={() => setConfirmReset(false)} autoFocus>
                                Cancel
                            </button>
                            <button type="button" className="cd-btn cd-btn-danger" onClick={resetForm}>
                                Clear form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ----------------------------------------------------------
   Blocks & fields
   ---------------------------------------------------------- */

interface BlockProps {
    block: Block;
    values: FormValues;
    errors: FieldErrors;
    setValue: (name: string, value: FieldValue) => void;
    onBlur: (field: FieldDef) => void;
    pads: React.MutableRefObject<Record<string, SignaturePadHandle | null>>;
    existingSignatures: Record<string, string>;
    onSignatureChange: (name: string) => void;
}

function BlockView({ block, values, errors, setValue, onBlur, pads, existingSignatures, onSignatureChange }: BlockProps) {
    switch (block.kind) {
        case "static":
            return (
                <div className="cd-field-grid">
                    {block.items.map((item) => (
                        <div key={item.label} className={`cd-field${item.span === 2 ? " cd-span-2" : ""}`}>
                            <label>{item.label}</label>
                            <input className="cd-input" type="text" value={item.value} readOnly tabIndex={-1} />
                        </div>
                    ))}
                </div>
            );

        case "paragraphs":
            return (
                <>
                    {block.items.map((p, i) => (
                        <p key={i}>
                            {p.lead && <strong>{p.lead} </strong>}
                            {p.text}
                        </p>
                    ))}
                </>
            );

        case "list":
            return (
                <ol>
                    {block.items.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ol>
            );

        case "fields":
            return (
                <div className="cd-field-grid">
                    {block.fields.map((f) => (
                        <FieldView key={f.name} field={f} value={values[f.name]} error={errors[f.name]} setValue={setValue} onBlur={onBlur} />
                    ))}
                </div>
            );

        case "signatures":
            return (
                <div className={`cd-sig-grid${block.signatures.length === 1 ? " is-single" : ""}`}>
                    {block.signatures.map((sig) => {
                        if (sig.adminOnly) {
                            return (
                                <div key={sig.name} className="cd-field">
                                    <span className="cd-label">{sig.label}</span>
                                    <div className="cd-signature-block">
                                        <div className="cd-signature-title">
                                            <span>Signed by Clear Debt</span>
                                        </div>
                                        {existingSignatures[sig.name] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img className="cd-signature-img" src={existingSignatures[sig.name]} alt={sig.label} />
                                        ) : (
                                            <div className="cd-empty" style={{ padding: "48px 12px" }}>
                                                Clear Debt will sign here once your form is received.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        const error = errors[sigKey(sig.name)];
                        return (
                            <div key={sig.name} className={`cd-field${error ? " has-error" : ""}`} id={`fld-signature-${sig.name}`}>
                                <span className="cd-label">
                                    {sig.label}
                                    {sig.required && <span className="cd-req">*</span>}
                                </span>
                                <div className="cd-signature-block">
                                    <div className="cd-signature-title">
                                        <span>{sig.hint}</span>
                                        {existingSignatures[sig.name] && <span>Saved signature loaded</span>}
                                    </div>
                                    <SignaturePad
                                        ref={(h) => {
                                            pads.current[sig.name] = h;
                                        }}
                                        label={sig.label}
                                        initialImage={existingSignatures[sig.name]}
                                        onChange={() => onSignatureChange(sig.name)}
                                    />
                                    <div className="cd-signature-actions">
                                        <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" onClick={() => pads.current[sig.name]?.undo()}>
                                            Undo
                                        </button>
                                        <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" onClick={() => pads.current[sig.name]?.clear()}>
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="cd-error-msg">{error}</div>
                            </div>
                        );
                    })}
                </div>
            );
    }
}

interface FieldProps {
    field: FieldDef;
    value: FieldValue | undefined;
    error?: string;
    setValue: (name: string, value: FieldValue) => void;
    onBlur: (field: FieldDef) => void;
}

function FieldView({ field, value, error, setValue, onBlur }: FieldProps) {
    const id = `fld-${field.name}`;
    const required = field.rules?.includes("required");
    const cls = `cd-field${field.span === 2 ? " cd-span-2" : ""}${error ? " has-error" : ""}`;
    const describedBy = error ? `${id}-err` : undefined;
    const errorEl = (
        <div className="cd-error-msg" id={`${id}-err`}>
            {error}
        </div>
    );
    const Label = (
        <>
            {field.label}
            {required && <span className="cd-req">*</span>}
        </>
    );

    if (field.adminOnly) {
        const shown = typeof value === "string" && value ? value : "";
        return (
            <div className={cls}>
                <label htmlFor={id}>{field.label}</label>
                <input id={id} className="cd-input" type="text" value={shown} placeholder="Completed by Clear Debt" readOnly tabIndex={-1} aria-readonly />
            </div>
        );
    }

    if (field.type === "checkboxGroup") {
        const selected = Array.isArray(value) ? value : [];
        return (
            <div className={cls} role="group" aria-labelledby={`${id}-label`} id={id}>
                <span className="cd-label" id={`${id}-label`} hidden>
                    {field.label}
                </span>
                <div className="cd-check-list">
                    {field.options?.filter((opt) => !opt.retired).map((opt) => (
                        <label className="cd-check" key={opt.value}>
                            <input
                                type="checkbox"
                                name={field.name}
                                value={opt.value}
                                checked={selected.includes(opt.value)}
                                onChange={(e) =>
                                    setValue(field.name, e.target.checked ? [...selected, opt.value] : selected.filter((v) => v !== opt.value))
                                }
                            />
                            <div>
                                <div className="cd-check-title">{opt.label}</div>
                                {opt.description && <div className="cd-check-desc">{opt.description}</div>}
                            </div>
                        </label>
                    ))}
                </div>
                {errorEl}
            </div>
        );
    }

    if (field.type === "checkbox") {
        return (
            <div className={cls}>
                <label className="cd-check">
                    <input
                        id={id}
                        type="checkbox"
                        name={field.name}
                        checked={value === true}
                        onChange={(e) => setValue(field.name, e.target.checked)}
                        onBlur={() => onBlur(field)}
                        aria-invalid={!!error}
                        aria-describedby={describedBy}
                    />
                    <div>
                        <div className="cd-check-title">{Label}</div>
                        {field.description && <div className="cd-check-desc">{field.description}</div>}
                    </div>
                </label>
                {errorEl}
            </div>
        );
    }

    if (field.type === "radio") {
        return (
            <div className={cls} role="radiogroup" aria-labelledby={`${id}-label`}>
                <span className="cd-label" id={`${id}-label`}>
                    {Label}
                </span>
                <div className="cd-radio-group">
                    {field.options?.map((opt, i) => (
                        <label className="cd-radio" key={opt.value}>
                            <input
                                id={i === 0 ? id : undefined}
                                type="radio"
                                name={field.name}
                                value={opt.value}
                                checked={value === opt.value}
                                onChange={() => setValue(field.name, opt.value)}
                                onBlur={() => onBlur(field)}
                                aria-describedby={describedBy}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
                {errorEl}
            </div>
        );
    }

    const common = {
        id,
        name: field.name,
        value: typeof value === "string" ? value : "",
        placeholder: field.placeholder,
        onBlur: () => onBlur(field),
        "aria-invalid": !!error,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
    };

    return (
        <div className={cls}>
            <label htmlFor={id}>{Label}</label>
            {field.type === "textarea" ? (
                <textarea {...common} className="cd-textarea" maxLength={field.maxLength ?? 4000} onChange={(e) => setValue(field.name, e.target.value)} />
            ) : (
                <input
                    {...common}
                    className="cd-input"
                    type={field.type}
                    inputMode={field.inputMode}
                    min={field.min}
                    step={field.step}
                    maxLength={field.type === "number" || field.type === "date" ? undefined : (field.maxLength ?? 300)}
                    autoComplete={autoCompleteFor(field)}
                    onChange={(e) => setValue(field.name, e.target.value)}
                />
            )}
            {errorEl}
        </div>
    );
}

// Autofill only for the person filling in the form, never for third parties.
function autoCompleteFor(field: FieldDef): string {
    switch (field.name) {
        case "fullName":
        case "consumerFullName":
            return "name";
        case "principalFirstName":
            return "given-name";
        case "principalSurname":
            return "family-name";
        case "email":
        case "consumerEmail":
            return "email";
        case "phone":
        case "consumerPhone":
        case "principalPhone":
            return "tel";
        case "address":
        case "consumerAddress":
        case "principalAddress":
            return "street-address";
        default:
            return "off";
    }
}
