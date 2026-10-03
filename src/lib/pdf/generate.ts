import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import {
    COMPANY,
    allFields,
    formatDateTime,
    formatFieldValue,
    type Block,
    type FieldDef,
    type FormDefinition,
} from "@/lib/forms/definitions";
import type { SubmissionRow } from "@/lib/submissions/types";

/* ==========================================================
   Renders a submission to PDF entirely from stored data, so the
   user's copy and any admin regeneration are identical.
   Layout is driven by the form definition (sections, labels,
   terms text, signature pads).
   ========================================================== */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const FOOTER_SPACE = 48;
const CONTENT_W = A4.width - MARGIN * 2;
const COL_GAP = 18;
const COL_W = (CONTENT_W - COL_GAP) / 2;

const C = {
    ink: rgb(0.06, 0.09, 0.16),
    muted: rgb(0.36, 0.39, 0.46),
    line: rgb(0.85, 0.87, 0.9),
    panel: rgb(0.96, 0.965, 0.975),
    accent: rgb(0.32, 0.15, 1),
};

// Standard PDF fonts only cover WinAnsi; replace anything else rather than crash.
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
function pdfSafe(text: string): string {
    const normalised = text
        .replace(/\r\n?/g, "\n")
        .replace(/\t/g, "  ")
        .replace(/[‐‑‒]/g, "-");
    // Array.from iterates code points, so an emoji becomes one "?" rather than two.
    return Array.from(normalised)
        .map((ch) => {
            const code = ch.charCodeAt(0);
            if (ch === "\n") return ch;
            if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)) return ch;
            return WIN_ANSI_EXTRA.has(ch) ? ch : "?";
        })
        .join("");
}

interface Segment {
    text: string;
    font: PDFFont;
}

class PdfWriter {
    page!: PDFPage;
    y = 0;

    constructor(
        public doc: PDFDocument,
        public regular: PDFFont,
        public bold: PDFFont,
    ) {
        this.addPage();
    }

    addPage() {
        this.page = this.doc.addPage([A4.width, A4.height]);
        this.y = A4.height - MARGIN;
    }

    /** Starts a new page if `height` points won't fit. */
    ensure(height: number) {
        if (this.y - height < FOOTER_SPACE + 12) this.addPage();
    }

    wrapSegments(segments: Segment[], size: number, maxWidth: number): Segment[][] {
        const lines: Segment[][] = [];
        let line: Segment[] = [];
        let width = 0;
        const space = (font: PDFFont) => font.widthOfTextAtSize(" ", size);

        const pushWord = (word: string, font: PDFFont) => {
            let w = font.widthOfTextAtSize(word, size);
            // Break words longer than the line (e.g. long emails) by characters.
            while (w > maxWidth && word.length > 1) {
                let cut = word.length - 1;
                while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > maxWidth) cut--;
                if (line.length) lines.push(line);
                lines.push([{ text: word.slice(0, cut), font }]);
                line = [];
                width = 0;
                word = word.slice(cut);
                w = font.widthOfTextAtSize(word, size);
            }
            const gap = line.length ? space(font) : 0;
            if (line.length && width + gap + w > maxWidth) {
                lines.push(line);
                line = [];
                width = 0;
            }
            line.push({ text: (line.length ? " " : "") + word, font });
            width += (line.length > 1 ? gap : 0) + w;
        };

