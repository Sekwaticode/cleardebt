"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { DEFAULT_CONTENT, type ContactContent } from "@/lib/cms/defaults";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "01f6d667-a3a2-4061-a63e-423227779cc4";

type Status = "idle" | "submitting" | "success" | "error";
type Schedule = ContactContent["schedule"];

// Weekdays only, bookable from tomorrow up to `daysAhead` days ahead.
function getBookableDates(daysAhead: number): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= daysAhead; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        const day = date.getDay();
        if (day !== 0 && day !== 6) dates.push(date);
    }
    return dates;
}

function getTimeSlots({ openingHour, closingHour, slotMinutes }: Schedule): string[] {
    const slots: string[] = [];
    if (slotMinutes <= 0) return slots;
    for (let minutes = openingHour * 60; minutes < closingHour * 60; minutes += slotMinutes) {
        const hours24 = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const period = hours24 < 12 ? "AM" : "PM";
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        slots.push(`${hours12}:${mins.toString().padStart(2, "0")} ${period}`);
    }
    return slots;
}

const formatWeekday = (date: Date) => date.toLocaleDateString("en-ZA", { weekday: "short" });
const formatShortDate = (date: Date) => date.toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
const formatSummaryDate = (date: Date) => `${formatWeekday(date)}, ${formatShortDate(date)}`;
const formatFullDate = (date: Date) =>
    date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const pillBase =
    "rounded-full border border-white/15 text-white transition hover:border-fuchsia-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400";
const pillSelected = "border-purple-700 bg-purple-700 hover:border-purple-700";
const inputClasses =
    "w-full h-12 rounded-full border border-white/15 bg-transparent px-4 text-white placeholder:text-white/40 outline-none transition focus:border-fuchsia-400";
const labelClasses = "block text-sm font-semibold text-white mb-2";
const headingClasses = "text-base font-semibold text-white mb-3";

