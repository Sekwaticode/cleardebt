"use client";

import Button from "@/components/Button";
import { FormEvent, useState } from "react";
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


    return (
        <section className="py-24 overflow-x-clip grid lg:grid-cols-2 items-center lg:gap-16">

            <div className="container relative">

                <div className="flex justify-center">
                    <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold">
                        {content.badge}
                    </div>
                </div>{" "}
                <h1 className="text-4xl md:text-5xl lg:text-5xl font-medium text-center mt-6">
                    {content.title}
                </h1>
                <p className="text-center text-xl text-white/50 mt-8 max-w-2xl mx-auto">
                    {content.description}
                </p>
                <form
                    className="flex border border-white/15 rounded-full p-2 mt-8 md:max-w-2xl mx-auto"
                    id="inputEmail"
                    onSubmit={handleWhatsAppSubmit}
                >
                    <input
                        type="text"
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={content.inputPlaceholder}
                        className="bg-transparent px-4 md:flex-1 w-full"
                    ></input>
                    <Button
                        type="submit"
                        variant="primary"
                        className="whitespace-nowrap"
                        size="sm"
                    >
                        {content.buttonText}
                    </Button>
                </form>
            </div>
            <div className="relative flex justify-center mt-16 lg:mt-0 px-4">
                <div
                    className="w-full max-w-md [&_*]:![cursor:inherit]"
                    style={{ cursor: `url(${cursorYouImage.src}), auto` }}
                >
                    <CreditScoreProfile content={creditScore} />
                </div>
            </div>

        </section>
    );
}
