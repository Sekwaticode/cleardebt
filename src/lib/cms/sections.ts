/* The editable-content schema for every website section. Only the fields
   listed here can be changed from the admin; the server drops anything else,
   so styling, colours and layout always stay as coded in the components. */

import type { SectionKey } from "./defaults";
import type { FieldDef, SectionDef } from "./types";

const text = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef =>
    ({ type: "text", name, label, maxLength: 200, ...extra }) as FieldDef;
const textarea = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef =>
    ({ type: "textarea", name, label, maxLength: 2000, ...extra }) as FieldDef;
const url = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef =>
    ({ type: "url", name, label, ...extra }) as FieldDef;
const image = (name: string, label: string, help?: string): FieldDef => ({ type: "image", name, label, help });

/** A heading where the middle part is shown in the site's highlight colour. */
const heading = (label = "Heading"): FieldDef => ({
    type: "group",
    name: "heading",
    label,
    help: "The highlighted words appear in the site's accent colour.",
    fields: [
        text("before", "Text before highlight", { maxLength: 150 }),
        text("highlight", "Highlighted words", { maxLength: 80 }),
        text("after", "Text after highlight", { maxLength: 150 }),
    ],
});

const tag = (label = "Tag"): FieldDef => text("tag", label, { maxLength: 40, required: true, help: "The small pill above the heading." });

const HOME = { label: "Home", href: "/" };
const ABOUT = { label: "About", href: "/about" };
const CONTACT = { label: "Contact", href: "/contact" };
const TESTIMONIALS = { label: "Testimonials", href: "/testimonials" };

