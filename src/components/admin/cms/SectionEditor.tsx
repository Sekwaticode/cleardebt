"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_CONTENT, type SectionKey } from "@/lib/cms/defaults";
import { getSectionDef } from "@/lib/cms/sections";
import { sanitizeContent, type FieldErrors } from "@/lib/cms/validate";
import { useToast } from "@/components/portal/Toast";
import { api, ApiError } from "./api";
import ConfirmDialog from "./ConfirmDialog";
import { Fields } from "./FieldEditor";

type Obj = Record<string, unknown>;

export default function SectionEditor({
    sectionKey,
    initial,
    customised,
    version,
}: {
    sectionKey: SectionKey;
    initial: Obj;
    customised: boolean;
    /** Identifies the live version (latest revision id); changes after save/reset/restore. */
    version: string;
}) {
    const def = getSectionDef(sectionKey)!;
    const router = useRouter();
    const toast = useToast();
    const [saved, setSaved] = useState(initial);
    const [value, setValue] = useState(initial);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [busy, setBusy] = useState<"save" | "reset" | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(saved), [value, saved]);
    const defaults = DEFAULT_CONTENT[sectionKey] as Obj;
    const matchesDefaults = useMemo(() => JSON.stringify(value) === JSON.stringify(defaults), [value, defaults]);

    // A new live version (saved, reset or restored, here or in another tab) replaces the form.
    useEffect(() => {
        setSaved(initial);
        setValue(initial);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]);

    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const focusFirstError = () =>
        requestAnimationFrame(() => {
            const el = document.querySelector<HTMLElement>("[data-error='true']");
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            el?.querySelector<HTMLElement>("input, textarea, button")?.focus({ preventScroll: true });
        });

    const save = useCallback(async () => {
        const { value: clean, errors: errs } = sanitizeContent(def, value);
        setErrors(errs);
        if (Object.keys(errs).length) {
            toast("Please fix the highlighted fields.", "error");
            return focusFirstError();
        }
        setBusy("save");
        try {
            await api(`/api/admin/cms/sections/${sectionKey}`, { method: "PUT", body: { content: clean } });
            setValue(clean);
            setSaved(clean);
            toast("Saved and published to the website.", "success");
            router.refresh();
        } catch (e) {
            if (e instanceof ApiError && e.fieldErrors) {
                setErrors(e.fieldErrors);
                focusFirstError();
            }
            toast((e as Error).message, "error");
        } finally {
            setBusy(null);
        }
    }, [def, value, sectionKey, toast, router]);

    // Ctrl/Cmd + S saves.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (dirty && !busy) save();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dirty, busy, save]);

    const reset = async () => {
        setBusy("reset");
        try {
            await api(`/api/admin/cms/sections/${sectionKey}`, { method: "DELETE" });
            setValue(defaults);
            setSaved(defaults);
            setErrors({});
            setConfirmReset(false);
            toast("Reset to the built-in content.", "success");
            router.refresh();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(null);
        }
    };

    return (
        <>
            <form
                className="cd-card"
                onSubmit={(e) => {
                    e.preventDefault();
                    save();
                }}
                noValidate
            >
                <div className="cd-card-header">
                    <div>
                        <h2>Content</h2>
                        <p>Texts, links and media only — the section&apos;s layout, colours and styling stay as designed.</p>
                    </div>
                    {customised && (
                        <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" style={{ color: "var(--cd-danger)" }} onClick={() => setConfirmReset(true)} disabled={!!busy}>
                            Reset to default
                        </button>
                    )}
                </div>
                <div className="cd-card-body">
                    <Fields fields={def.fields} value={value} defaults={defaults} onChange={setValue} prefix="" errors={errors} />
                </div>

                <div className={`cd-savebar${dirty ? " is-dirty" : ""}`}>
                    <span className="cd-savebar-status">
                        {dirty ? (
                            <>
                                <span className="cd-dot-live" aria-hidden /> Unsaved changes
                            </>
                        ) : customised ? (
                            "All changes published"
                        ) : matchesDefaults ? (
                            "Showing the built-in content"
                        ) : (
                            "No changes"
                        )}
                    </span>
                    <div className="cd-actions">
                        <button type="button" className="cd-btn cd-btn-outline" disabled={!dirty || !!busy} onClick={() => setConfirmDiscard(true)}>
                            Discard
                        </button>
                        <button type="submit" className="cd-btn cd-btn-primary" disabled={!dirty || !!busy}>
                            {busy === "save" && <span className="cd-spinner" aria-hidden />}
                            Save &amp; publish
                        </button>
                    </div>
                </div>
            </form>

            {confirmReset && (
                <ConfirmDialog title={`Reset ${def.name} to default?`} confirmLabel="Reset to default" danger busy={busy === "reset"} onConfirm={reset} onCancel={() => setConfirmReset(false)}>
                    The custom content is removed and the website shows the built-in content again. The current version stays in the history, so you can restore it later.
                </ConfirmDialog>
            )}
            {confirmDiscard && (
                <ConfirmDialog
                    title="Discard unsaved changes?"
                    confirmLabel="Discard changes"
                    danger
                    onConfirm={() => {
                        setValue(saved);
                        setErrors({});
                        setConfirmDiscard(false);
                    }}
                    onCancel={() => setConfirmDiscard(false)}
                >
                    Your edits since the last save will be lost.
                </ConfirmDialog>
            )}
        </>
    );
}
