/* Content validation shared by the admin editor (instant feedback) and the
   API (the real gate). The sanitised value is rebuilt from the schema, so any
   key the schema doesn't define — a colour, a class name, a style — is dropped. */

import { SUPABASE_URL } from "@/lib/supabase/env";
import { MEDIA_BUCKET, type FieldDef, type MediaImage, type SectionDef } from "./types";

export type FieldErrors = Record<string, string>;
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export const MEDIA_URL_PREFIX = SUPABASE_URL
    ? `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/`
    : null;

/** Media must be a file bundled with the site or one from the CMS media bucket. */
export function isAllowedMediaSrc(src: unknown): src is string {
    if (typeof src !== "string" || !src || src.length > 1000) return false;
    if (src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/\\")) return true;
    return !!MEDIA_URL_PREFIX && src.startsWith(MEDIA_URL_PREFIX);
}

/** Links may be site-relative, anchors, http(s), mailto: or tel: — never javascript: or data:. */
export function isAllowedLink(value: string): boolean {
    if (value.length > 1000 || /\s/.test(value)) return false;
    if (value.startsWith("#")) return true;
    if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
    if (/^mailto:[^@]+@[^@]+$/i.test(value)) return true;
    if (/^tel:\+?[0-9-]{3,20}$/i.test(value)) return true;
    try {
        const u = new URL(value);
        return (u.protocol === "https:" || u.protocol === "http:") && !!u.hostname;
    } catch {
        return false;
    }
}

export function isMediaImage(v: unknown): v is MediaImage {
    return isObj(v) && typeof v.src === "string" && typeof v.width === "number" && typeof v.height === "number";
}

// Strip control characters (keeps tabs/newlines for multi-line fields).
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function sanitizeField(field: FieldDef, raw: unknown, path: string, errors: FieldErrors): unknown {
    switch (field.type) {
        case "text":
        case "textarea": {
            if (raw !== undefined && raw !== null && typeof raw !== "string") {
                errors[path] = "Must be text.";
                return "";
            }
            let value = String(raw ?? "").replace(CONTROL_RE, "");
            value = field.type === "text" ? value.replace(/[\r\n]+/g, " ").trim() : value.replace(/\r\n/g, "\n").trim();
            const max = field.maxLength ?? (field.type === "text" ? 200 : 2000);
            if (field.required && !value) errors[path] = "This field is required.";
            else if (value.length > max) errors[path] = `Keep this under ${max} characters (currently ${value.length}).`;
            else if (value && field.pattern && !new RegExp(field.pattern).test(value)) errors[path] = field.patternMessage ?? "Invalid format.";
            return value;
        }
        case "url": {
            const value = typeof raw === "string" ? raw.trim() : "";
            if (!value) {
                if (field.required) errors[path] = "This field is required.";
                return "";
            }
            if (!isAllowedLink(value)) {
                errors[path] = "Use a full link (https://…), a page path (/about), an anchor (#), mailto: or tel:.";
            }
            return value;
        }
        case "number": {
            const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
            if (!Number.isFinite(value)) {
                errors[path] = "Enter a number.";
                return field.min;
            }
            if (field.integer && !Number.isInteger(value)) errors[path] = "Enter a whole number.";
            else if (value < field.min || value > field.max) errors[path] = `Enter a number from ${field.min} to ${field.max}.`;
            return value;
        }
        case "image": {
            if (!isObj(raw) || !raw.src) {
                errors[path] = "Choose an image.";
                return null;
            }
            if (!isAllowedMediaSrc(raw.src)) {
                errors[path] = "Choose an image from the media library.";
                return null;
            }
            const width = Number(raw.width);
            const height = Number(raw.height);
            if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20000 || height > 20000) {
                errors[path] = "The image dimensions are missing — choose the image again.";
                return null;
            }
            const alt = typeof raw.alt === "string" ? raw.alt.replace(CONTROL_RE, "").replace(/[\r\n]+/g, " ").trim() : "";
            if (alt.length > 200) errors[path] = "Keep the description under 200 characters.";
            return { src: raw.src, width, height, alt } satisfies MediaImage;
        }
        case "video": {
            if (!isAllowedMediaSrc(raw)) {
                errors[path] = raw ? "Choose a video from the media library." : "Choose a video.";
                return "";
            }
            return raw;
        }
        case "group": {
            return sanitizeFields(field.fields, isObj(raw) ? raw : {}, `${path}.`, errors);
        }
        case "list": {
            const items = Array.isArray(raw) ? raw : [];
            const min = field.min ?? 0;
            const max = field.max ?? 100;
            if (items.length < min) errors[path] = min === max ? `This list needs exactly ${min} entries.` : `Add at least ${min} ${min === 1 ? "entry" : "entries"}.`;
            else if (items.length > max) errors[path] = `No more than ${max} entries.`;
            return items.slice(0, max).map((item, i) => sanitizeFields(field.fields, isObj(item) ? item : {}, `${path}.${i}.`, errors));
        }
    }
}

function sanitizeFields(fields: FieldDef[], input: Obj, prefix: string, errors: FieldErrors): Obj {
    const out: Obj = {};
    for (const f of fields) out[f.name] = sanitizeField(f, input[f.name], `${prefix}${f.name}`, errors);
    return out;
}

/** Validates content against a section schema. `value` only contains schema fields. */
export function sanitizeContent(def: SectionDef, input: unknown): { value: Obj; errors: FieldErrors } {
    const errors: FieldErrors = {};
    const value = sanitizeFields(def.fields, isObj(input) ? input : {}, "", errors);
    if (def.validate) {
        for (const [k, msg] of Object.entries(def.validate(value))) if (!errors[k]) errors[k] = msg;
    }
    return { value, errors };
}

/** An empty entry for a list field, used when an admin adds a new item. */
export function blankValue(fields: FieldDef[]): Obj {
    const out: Obj = {};
    for (const f of fields) {
        out[f.name] =
            f.type === "number" ? f.min : f.type === "image" ? null : f.type === "group" ? blankValue(f.fields) : f.type === "list" ? [] : "";
    }
    return out;
}

/**
 * Fills anything missing from stored content with the defaults, so content
 * saved under an older schema still renders, and new fields show their
 * built-in text until edited.
 */
export function mergeWithDefaults(fields: FieldDef[], stored: unknown, defaults: unknown): Obj {
    const s = isObj(stored) ? stored : {};
    const d = isObj(defaults) ? defaults : {};
    const out: Obj = {};
    for (const f of fields) {
        const sv = s[f.name];
        const dv = d[f.name];
        switch (f.type) {
            case "group":
                out[f.name] = mergeWithDefaults(f.fields, sv, dv);
                break;
            case "list": {
                const dl = Array.isArray(dv) ? dv : [];
                out[f.name] = Array.isArray(sv)
                    ? sv.map((item, i) => mergeWithDefaults(f.fields, item, dl[i] ?? dl[0] ?? blankValue(f.fields)))
                    : dl;
                break;
            }
            case "image":
                out[f.name] = isMediaImage(sv) && isAllowedMediaSrc(sv.src) ? sv : dv;
                break;
            case "video":
                out[f.name] = isAllowedMediaSrc(sv) ? sv : dv;
                break;
            case "number":
                out[f.name] = typeof sv === "number" && Number.isFinite(sv) ? sv : dv;
                break;
            default:
                out[f.name] = typeof sv === "string" ? sv : dv;
        }
    }
    return out;
}
