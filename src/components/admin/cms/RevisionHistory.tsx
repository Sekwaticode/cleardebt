"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/portal/Toast";
import { api } from "./api";
import ConfirmDialog from "./ConfirmDialog";

export interface RevisionItem {
    id: number;
    action: "update" | "reset" | "restore";
    when: string;
    who: string;
    isCurrent: boolean;
}

const ACTION_LABELS: Record<RevisionItem["action"], string> = {
    update: "Saved",
    reset: "Reset to default",
    restore: "Restored an earlier version",
};

export default function RevisionHistory({ sectionKey, revisions }: { sectionKey: string; revisions: RevisionItem[] }) {
    const router = useRouter();
    const toast = useToast();
    const [target, setTarget] = useState<RevisionItem | null>(null);
    const [busy, setBusy] = useState(false);

    if (revisions.length === 0) {
        return (
            <p className="cd-muted" style={{ margin: 0 }}>
                No changes yet. Every save, reset and restore will be listed here.
            </p>
        );
    }

    const restore = async () => {
        if (!target) return;
        setBusy(true);
        try {
            await api(`/api/admin/cms/sections/${sectionKey}/restore`, { method: "POST", body: { revisionId: target.id } });
            toast("Version restored and published.", "success");
            setTarget(null);
            router.refresh();
        } catch (e) {
            toast((e as Error).message, "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <ol className="cd-timeline has-actions">
                {revisions.map((r) => (
                    <li key={r.id}>
                        <span className={`cd-dot${r.isCurrent ? " is-ok" : ""}`} />
                        <div>
                            <strong>{ACTION_LABELS[r.action]}</strong>
                            {r.isCurrent && <span className="cd-chip cd-chip-ok">Live</span>}
                            <small>
                                {r.when} · {r.who}
                            </small>
                        </div>
                        {!r.isCurrent && (
                            <button type="button" className="cd-btn cd-btn-sm cd-btn-ghost" onClick={() => setTarget(r)}>
                                Restore
                            </button>
                        )}
                    </li>
                ))}
            </ol>
            {target && (
                <ConfirmDialog title="Restore this version?" confirmLabel="Restore & publish" busy={busy} onConfirm={restore} onCancel={() => setTarget(null)}>
                    {target.action === "reset"
                        ? "The section goes back to its built-in content."
                        : `The section's content from ${target.when} replaces what is live now.`}{" "}
                    Unsaved edits in the form will be lost. The current version stays in the history.
                </ConfirmDialog>
            )}
        </>
    );
}
