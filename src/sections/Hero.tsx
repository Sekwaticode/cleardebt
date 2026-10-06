"use client";

import Button from "@/components/Button";
import { FormEvent, useState } from "react";
import { FiArrowRight, FiMail } from "react-icons/fi";
import CreditScoreProfile from "@/components/CreditScoreProfile";
import cursorYouImage from "@/assets/images/cursor-you.svg";
import { DEFAULT_CONTENT, type CreditScoreProfileContent, type HeroContent } from "@/lib/cms/defaults";

export default function Hero({
    content = DEFAULT_CONTENT.hero,
    creditScore = DEFAULT_CONTENT.creditScoreProfile,
}: {
    content?: HeroContent;
    creditScore?: CreditScoreProfileContent;
}) {

    const [message, setMessage] = useState("");

    const handleWhatsAppSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const url = `https://api.whatsapp.com/send/?phone=${encodeURIComponent(content.whatsappNumber)}&text=${encodeURIComponent(message.trim())}&type=phone_number&app_absent=0`;
        window.open(url, "_blank", "noopener,noreferrer");
    };


    // "Take Control of Your Debt, Rebuild Your Future" → the part after the first comma gets the gradient.
    const commaAt = content.title.indexOf(",");
    const titleLead = commaAt >= 0 ? content.title.slice(0, commaAt + 1) : content.title;
    const titleAccent = commaAt >= 0 ? content.title.slice(commaAt + 1).trim() : "";

    return (
        <section className="relative py-24 lg:py-32 overflow-x-clip grid lg:grid-cols-[1.05fr_1fr] items-center lg:gap-8">
            {/* Background effects */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(60%_80%_at_30%_100%,rgba(124,58,237,0.45),transparent_70%)]" />
                <div className="absolute right-[-10%] top-1/2 size-[640px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(147,51,234,0.45),rgba(79,70,229,0.15)_45%,transparent_70%)] blur-2xl" />
                <div className="absolute right-[2%] top-1/2 hidden size-[560px] -translate-y-1/2 rounded-full border border-fuchsia-400/40 shadow-[0_0_60px_rgba(168,85,247,0.55),inset_0_0_60px_rgba(168,85,247,0.35)] lg:block" />
                <div className="absolute right-[8%] top-[18%] hidden h-px w-[420px] rotate-[-8deg] bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent blur-[1px] lg:block" />
            </div>

            <div className="container relative z-10 lg:pr-0">
                <div className="flex justify-center lg:justify-start">
                    <div className="inline-flex items-center gap-2 py-1.5 px-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold shadow-[0_0_30px_rgba(192,132,252,0.45)]">
                        {content.badge}
                        <FiMail aria-hidden />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-center lg:text-left mt-6">
                    {titleLead}
                    {titleAccent && (
                        <>
                            {" "}
                            <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                                {titleAccent}
                            </span>
                        </>
                    )}
                </h1>
                <p className="text-center lg:text-left text-xl text-white/75 mt-8 max-w-2xl mx-auto lg:mx-0">
                    {content.description}
                </p>
                <form
                    className="flex items-center border border-purple-400/40 bg-white/[0.03] backdrop-blur rounded-full p-2 mt-10 md:max-w-2xl mx-auto lg:mx-0 shadow-[0_0_40px_-10px_rgba(168,85,247,0.6)]"
                    id="inputEmail"
                    onSubmit={handleWhatsAppSubmit}
                >
                    <input
                        type="text"
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={content.inputPlaceholder}
                        className="bg-transparent px-4 md:flex-1 w-full outline-none placeholder:text-white/70"
                    ></input>
                    <Button
                        type="submit"
                        variant="primary"
                        className="whitespace-nowrap inline-flex items-center gap-2 shadow-[0_0_30px_rgba(232,121,249,0.5)]"
                    >
                        {content.buttonText}
                        <FiArrowRight aria-hidden />
                    </Button>
                </form>
            </div>

            <div className="relative z-10 flex justify-center mt-16 lg:mt-0 px-4 lg:pl-0 lg:pr-10">
                <div className="relative w-full max-w-2xl">
                    {/* Ghost card stacked behind the dashboard */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md lg:block lg:[transform:perspective(1800px)_translate3d(-36px,28px,-60px)_rotateY(-20deg)_rotateX(8deg)_rotateZ(2deg)]"
                    />
                    <div
                        className="relative transition-transform duration-500 ease-out lg:[transform:perspective(1800px)_rotateY(-20deg)_rotateX(8deg)_rotateZ(2deg)] lg:hover:[transform:perspective(1800px)_rotateY(-12deg)_rotateX(5deg)_rotateZ(1deg)] [&_*]:![cursor:inherit]"
                        style={{ cursor: `url(${cursorYouImage.src}), auto` }}
                    >
                        <CreditScoreProfile content={creditScore} />
                    </div>
                </div>
            </div>
        </section>
    );
}
