"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

/* React port of the original signature.js canvas pad (strokes, undo,
   clear, load existing image, device-pixel-ratio aware). Unlike the
   original, a pre-loaded signature stays visible underneath new strokes. */

type Point = { x: number; y: number };

export interface SignaturePadHandle {
    isEmpty(): boolean;
    /** True once the user drew, undid or cleared since load / last save. */
    isDirty(): boolean;
    markClean(): void;
    clear(): void;
    undo(): void;
    toDataURL(): string | null;
}

interface Props {
    initialImage?: string;
    label: string;
    onChange?: () => void;
}

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad({ initialImage, label, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const strokes = useRef<Point[][]>([]);
    const current = useRef<Point[] | null>(null);
    const background = useRef<HTMLImageElement | null>(null);
    const dirty = useRef(false);

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        const img = background.current;
        if (img) {
            const scale = Math.min(rect.width / img.width, rect.height / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (rect.width - w) / 2, (rect.height - h) / 2, w, h);
        }

        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0f172a";
        for (const stroke of strokes.current) {
            if (!stroke.length) continue;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
            ctx.stroke();
        }
    }, []);

    const resize = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        redraw();
    }, [redraw]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [resize]);

    useEffect(() => {
        background.current = null;
        if (!initialImage) return redraw();
        const img = new Image();
        img.onload = () => {
            background.current = img;
            redraw();
        };
        img.src = initialImage;
    }, [initialImage, redraw]);

    const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
        const rect = e.currentTarget.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const isEmpty = () => !background.current && strokes.current.every((s) => s.length === 0);

    useImperativeHandle(ref, () => ({
        isEmpty,
        isDirty: () => dirty.current,
        markClean: () => {
            dirty.current = false;
        },
        clear: () => {
            strokes.current = [];
            background.current = null;
            dirty.current = true;
            redraw();
            onChange?.();
        },
        undo: () => {
            strokes.current.pop();
            dirty.current = true;
            redraw();
            onChange?.();
        },
        toDataURL: () => (isEmpty() ? null : canvasRef.current?.toDataURL("image/png") ?? null),
    }));

    return (
        <canvas
            ref={canvasRef}
            className="cd-signature-canvas"
            role="img"
            aria-label={`${label} — draw with your mouse, finger or stylus`}
            onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                current.current = [point(e)];
                strokes.current.push(current.current);
                dirty.current = true;
                redraw();
            }}
            onPointerMove={(e) => {
                if (!current.current) return;
                e.preventDefault();
                current.current.push(point(e));
                redraw();
            }}
            onPointerUp={() => {
                if (current.current) onChange?.();
                current.current = null;
            }}
            onPointerCancel={() => {
                current.current = null;
            }}
        />
    );
});
