"use client";

import { useState } from "react";
import type { FieldDef, ImageField, ListField, MediaImage, VideoField } from "@/lib/cms/types";
import { blankValue, type FieldErrors } from "@/lib/cms/validate";
import MediaPicker from "./MediaPicker";

type Obj = Record<string, unknown>;

const idFor = (path: string) => `cms-${path.replace(/[^a-zA-Z0-9]+/g, "-")}`;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Renders inputs for a list of schema fields. Recurses into groups and lists. */
export function Fields({
    fields,
    value,
    defaults,
    onChange,
    prefix,
    errors,
}: {
    fields: FieldDef[];
    value: Obj;
    /** Built-in values at this level (undefined inside list entries). */
    defaults?: Obj;
    onChange: (next: Obj) => void;
    prefix: string;
    errors: FieldErrors;
}) {
    const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });
    return (
        <div className="cd-cms-fields">
            {fields.map((f) => (
                <Field
                    key={f.name}
                    field={f}
                    value={value[f.name]}
                    defaultValue={defaults?.[f.name]}
                    onChange={(v) => set(f.name, v)}
                    path={`${prefix}${f.name}`}
                    errors={errors}
                />
            ))}
        </div>
    );
}

function Field({
    field,
    value,
    defaultValue,
    onChange,
    path,
    errors,
}: {
    field: FieldDef;
    value: unknown;
    defaultValue: unknown;
    onChange: (v: unknown) => void;
    path: string;
    errors: FieldErrors;
}) {
    const id = idFor(path);
    const error = errors[path];

    if (field.type === "group") {
        return (
            <fieldset className="cd-cms-group">
                <legend>{field.label}</legend>
                {field.help && <p className="cd-cms-help">{field.help}</p>}
                <Fields fields={field.fields} value={(value as Obj) ?? {}} defaults={defaultValue as Obj | undefined} onChange={onChange} prefix={`${path}.`} errors={errors} />
            </fieldset>
        );
    }

    if (field.type === "list") {
        return <ListEditor field={field} value={Array.isArray(value) ? (value as Obj[]) : []} onChange={onChange} path={path} errors={errors} />;
    }

    if (field.type === "image" || field.type === "video") {
        return <MediaInput field={field} value={value} defaultValue={defaultValue} onChange={onChange} path={path} error={error} />;
    }

    const label = (
        <label htmlFor={id}>
            {field.label}
            {"required" in field && field.required && <span className="cd-req">*</span>}
        </label>
    );
    const help = field.help && <span className="cd-cms-help">{field.help}</span>;
    const errorMsg = (
        <span className="cd-error-msg" id={`${id}-err`}>
            {error}
        </span>
    );
    const common = {
        id,
        "aria-invalid": !!error || undefined,
        "aria-describedby": error ? `${id}-err` : undefined,
    };
    const isDefault = defaultValue !== undefined && same(value, defaultValue);
    const resetBtn =
        defaultValue !== undefined && !isDefault ? (
            <button type="button" className="cd-linkbtn" onClick={() => onChange(defaultValue)}>
                Use default
            </button>
        ) : null;

    return (
        <div className={`cd-field${error ? " has-error" : ""}`} data-error={error ? "true" : undefined}>
            <div className="cd-cms-label-row">
                {label}
                {resetBtn}
            </div>
            {field.type === "textarea" ? (
                <textarea
                    {...common}
                    className="cd-textarea"
                    rows={Math.min(10, Math.max(3, Math.ceil(String(value ?? "").length / 90)))}
                    value={String(value ?? "")}
                    maxLength={(field.maxLength ?? 2000) + 50}
                    placeholder={field.placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : field.type === "number" ? (
                <input
                    {...common}
                    className="cd-input cd-input-num"
                    type="number"
                    inputMode="numeric"
                    min={field.min}
                    max={field.max}
                    step={field.integer ? 1 : "any"}
                    value={typeof value === "number" && Number.isFinite(value) ? value : ""}
                    onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
                />
            ) : (
                <input
                    {...common}
                    className="cd-input"
                    type="text"
                    inputMode={field.type === "url" ? "url" : undefined}
                    value={String(value ?? "")}
                    maxLength={field.type === "text" ? (field.maxLength ?? 200) + 50 : 1000}
                    placeholder={field.placeholder ?? (field.type === "url" ? "https://… or /page" : undefined)}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
            {field.type !== "number" && "maxLength" in field && field.maxLength && String(value ?? "").length > field.maxLength * 0.8 && (
                <span className={`cd-cms-count${String(value ?? "").length > field.maxLength ? " is-over" : ""}`}>
                    {String(value ?? "").length}/{field.maxLength}
                </span>
            )}
            {help}
            {errorMsg}
        </div>
    );
}

function MediaInput({
    field,
    value,
    defaultValue,
    onChange,
    path,
    error,
}: {
    field: ImageField | VideoField;
    value: unknown;
    defaultValue: unknown;
    onChange: (v: unknown) => void;
    path: string;
    error?: string;
}) {
    const [picking, setPicking] = useState(false);
    const id = idFor(path);
    const isImage = field.type === "image";
    const image = isImage ? (value as MediaImage | null) : null;
    const src = isImage ? image?.src : typeof value === "string" ? value : "";
    const canReset = defaultValue !== undefined && !same(value, defaultValue);

    return (
        <div className={`cd-field cd-media-field${error ? " has-error" : ""}`} data-error={error ? "true" : undefined}>
            <div className="cd-cms-label-row">
                <span className="cd-label" id={`${id}-label`}>
                    {field.label}
                </span>
            </div>
            <div className="cd-media-row">
                <div className="cd-media-preview" aria-labelledby={`${id}-label`}>
                    {src ? (
                        isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt={image?.alt ?? ""} />
                        ) : (
                            <video src={src} muted loop playsInline controls preload="metadata" />
                        )
                    ) : (
                        <span className="cd-muted">No {field.type}</span>
                    )}
                </div>
                <div className="cd-stack cd-media-side">
                    {image && (
                        <span className="cd-muted" style={{ fontSize: 12 }}>
                            {image.width}×{image.height}px
                        </span>
                    )}
                    <div className="cd-actions">
                        <button type="button" className="cd-btn cd-btn-sm cd-btn-outline" onClick={() => setPicking(true)}>
                            {src ? `Replace ${field.type}` : `Choose ${field.type}`}
                        </button>
                        {canReset && (
                            <button type="button" className="cd-btn cd-btn-sm cd-btn-ghost" onClick={() => onChange(defaultValue)}>
                                Use default
                            </button>
                        )}
                    </div>
                    {isImage && image && (
                        <div className="cd-field">
                            <label htmlFor={`${id}-alt`} className="cd-cms-sublabel">
                                Description (alt text)
                            </label>
                            <input
                                id={`${id}-alt`}
                                className="cd-input cd-input-sm"
                                value={image.alt}
                                maxLength={250}
                                placeholder="Describe the image for screen readers"
                                onChange={(e) => onChange({ ...image, alt: e.target.value })}
                            />
                        </div>
                    )}
                </div>
            </div>
            {field.help && <span className="cd-cms-help">{field.help}</span>}
            <span className="cd-error-msg">{error}</span>
            {picking && (
                <MediaPicker
                    kind={field.type}
                    onClose={() => setPicking(false)}
                    onSelect={(m) => {
                        setPicking(false);
                        if (isImage) {
                            onChange({ src: m.url, width: m.width ?? 0, height: m.height ?? 0, alt: m.alt || image?.alt || "" });
                        } else {
                            onChange(m.url);
                        }
                    }}
                />
            )}
        </div>
    );
}

function ListEditor({ field, value, onChange, path, errors }: { field: ListField; value: Obj[]; onChange: (v: Obj[]) => void; path: string; errors: FieldErrors }) {
    const min = field.min ?? 0;
    const max = field.max ?? 100;
    const fixed = min === max;
    const error = errors[path];
    const [openIndex, setOpenIndex] = useState<number | null>(value.length <= 3 ? -1 : null);

    const titleOf = (item: Obj, i: number) => {
        const t = field.titleField ? item[field.titleField] : undefined;
        const s = typeof t === "string" ? t.trim() : "";
        return s || `${field.itemLabel} ${i + 1}`;
    };
    const move = (from: number, to: number) => {
        const next = value.slice();
        const [it] = next.splice(from, 1);
        next.splice(to, 0, it);
        onChange(next);
        setOpenIndex(to);
    };
    const hasErrorIn = (i: number) => Object.keys(errors).some((k) => k.startsWith(`${path}.${i}.`));

    return (
        <fieldset className={`cd-cms-group cd-cms-list${error ? " has-error" : ""}`} data-error={error ? "true" : undefined}>
            <legend>
                {field.label} <span className="cd-muted">({value.length}{fixed ? "" : ` of max ${max}`})</span>
            </legend>
            {field.help && <p className="cd-cms-help">{field.help}</p>}
            {error && <p className="cd-cms-list-error">{error}</p>}

            <ol className="cd-cms-items">
                {value.map((item, i) => {
                    const open = openIndex === -1 || openIndex === i || hasErrorIn(i);
                    return (
                        <li key={i} className={`cd-cms-item${open ? " is-open" : ""}${hasErrorIn(i) ? " has-error" : ""}`}>
                            <div className="cd-cms-item-head">
                                <button
                                    type="button"
                                    className="cd-cms-item-toggle"
                                    aria-expanded={open}
                                    onClick={() => setOpenIndex(open ? null : i)}
                                >
                                    <span className="cd-cms-item-num">{i + 1}</span>
                                    <span className="cd-cms-item-title">{titleOf(item, i)}</span>
                                    <span className="cd-cms-chevron" aria-hidden>
                                        ▾
                                    </span>
                                </button>
                                <div className="cd-cms-item-actions">
                                    <button type="button" className="cd-iconbtn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${titleOf(item, i)} up`} title="Move up">
                                        ↑
                                    </button>
                                    <button type="button" className="cd-iconbtn" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Move ${titleOf(item, i)} down`} title="Move down">
                                        ↓
                                    </button>
                                    {!fixed && (
                                        <>
                                            <button
                                                type="button"
                                                className="cd-iconbtn"
                                                onClick={() => {
                                                    const next = value.slice();
                                                    next.splice(i + 1, 0, structuredClone(item));
                                                    onChange(next);
                                                    setOpenIndex(i + 1);
                                                }}
                                                disabled={value.length >= max}
                                                aria-label={`Duplicate ${titleOf(item, i)}`}
                                                title="Duplicate"
                                            >
                                                ⧉
                                            </button>
                                            <button
                                                type="button"
                                                className="cd-iconbtn is-danger"
                                                onClick={() => {
                                                    onChange(value.filter((_, j) => j !== i));
                                                    setOpenIndex(null);
                                                }}
                                                disabled={value.length <= min}
                                                aria-label={`Delete ${titleOf(item, i)}`}
                                                title={value.length <= min ? `At least ${min} required` : "Delete"}
                                            >
                                                ✕
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            {open && (
                                <div className="cd-cms-item-body">
                                    <Fields
                                        fields={field.fields}
                                        value={item}
                                        onChange={(next) => onChange(value.map((it, j) => (j === i ? next : it)))}
                                        prefix={`${path}.${i}.`}
                                        errors={errors}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>

            {!fixed && (
                <button
                    type="button"
                    className="cd-btn cd-btn-sm cd-btn-outline"
                    onClick={() => {
                        onChange([...value, blankValue(field.fields)]);
                        setOpenIndex(value.length);
                    }}
                    disabled={value.length >= max}
                >
                    + Add {field.itemLabel.toLowerCase()}
                </button>
            )}
        </fieldset>
    );
}