        for (const seg of segments) {
            const paragraphs = pdfSafe(seg.text).split("\n");
            paragraphs.forEach((para, i) => {
                if (i > 0) {
                    lines.push(line);
                    line = [];
                    width = 0;
                }
                para.split(/ +/).filter(Boolean).forEach((word) => pushWord(word, seg.font));
            });
        }
        if (line.length || !lines.length) lines.push(line);
        return lines;
    }

    /** Draws wrapped text at the current y (or a given y) and returns the height used. */
    text(
        content: string | Segment[],
        opts: { x?: number; size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; maxWidth?: number; lineGap?: number; y?: number; dryRun?: boolean } = {},
    ): number {
        const size = opts.size ?? 10;
        const x = opts.x ?? MARGIN;
        const maxWidth = opts.maxWidth ?? CONTENT_W;
        const lineHeight = size * 1.35 + (opts.lineGap ?? 0);
        const segments = typeof content === "string" ? [{ text: content, font: opts.font ?? this.regular }] : content;
        const lines = this.wrapSegments(segments, size, maxWidth);
        if (opts.dryRun) return lines.length * lineHeight;

        let y = opts.y ?? this.y;
        for (const words of lines) {
            // One text run per font change keeps copy/paste and text extraction clean.
            const line = words.reduce<Segment[]>((runs, w) => {
                const last = runs[runs.length - 1];
                if (last && last.font === w.font) last.text += w.text;
                else runs.push({ ...w });
                return runs;
            }, []);
            let cx = x;
            for (const seg of line) {
                this.page.drawText(seg.text, { x: cx, y: y - size, size, font: seg.font, color: opts.color ?? C.ink });
                cx += seg.font.widthOfTextAtSize(seg.text, size);
            }
            y -= lineHeight;
        }
        return lines.length * lineHeight;
    }

    measure(content: string, size: number, maxWidth: number, font = this.regular) {
        return this.text(content, { size, maxWidth, font, dryRun: true });
    }

    hr(color = C.line, gapBefore = 6, gapAfter = 10) {
        this.y -= gapBefore;
        this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: A4.width - MARGIN, y: this.y }, thickness: 0.75, color });
        this.y -= gapAfter;
    }

    checkbox(x: number, yTop: number, checked: boolean) {
        const s = 9;
        this.page.drawRectangle({ x, y: yTop - s - 1, width: s, height: s, borderColor: C.muted, borderWidth: 0.8 });
        if (checked) {
            this.page.drawLine({ start: { x: x + 2, y: yTop - 6 }, end: { x: x + 4, y: yTop - 8.5 }, thickness: 1.3, color: C.ink });
            this.page.drawLine({ start: { x: x + 4, y: yTop - 8.5 }, end: { x: x + 7.5, y: yTop - 2.5 }, thickness: 1.3, color: C.ink });
        }
    }
}

/* ----------------------------------------------------------
   Sections
   ---------------------------------------------------------- */

interface Cell {
    label: string;
    value: string;
    span?: 2;
}

function drawCells(w: PdfWriter, cells: Cell[]) {
    const LABEL = 7.5;
    const VALUE = 10;
    let i = 0;
    while (i < cells.length) {
        const row: Cell[] = cells[i].span === 2 || i + 1 >= cells.length || cells[i + 1].span === 2 ? [cells[i]] : [cells[i], cells[i + 1]];
        const full = row.length === 1 && row[0].span === 2;
        const width = full ? CONTENT_W : COL_W;
        const height = Math.max(...row.map((c) => LABEL * 1.35 + 2 + w.measure(c.value, VALUE, width))) + 8;
        w.ensure(height);
        row.forEach((c, idx) => {
            const x = MARGIN + idx * (COL_W + COL_GAP);
            w.text(c.label.toUpperCase(), { x, size: LABEL, font: w.bold, color: C.muted, maxWidth: width });
            w.text(c.value, { x, size: VALUE, maxWidth: width, y: w.y - LABEL * 1.35 - 2 });
        });
        w.y -= height;
        i += row.length;
    }
}

function drawOptionList(w: PdfWriter, field: FieldDef, selected: unknown) {
    const picked = new Set(Array.isArray(selected) ? selected.map(String) : []);
    w.ensure(14);
    w.text(field.label.toUpperCase(), { size: 7.5, font: w.bold, color: C.muted });
    w.y -= 13;
    for (const opt of (field.options ?? []).filter((o) => !o.retired || picked.has(o.value))) {
        const h = w.measure(opt.label, 10, CONTENT_W - 18) + 4;
        w.ensure(h);
        w.checkbox(MARGIN, w.y, picked.has(opt.value));
        w.text(opt.label, { x: MARGIN + 16, size: 10, maxWidth: CONTENT_W - 18, font: picked.has(opt.value) ? w.bold : w.regular });
        w.y -= h;
    }
    w.y -= 6;
}

function drawSingleCheckbox(w: PdfWriter, field: FieldDef, value: unknown) {
    const checked = value === true || (Array.isArray(value) && value.length > 0);
    const h = w.measure(field.label, 10, CONTENT_W - 18) + 8;
    w.ensure(h);
    w.checkbox(MARGIN, w.y, checked);
    w.text(field.label, { x: MARGIN + 16, size: 10, maxWidth: CONTENT_W - 18, font: w.bold });
    w.y -= h;
}