export default function ConsultationForm({ content = DEFAULT_CONTENT.contact }: { content?: ContactContent }) {
    const { form: text, schedule } = content;
    const serviceOptions = text.services.map((s) => s.name).filter(Boolean);
    const timeSlots = useMemo(() => getTimeSlots(schedule), [schedule]);

    const [dates, setDates] = useState<Date[]>([]);
    const [services, setServices] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Dates depend on the visitor's clock, so compute them after mount to avoid hydration mismatches.
    useEffect(() => {
        const bookable = getBookableDates(schedule.daysAhead);
        setDates(bookable);
        setSelectedDate(bookable[0] ?? null);
    }, [schedule.daysAhead]);

    const toggleService = (service: string) => {
        setServices((current) =>
            current.includes(service) ? current.filter((s) => s !== service) : [...current, service],
        );
    };

    const isComplete = services.length > 0 && selectedDate !== null && selectedTime !== null;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (services.length === 0 || !selectedDate || !selectedTime) {
            setStatus("error");
            setErrorMessage("Please choose at least one service, a date and a time.");
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("services", services.join(", "));
        formData.set("preferred_date", formatFullDate(selectedDate));
        formData.set("preferred_time", `${selectedTime} (${schedule.timeZoneLabel})`);

        setStatus("submitting");
        setErrorMessage("");

        try {
            const response = await fetch(WEB3FORMS_ENDPOINT, {
                method: "POST",
                headers: { Accept: "application/json" },
                body: formData,
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setStatus("success");
                form.reset();
                setServices([]);
                setSelectedTime(null);
            } else {
                setStatus("error");
                setErrorMessage(result.message || "Something went wrong. Please try again.");
            }
        } catch {
            setStatus("error");
            setErrorMessage("Network error. Please check your connection and try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="max-w-5xl mx-auto rounded-3xl border border-white/15 bg-[#0f1424] p-8 lg:p-12 text-center">
                <h3 className="text-3xl font-semibold text-white">{text.successTitle}</h3>
                {text.successMessage && <p className="mt-4 text-white/70 max-w-md mx-auto">{text.successMessage}</p>}
                <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-8 h-12 rounded-full bg-purple-700 px-6 font-semibold text-white transition hover:bg-purple-600"
                >
                    Book another appointment
                </button>
            </div>
        );
    }

    return (
        <form
            id="consultationForm"
            action={WEB3FORMS_ENDPOINT}
            method="POST"
            onSubmit={handleSubmit}
            className="max-w-5xl mx-auto grid overflow-hidden rounded-3xl border border-white/15 bg-[#0f1424] md:grid-cols-2"
        >
            <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
            <input type="hidden" name="subject" value={content.emailSubject} />
            <input type="hidden" name="from_name" value="Clear Debt Website" />
            {/* Honeypot spam protection */}
            <input type="checkbox" name="botcheck" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

            {/* Left column: services, date and time */}
            <div className="p-6 lg:p-8 border-b border-white/15 md:border-b-0 md:border-r">
                <div className="flex items-start gap-4">
                    <Image src={text.logo} alt={text.logo.alt} className="size-14 shrink-0 rounded-xl object-cover" />
                    <div>
                        <h3 className="text-2xl font-semibold text-white">{text.title}</h3>
                        <p className="mt-1 text-sm text-white/80">{text.subtitle}</p>
                    </div>
                </div>

                <fieldset className="mt-8">
                    <legend className={headingClasses}>{text.servicesHeading}</legend>
                    {text.servicesHelp && <p className="-mt-2 mb-3 text-sm text-white/60">{text.servicesHelp}</p>}
                    <div className="grid gap-3">
                        {serviceOptions.map((service) => {
                            const checked = services.includes(service);
                            return (
                                <label
                                    key={service}
                                    className={twMerge(
                                        "flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 px-4 py-3 transition hover:border-fuchsia-400/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-fuchsia-400",
                                        checked && "border-fuchsia-500 bg-fuchsia-500/10 hover:border-fuchsia-500",
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleService(service)}
                                        className="size-4 shrink-0 accent-fuchsia-500"
                                    />
                                    <span className="text-sm font-semibold text-white">{service}</span>
                                </label>
                            );
                        })}
                    </div>
                </fieldset>

                <fieldset className="mt-8">
                    <legend className={headingClasses}>{text.dateHeading}</legend>
                    <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
                        {dates.map((date) => {
                            const selected = selectedDate?.toDateString() === date.toDateString();
                            return (
                                <button
                                    key={date.toISOString()}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setSelectedDate(date)}
                                    className={twMerge(pillBase, "rounded-2xl py-2 text-center", selected && pillSelected)}
                                >
                                    <span className="block text-xs font-semibold">{formatWeekday(date)}</span>
                                    <span className="block text-sm font-semibold">{formatShortDate(date)}</span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <fieldset className="mt-8">
                    <legend className={headingClasses}>{text.timeHeading}</legend>
                    <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => {
                            const selected = selectedTime === slot;
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setSelectedTime(slot)}
                                    className={twMerge(pillBase, "h-10 text-sm font-semibold", selected && pillSelected)}
                                >
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
            </div>

            {/* Right column: summary and contact details */}
            <div className="p-6 lg:p-8">
                <div className="rounded-2xl border border-white/15 p-4 lg:p-5">
                    <h4 className="text-base font-semibold text-white mb-3">{text.summaryHeading}</h4>
                    <dl className="grid gap-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-white/70">{services.length > 1 ? "Services" : "Service"}</dt>
                            <dd className="text-right font-semibold text-white">
                                {services.length > 0 ? services.join(", ") : "—"}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-white/70">Date</dt>
                            <dd className="font-semibold text-white">{selectedDate ? formatSummaryDate(selectedDate) : "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-white/70">Time</dt>
                            <dd className="font-semibold text-white">{selectedTime ?? "—"}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-white/70">Time zone</dt>
                            <dd className="font-semibold text-white">{schedule.timeZoneLabel}</dd>
                        </div>
                    </dl>
                </div>

                <h4 className="mt-8 text-base font-semibold text-white mb-4">{text.detailsHeading}</h4>
                <div className="grid gap-4">
                    <div>
                        <label htmlFor="name" className={labelClasses}>Full name</label>
                        <input id="name" name="name" type="text" required autoComplete="name" placeholder="Full name" className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="email" className={labelClasses}>Email address</label>
                        <input id="email" name="email" type="email" required autoComplete="email" placeholder="name@example.com" className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="phone" className={labelClasses}>Phone number</label>
                        <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="Phone number" className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="notes" className={labelClasses}>Notes</label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            placeholder={text.notesPlaceholder}
                            className={twMerge(inputClasses, "h-auto rounded-2xl py-3 resize-y")}
                        />
                    </div>
                </div>

                {status === "error" && (
                    <p role="alert" className="mt-4 text-sm text-red-400">{errorMessage}</p>
                )}

                <button
                    type="submit"
                    disabled={status === "submitting"}
                    className={twMerge(
                        "mt-6 h-12 w-full rounded-full font-semibold text-white transition",
                        isComplete ? "bg-purple-700 hover:bg-purple-600" : "bg-[#4a0f4f]",
                        status === "submitting" && "opacity-60",
                    )}
                >
                    {status === "submitting" ? "Booking..." : text.buttonText}
                </button>
            </div>
        </form>
    );
}
