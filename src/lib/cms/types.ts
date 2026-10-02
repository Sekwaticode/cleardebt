/* Field types the CMS can edit. There is deliberately no field type for
   colours, class names, sizes or layout: a section's structure and styling
   live in its component, and only the content described here is editable. */

/** An image as stored in content. Compatible with next/image's static-import shape. */
export interface MediaImage {
    src: string;
    width: number;
    height: number;
    alt: string;
}

interface BaseField {
    name: string;
    label: string;
    help?: string;
}

export interface TextField extends BaseField {
    type: "text" | "textarea";
    maxLength?: number;
    required?: boolean;
    placeholder?: string;
    /** Regular expression the value must match (when not empty). */
    pattern?: string;
    patternMessage?: string;
}

export interface UrlField extends BaseField {
    type: "url";
    required?: boolean;
    placeholder?: string;
}

export interface NumberField extends BaseField {
    type: "number";
    min: number;
    max: number;
    integer?: boolean;
}

export interface ImageField extends BaseField {
    type: "image";
}

export interface VideoField extends BaseField {
    type: "video";
}

export interface GroupField extends BaseField {
    type: "group";
    fields: FieldDef[];
}

export interface ListField extends BaseField {
    type: "list";
    /** Singular noun for one entry, e.g. "Question". */
    itemLabel: string;
    /** Field whose value is shown as each entry's heading in the editor. */
    titleField?: string;
    min?: number;
    max?: number;
    fields: FieldDef[];
}

export type FieldDef = TextField | UrlField | NumberField | ImageField | VideoField | GroupField | ListField;

export type SectionGroup = "Sections" | "Components" | "Navigation";

export interface SectionDef {
    key: string;
    name: string;
    group: SectionGroup;
    /** Source file, shown to admins for orientation. */
    file: string;
    description: string;
    /** Public pages the section appears on (empty = not currently placed on a page). */
    usedOn: { label: string; href: string }[];
    fields: FieldDef[];
    /** Extra rules that span several fields. Returns path → message. */
    validate?: (value: Record<string, unknown>) => Record<string, string>;
}

export interface MediaRow {
    id: string;
    path: string;
    url: string;
    kind: "image" | "video";
    mime_type: string;
    size_bytes: number | null;
    width: number | null;
    height: number | null;
    alt: string;
    original_name: string | null;
    created_at: string;
}

export const MEDIA_BUCKET = "site-media";

export const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