function drawSignatures(
    w: PdfWriter,
    sigs: { name: string; label: string }[],
    images: Record<string, PDFImage>,
) {
    const BOX_H = 78;
    for (let i = 0; i < sigs.length; i += 2) {
        const pair = sigs.slice(i, i + 2);
        w.ensure(BOX_H + 30);
        pair.forEach((sig, idx) => {
            const x = MARGIN + idx * (COL_W + COL_GAP);
            const top = w.y;
            const img = images[sig.name];
            if (img) {
                const scale = Math.min((COL_W - 8) / img.width, (BOX_H - 8) / img.height);
                const iw = img.width * scale;
                const ih = img.height * scale;
                w.page.drawImage(img, { x: x + 4, y: top - BOX_H + 4 + (BOX_H - 8 - ih) / 2, width: iw, height: ih });
            } else {
                w.text("Not signed", { x: x + 4, y: top - BOX_H / 2 + 5, size: 9, color: C.muted });
            }
            w.page.drawLine({ start: { x, y: top - BOX_H }, end: { x: x + COL_W, y: top - BOX_H }, thickness: 0.8, color: C.ink });
            w.text(sig.label, { x, y: top - BOX_H - 4, size: 8.5, font: w.bold, maxWidth: COL_W });
        });
        w.y -= BOX_H + 26;
    }
}

function drawBlock(
    w: PdfWriter,
    block: Block,
    values: Record<string, unknown>,
    images: Record<string, PDFImage>,
) {
    switch (block.kind) {
        case "static":
            drawCells(w, block.items);
            break;

        case "paragraphs":
            for (const p of block.items) {
                const segs: Segment[] = p.lead ? [{ text: p.lead + " ", font: w.bold }, { text: p.text, font: w.regular }] : [{ text: p.text, font: w.regular }];
                const h = w.text(segs, { size: 9.5, dryRun: true });
                w.ensure(h);
                w.y -= w.text(segs, { size: 9.5 }) + 5;
            }
            break;

        case "list":
            block.items.forEach((item, i) => {
                const marker = block.ordered ? `${i + 1}.` : "•";
                const h = w.measure(item, 9.5, CONTENT_W - 18);
                w.ensure(h);
                w.text(marker, { size: 9.5, maxWidth: 16 });
                w.y -= w.text(item, { x: MARGIN + 16, size: 9.5, maxWidth: CONTENT_W - 18 }) + 4;
            });
            w.y -= 4;
            break;

        case "fields": {
            let pending: Cell[] = [];
            const flush = () => {
                if (pending.length) drawCells(w, pending);
                pending = [];
            };
            for (const f of block.fields) {
                if (f.type === "checkboxGroup") {
                    flush();
                    drawOptionList(w, f, values[f.name]);
                } else if (f.type === "checkbox") {
                    flush();
                    drawSingleCheckbox(w, f, values[f.name]);
                } else {
                    pending.push({ label: f.label, value: formatFieldValue(f, values[f.name]), span: f.span });
                }
            }
            flush();
            break;
        }

        case "signatures":
            drawSignatures(w, block.signatures, images);
            break;
    }
}

let logoCache: Uint8Array | null | undefined;
async function loadLogo(): Promise<Uint8Array | null> {
    if (logoCache !== undefined) return logoCache;
    try {
        logoCache = new Uint8Array(await readFile(path.join(process.cwd(), "src/assets/images/logo.jpeg")));
    } catch {
        logoCache = null; // PDF still renders, just without the logo.
    }
    return logoCache;
}

export interface RenderInput {
    def: FormDefinition;
    submission: SubmissionRow;
    /** PNG bytes keyed by signature pad name. */
    signatures: Record<string, Uint8Array>;
}