export const SECTIONS: SectionDef[] = [
    {
        key: "hero",
        name: "Hero",
        group: "Sections",
        file: "src/sections/Hero.tsx",
        description: "The first thing visitors see: badge, main heading, introduction and the WhatsApp enquiry box.",
        usedOn: [HOME],
        fields: [
            text("badge", "Badge", { maxLength: 80 }),
            text("title", "Main heading", { required: true }),
            textarea("description", "Introduction"),
            text("inputPlaceholder", "Enquiry box placeholder", { maxLength: 120 }),
            text("buttonText", "Button text", { maxLength: 30, required: true }),
            text("whatsappNumber", "WhatsApp number", {
                required: true,
                maxLength: 15,
                pattern: "^[0-9]{8,15}$",
                patternMessage: "Use the international format with digits only, e.g. 27793932311.",
                help: "Enquiries typed into the box open a WhatsApp chat with this number.",
            }),
        ],
    },
    {
        key: "logoTicker",
        name: "Logo ticker",
        group: "Sections",
        file: "src/sections/LogoTicker.tsx",
        description: "The scrolling strip of service logos under the hero.",
        usedOn: [HOME],
        fields: [
            text("heading", "Heading"),
            {
                type: "list",
                name: "logos",
                label: "Logos",
                itemLabel: "Logo",
                min: 1,
                max: 12,
                fields: [image("image", "Logo image", "Transparent PNGs look best on the dark background.")],
            },
        ],
    },
    {
        key: "introduction",
        name: "Introduction",
        group: "Sections",
        file: "src/sections/Introduction.tsx",
        description: "The scroll-revealed “Introducing Clear Debt” statement with the logo.",
        usedOn: [HOME, ABOUT],
        fields: [
            tag(),
            image("image", "Image"),
            text("leadText", "Opening words", { help: "Always shown in full." }),
            textarea("revealText", "Statement", { help: "Revealed word by word as the visitor scrolls.", maxLength: 1200 }),
            text("closingText", "Closing line"),
        ],
    },
    {
        key: "features",
        name: "Features",
        group: "Sections",
        file: "src/sections/Features.tsx (cards rendered by FeatureCard.tsx)",
        description: "The three feature cards: community avatars, the “Get some help” card and the ctrl/alt/del keys.",
        usedOn: [HOME, ABOUT],
        fields: [
            tag(),
            heading(),
            {
                type: "group",
                name: "communityCard",
                label: "Card 1 — community",
                fields: [
                    text("title", "Title"),
                    textarea("description", "Description", { maxLength: 400 }),
                    image("avatar1", "Avatar 1"),
                    image("avatar2", "Avatar 2"),
                    image("avatar3", "Avatar 3"),
                    image("avatar4", "Avatar 4", "Revealed when the card is hovered."),
                ],
            },
            {
                type: "group",
                name: "supportCard",
                label: "Card 2 — support",
                fields: [
                    text("title", "Title"),
                    textarea("description", "Description", { maxLength: 400 }),
                    text("text", "Large text", { maxLength: 60 }),
                    text("highlight", "Highlighted word", { maxLength: 30, help: "Hovering it plays the video." }),
                    text("suffix", "Text after highlight", { maxLength: 10 }),
                    { type: "video", name: "video", label: "Hover video", help: "MP4 or WebM, played muted on a loop." },
                ],
            },
            {
                type: "group",
                name: "keysCard",
                label: "Card 3 — keyboard keys",
                fields: [
                    text("title", "Title"),
                    textarea("description", "Description", { maxLength: 400 }),
                    text("key1", "Key 1", { maxLength: 8 }),
                    text("key2", "Key 2", { maxLength: 8 }),
                    text("key3", "Key 3", { maxLength: 8 }),
                ],
            },
        ],
    },
    {
        key: "services",
        name: "Services",
        group: "Sections",
        file: "src/sections/Services.tsx",
        description: "Services heading, introduction and the list of service pills under the bento grid.",
        usedOn: [HOME, ABOUT],
        fields: [
            tag(),
            heading(),
            textarea("description", "Introduction", { maxLength: 400 }),
            {
                type: "list",
                name: "pills",
                label: "Service pills",
                itemLabel: "Service",
                titleField: "text",
                min: 0,
                max: 16,
                fields: [text("text", "Service name", { maxLength: 60, required: true })],
            },
        ],
    },
    {
        key: "integrations",
        name: "Testimonials",
        group: "Sections",
        file: "src/sections/Integrations.tsx",
        description: "Testimonials heading, introduction and the scrolling client reviews.",
        usedOn: [HOME, TESTIMONIALS],
        fields: [
            tag(),
            heading(),
            textarea("description", "Introduction", { maxLength: 600 }),
            {
                type: "list",
                name: "testimonials",
                label: "Testimonials",
                itemLabel: "Testimonial",
                titleField: "name",
                min: 1,
                max: 30,
                fields: [
                    text("name", "Client name", { maxLength: 60, required: true }),
                    text("location", "Location", { maxLength: 60 }),
                    textarea("review", "Review", { maxLength: 500, required: true }),
                    image("image", "Photo"),
                ],
            },
        ],
    },
    {
        key: "contact",
        name: "Contact",
        group: "Sections",
        file: "src/sections/Contact.tsx",
        description:
            "The appointment booking form: heading, services visitors can tick, available dates and times, and the thank-you message. Bookings are emailed through Web3Forms.",
        usedOn: [HOME, CONTACT],
        fields: [
            tag(),
            heading(),
            {
                type: "group",
                name: "form",
                label: "Booking form",
                fields: [
                    image("logo", "Logo"),
                    text("title", "Form title", { maxLength: 60 }),
                    text("subtitle", "Form introduction", { maxLength: 160 }),
                    text("servicesHeading", "Services heading", { maxLength: 60 }),
                    text("servicesHelp", "Services hint", { maxLength: 120 }),
                    {
                        type: "list",
                        name: "services",
                        label: "Services",
                        itemLabel: "Service",
                        titleField: "name",
                        help: "Visitors can tick as many of these as they like.",
                        min: 1,
                        max: 12,
                        fields: [text("name", "Service name", { maxLength: 60, required: true })],
                    },
                    text("dateHeading", "Date heading", { maxLength: 60 }),
                    text("timeHeading", "Time heading", { maxLength: 60 }),
                    text("summaryHeading", "Summary heading", { maxLength: 60 }),
                    text("detailsHeading", "Details heading", { maxLength: 60 }),
                    text("notesPlaceholder", "Notes placeholder", { maxLength: 120 }),
                    text("buttonText", "Button text", { maxLength: 30, required: true }),
                    text("successTitle", "Thank-you heading", { maxLength: 60, required: true }),
                    textarea("successMessage", "Thank-you message", { maxLength: 400 }),
                ],
            },
            {
                type: "group",
                name: "schedule",
                label: "Availability",
                help: "Weekends are never offered. Dates start from tomorrow.",
                fields: [
                    { type: "number", name: "daysAhead", label: "How many days ahead visitors can book", min: 1, max: 60, integer: true },
                    { type: "number", name: "openingHour", label: "First appointment hour (24h, e.g. 9)", min: 0, max: 23, integer: true },
                    { type: "number", name: "closingHour", label: "Closing hour (24h, e.g. 17)", min: 1, max: 24, integer: true, help: "The last slot starts before this hour." },
                    { type: "number", name: "slotMinutes", label: "Minutes between time slots", min: 15, max: 240, integer: true },
                    text("timeZoneLabel", "Time zone (as shown)", { maxLength: 40 }),
                ],
            },
            text("emailSubject", "Booking email subject", {
                maxLength: 120,
                required: true,
                help: "The subject line of the email you receive for each booking.",
            }),
        ],
        validate: (v) => {
            const errors: Record<string, string> = {};
            const schedule = (v.schedule ?? {}) as Record<string, unknown>;
            if (Number(schedule.closingHour) <= Number(schedule.openingHour)) {
                errors["schedule.closingHour"] = "The closing hour must be later than the first appointment hour.";
            }
            const services = ((v.form as Record<string, unknown>)?.services ?? []) as { name?: unknown }[];
            const names = services.map((s) => String(s.name).trim().toLowerCase());
            if (new Set(names).size !== names.length) errors["form.services"] = "Each service needs a different name.";
            return errors;
        },
    },
    {
        key: "faqs",
        name: "FAQs",
        group: "Sections",
        file: "src/sections/Faqs.tsx",
        description: "Frequently asked questions and their answers.",
        usedOn: [HOME, CONTACT, TESTIMONIALS],
        fields: [
            tag(),
            heading(),
            {
                type: "list",
                name: "items",
                label: "Questions",
                itemLabel: "Question",
                titleField: "question",
                min: 1,
                max: 30,
                fields: [
                    text("question", "Question", { maxLength: 200, required: true }),
                    textarea("answer", "Answer", { maxLength: 1500, required: true }),
                ],
            },
        ],
    },
    {
        key: "callToAction",
        name: "Call to action",
        group: "Sections",
        file: "src/sections/CallToAction.tsx",
        description: "The large scrolling call-to-action banner.",
        usedOn: [TESTIMONIALS],
        fields: [text("text", "Banner text", { maxLength: 60, required: true })],
    },
    {
        key: "team",
        name: "Team",
        group: "Sections",
        file: "src/sections/Team/Team.jsx",
        description: "Team member cards with photos, roles and social links.",
        usedOn: [],
        fields: [
            tag(),
            heading(),
            {
                type: "list",
                name: "members",
                label: "Team members",
                itemLabel: "Member",
                titleField: "name",
                min: 1,
                max: 20,
                fields: [
                    text("name", "Name", { maxLength: 60, required: true }),
                    text("role", "Role", { maxLength: 60 }),
                    textarea("description", "Bio", { maxLength: 400 }),
                    image("image", "Photo"),
                    url("instagramUrl", "Instagram link"),
                    url("whatsappUrl", "WhatsApp link"),
                    url("linkedinUrl", "LinkedIn link"),
                ],
            },
        ],
    },
    {
        key: "footer",
        name: "Footer",
        group: "Navigation",
        file: "src/sections/Footer.tsx",
        description: "About text, quick links, contact details, social links, logo and copyright.",
        usedOn: [HOME, ABOUT, CONTACT, TESTIMONIALS],
        fields: [
            text("aboutTitle", "About heading", { maxLength: 40 }),
            textarea("aboutText", "About text", { maxLength: 800 }),
            text("linksTitle", "Links heading", { maxLength: 40 }),
            {
                type: "list",
                name: "links",
                label: "Quick links",
                itemLabel: "Link",
                titleField: "label",
                min: 0,
                max: 10,
                fields: [text("label", "Label", { maxLength: 40, required: true }), url("href", "Link", { required: true })],
            },
            text("contactTitle", "Contact heading", { maxLength: 40 }),
            text("phoneDisplay", "Phone number (as shown)", { maxLength: 30 }),
            text("phoneNumber", "Phone number (for dialling)", {
                maxLength: 16,
                pattern: "^\\+?[0-9]{8,15}$",
                patternMessage: "Digits only, optionally starting with +, e.g. +27793932311.",
            }),
            text("email", "Email address", {
                maxLength: 120,
                pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                patternMessage: "Enter a valid email address.",
            }),
            url("facebookUrl", "Facebook link"),
            url("tiktokUrl", "TikTok link"),
            url("whatsappUrl", "WhatsApp link"),
            image("logo", "Logo"),
            text("registration", "Registration number", { maxLength: 40 }),
            text("copyright", "Copyright line", { maxLength: 160 }),
        ],
    },
    {
        key: "staggeredMenu",
        name: "Menu",
        group: "Navigation",
        file: "src/sections/StaggeredMenu.tsx",
        description: "The site-wide slide-out menu: logo, menu items, button text and social links.",
        usedOn: [HOME, ABOUT, CONTACT, TESTIMONIALS],
        fields: [
            image("logo", "Logo"),
            text("menuText", "Open button text", { maxLength: 12, required: true }),
            text("closeText", "Close button text", { maxLength: 12, required: true }),
            {
                type: "list",
                name: "items",
                label: "Menu items",
                itemLabel: "Menu item",
                titleField: "label",
                min: 1,
                max: 8,
                fields: [
                    text("label", "Label", { maxLength: 24, required: true }),
                    url("link", "Link", { required: true }),
                    text("ariaLabel", "Screen-reader description", { maxLength: 80, help: "Read aloud by screen readers instead of the label." }),
                ],
            },
            text("socialsTitle", "Socials heading", { maxLength: 30 }),
            {
                type: "list",
                name: "socials",
                label: "Social links",
                itemLabel: "Social link",
                titleField: "label",
                min: 0,
                max: 6,
                fields: [text("label", "Label", { maxLength: 24, required: true }), url("link", "Link", { required: true })],
            },
        ],
        validate: (v): Record<string, string> =>
            String(v.menuText).trim().toLowerCase() === String(v.closeText).trim().toLowerCase()
                ? { closeText: "The open and close texts must be different." }
                : {},
    },
    {
        key: "magicBento",
        name: "Magic bento",
        group: "Components",
        file: "src/components/MagicBento.jsx",
        description: "The six animated service cards in the Services section. Cards 3 and 4 show the carousel and the stepper.",
        usedOn: [HOME, ABOUT],
        fields: [
            {
                type: "list",
                name: "cards",
                label: "Cards",
                itemLabel: "Card",
                titleField: "title",
                help: "The grid layout is fixed at six cards, so cards can be edited but not added or removed.",
                min: 6,
                max: 6,
                fields: [
                    text("label", "Label", { maxLength: 40 }),
                    text("title", "Title", { maxLength: 80, required: true }),
                    textarea("description", "Description", { maxLength: 300 }),
                ],
            },
        ],
    },
    {
        key: "stepper",
        name: "Stepper",
        group: "Components",
        file: "src/components/Stepper.jsx",
        description: "The step-by-step process shown inside the fourth bento card.",
        usedOn: [HOME, ABOUT],
        fields: [
            {
                type: "list",
                name: "steps",
                label: "Steps",
                itemLabel: "Step",
                titleField: "title",
                min: 1,
                max: 8,
                fields: [text("title", "Step title", { maxLength: 60, required: true })],
            },
            text("backButtonText", "Back button", { maxLength: 20, required: true }),
            text("nextButtonText", "Next button", { maxLength: 20, required: true }),
            text("finishButtonText", "Finish button", { maxLength: 20, required: true }),
        ],
    },
    {
        key: "creditScoreProfile",
        name: "Credit score profile",
        group: "Components",
        file: "src/components/CreditScoreProfile.tsx",
        description: "The example credit-score card beside the hero: scores, score factors and milestones.",
        usedOn: [HOME],
        fields: [
            text("subtitle", "Subtitle", { maxLength: 60 }),
            text("title", "Title", { maxLength: 60 }),
            text("scoreLabel", "Score label", { maxLength: 30 }),
            { type: "number", name: "scoreBefore", label: "Score before", min: 0, max: 9999, integer: true },
            { type: "number", name: "scoreAfter", label: "Score after", min: 0, max: 9999, integer: true },
            { type: "number", name: "scoreMax", label: "Maximum score", min: 1, max: 9999, integer: true },
            {
                type: "list",
                name: "factors",
                label: "Score factors",
                itemLabel: "Factor",
                titleField: "label",
                help: "Each factor gets a fixed chart colour by position. Percentages must add up to 100.",
                min: 1,
                max: 5,
                fields: [
                    text("label", "Factor", { maxLength: 40, required: true }),
                    { type: "number", name: "value", label: "Weight (%)", min: 1, max: 100, integer: true },
                    text("rating", "Rating", { maxLength: 30 }),
                ],
            },
            {
                type: "list",
                name: "milestones",
                label: "Milestones",
                itemLabel: "Milestone",
                titleField: "text",
                min: 0,
                max: 4,
                fields: [text("text", "Milestone", { maxLength: 40, required: true })],
            },
        ],
        validate: (v) => {
            const errors: Record<string, string> = {};
            const max = Number(v.scoreMax);
            if (Number(v.scoreBefore) > max) errors.scoreBefore = "Can't be higher than the maximum score.";
            if (Number(v.scoreAfter) > max) errors.scoreAfter = "Can't be higher than the maximum score.";
            const factors = Array.isArray(v.factors) ? (v.factors as { value?: unknown; label?: unknown }[]) : [];
            const total = factors.reduce((sum, f) => sum + (Number(f.value) || 0), 0);
            if (factors.length && total !== 100) errors.factors = `The weights add up to ${total}%. They must add up to 100%.`;
            const labels = factors.map((f) => String(f.label).trim().toLowerCase());
            if (new Set(labels).size !== labels.length) errors.factors = "Each factor needs a different name.";
            return errors;
        },
    },
];

export const SECTION_KEYS = SECTIONS.map((s) => s.key) as SectionKey[];

export function getSectionDef(key: string): (SectionDef & { key: SectionKey }) | undefined {
    return SECTIONS.find((s) => s.key === key) as (SectionDef & { key: SectionKey }) | undefined;
}

export const SECTION_GROUPS = ["Sections", "Components", "Navigation"] as const;
