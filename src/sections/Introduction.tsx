"use client";

import { useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

import Tag from "@/components/Tag";
import logoImage from "@/assets/images/logo.jpeg";

import { twMerge } from "tailwind-merge";

const text = `legally and effectively clear their debt records. From removing outdated or unlawful listings to providing expert credit advice, our goal is to restore your financial freedom and empower you to move forward with financial confidence.`;

const words = text.split(" ");

export default function Introduction() {
    const scrollTarget = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: scrollTarget,
        offset: ["start end", "end end"],
    });

    const [currentWord, setCurrentWord] = useState(0);

    const wordIndex = useTransform(scrollYProgress, [0, 1], [0, words.length]);

    useEffect(() => {
        const unsubscribe = wordIndex.on("change", (latest) => {
            setCurrentWord(latest);
        });

        return () => unsubscribe();
    }, [wordIndex]);

    return (
        <section className="py-24 lg:py-36">
            <div className="container">
                <div className="sticky top-20 md:top-28 lg:top-32">
                    <div className="flex justify-center mb-12 lg:mb-16">
                        <Tag>Introducing Clear Debt</Tag>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Logo / Image */}
                        <div className="flex justify-center lg:justify-start">
                            <div className="relative rounded-3xl shadow-2xl w-56 h-56 md:w-72 md:h-72 lg:w-[380px] lg:h-[380px] overflow-hidden">
                                <Image
                                    src={logoImage}
                                    alt="Clear Debt"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>
                        </div>

                        {/* About Text */}
                        <div>
                            <div className="text-2xl 3xlmd:text- lg:text-4xl leading-[1.15] font-medium">
                                <span>
                                    At Clear Debt, we help South Africans
                                </span>{" "}
                                <span className="text-white/15">
                                    {words.map((word, wordIndex) => (
                                        <span
                                            key={wordIndex}
                                            className={twMerge(
                                                "transition duration-500 text-white/15",
                                                wordIndex < currentWord &&
                                                    "text-white",
                                            )}
                                        >
                                            {`${word} `}
                                        </span>
                                    ))}
                                </span>
                                <span className="text-fuchsia-400 block mt-6">
                                    We&apos;re here to help.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-[150vh]" ref={scrollTarget} />
            </div>
        </section>
    );
}