export async function renderSubmissionPdf({ def, submission, signatures }: RenderInput): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    doc.setTitle(`${def.heading} — ${submission.reference}`);
    doc.setAuthor(COMPANY.name);
    doc.setSubject(def.title);
    doc.setCreator("Clear Debt forms portal");
    doc.setCreationDate(new Date());

    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const w = new PdfWriter(doc, regular, bold);

    const images: Record<string, PDFImage> = {};
    for (const [name, bytes] of Object.entries(signatures)) {
        try {
            images[name] = await doc.embedPng(bytes);
        } catch (err) {
            console.error(`[pdf] could not embed signature "${name}"`, err);
        }
    }

    // ---- Letterhead ----
    const logoBytes = await loadLogo();
    let textX = MARGIN;
    if (logoBytes) {
        try {
            const logo = await doc.embedJpg(logoBytes);
            w.page.drawImage(logo, { x: MARGIN, y: w.y - 44, width: 44, height: 44 });
            textX = MARGIN + 56;
        } catch {
            /* ignore — logo is decorative */
        }
    }
    w.text(COMPANY.name, { x: textX, y: w.y - 6, size: 13, font: bold });
    w.text(`Reg. ${COMPANY.registration}  ·  ${COMPANY.address}`, { x: textX, y: w.y - 24, size: 8, color: C.muted });
    w.text(`${COMPANY.email}  ·  ${COMPANY.phone}`, { x: textX, y: w.y - 35, size: 8, color: C.muted });
    w.y -= 52;
    w.hr(C.accent, 0, 18);

    w.text(def.heading, { size: 18, font: bold });
    w.y -= 30;

    // ---- Summary panel ----
    const fields = submission.fields ?? {};
    const meta: [string, string][] = [
        ["Reference", submission.reference],
        ["Form", def.title],
        ["Submitted", formatDateTime(submission.submitted_at ?? submission.created_at)],
        ["Client", submission.client_name || "—"],
        ["ID number", submission.id_number || "—"],
        ["Contact", submission.phone || submission.email || "—"],
    ];
    const panelH = 64;
    w.page.drawRectangle({ x: MARGIN, y: w.y - panelH, width: CONTENT_W, height: panelH, color: C.panel, borderColor: C.line, borderWidth: 0.75 });
    const cellW = (CONTENT_W - 24) / 3;
    meta.forEach(([label, value], i) => {
        const x = MARGIN + 12 + (i % 3) * cellW;
        const y = w.y - 10 - Math.floor(i / 3) * 27;
        w.text(label.toUpperCase(), { x, y, size: 7, font: bold, color: C.muted, maxWidth: cellW - 8 });
        const v = pdfSafe(value);
        let shown = v;
        while (shown.length > 1 && regular.widthOfTextAtSize(shown, 9.5) > cellW - 8) shown = shown.slice(0, -1);
        w.page.drawText(shown === v ? v : `${shown.slice(0, -1)}…`, { x, y: y - 20, size: 9.5, font: regular, color: C.ink });
    });
    w.y -= panelH + 20;

    // ---- Sections ----
    for (const section of def.sections) {
        w.ensure(60);
        const title = `${section.badge}.  ${section.title}`;
        w.text(title, { size: 11.5, font: bold });
        w.y -= 17;
        if (section.description) {
            w.y -= w.text(section.description, { size: 8.5, color: C.muted });
        }
        w.hr(C.line, 2, 10);
        for (const block of section.blocks) drawBlock(w, block, fields, images);
        w.y -= 8;
    }

    // Values stored under names the current definition no longer knows (legacy data).
    const known = new Set(allFields(def).map((f) => f.name));
    const extra = Object.entries(fields).filter(([k]) => !known.has(k));
    if (extra.length) {
        w.ensure(60);
        w.text("Additional information", { size: 11.5, font: bold });
        w.y -= 17;
        w.hr(C.line, 2, 10);
        drawCells(w, extra.map(([k, v]) => ({ label: k, value: formatFieldValue(undefined, v) })));
    }

    // ---- Footer on every page ----
    const pages = doc.getPages();
    const generated = `Generated ${formatDateTime(new Date().toISOString())}`;
    pages.forEach((page, i) => {
        page.drawLine({ start: { x: MARGIN, y: 36 }, end: { x: A4.width - MARGIN, y: 36 }, thickness: 0.5, color: C.line });
        page.drawText(pdfSafe(`${COMPANY.name}  ·  ${submission.reference}  ·  ${generated}`), { x: MARGIN, y: 24, size: 7.5, font: regular, color: C.muted });
        const label = `Page ${i + 1} of ${pages.length}`;
        page.drawText(label, { x: A4.width - MARGIN - regular.widthOfTextAtSize(label, 7.5), y: 24, size: 7.5, font: regular, color: C.muted });
    });

    return doc.save();
}
