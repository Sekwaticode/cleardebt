"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Variant = "success" | "error" | "info";
interface ToastItem {
    id: number;
    message: string;
    variant: Variant;
}

const ToastContext = createContext<(message: string, variant?: Variant) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const toast = useCallback((message: string, variant: Variant = "success") => {
        const id = Date.now() + Math.random();
        setItems((prev) => [...prev, { id, message, variant }]);
        setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), variant === "error" ? 6000 : 3200);
    }, []);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="cd-toast-wrap" role="status" aria-live="polite">
                {items.map((t) => (
                    <div key={t.id} className={`cd-toast ${t.variant}`}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
