"use client";

import { useEffect } from "react";

export default function ConfirmDialog({
    title,
    children,
    confirmLabel,
    danger,
    busy,
    onConfirm,
    onCancel,
}: {
    title: string;
    children: React.ReactNode;
    confirmLabel: string;
    danger?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [busy, onCancel]);

    return (
        <div className="cd-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cms-confirm-title" onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}>
            <div className="cd-modal">
                <div className="cd-modal-header" id="cms-confirm-title">
                    {title}
                </div>
                <div className="cd-modal-body">{children}</div>
                <div className="cd-modal-footer">
                    <button type="button" className="cd-btn cd-btn-outline" onClick={onCancel} disabled={busy}>
                        Cancel
                    </button>
                    <button type="button" className={`cd-btn ${danger ? "cd-btn-danger" : "cd-btn-primary"}`} onClick={onConfirm} disabled={busy} autoFocus>
                        {busy && <span className="cd-spinner" aria-hidden />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
