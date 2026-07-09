"use client";

import { useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

import Tag from "@/components/Tag";
import { twMerge } from "tailwind-merge";

const text = ` legally and effectively clear their debt records. From removing outdated or unlawful listings to providing expert credit advice, our goal is to restore your financial freedom and empower you to move forward with financial confidence.`;
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
        wordIndex.on("change", (latest) => {
            setCurrentWord(latest);
        });
    }, [wordIndex]);

    return (
        <section className="py-28 lg:py-40">
            <div className="container">
                <div className="sticky top-20 md:top-28 lg:top-40">
                    <div className="flex justify-center">
                        <Tag>Introducing Clear Debt</Tag>
                    </div>

                    <div className="text-4xl md:text-6xl lg:text-7xl text-center font-medium mt-10">
                        <span>At Clear Debt, we help South Africans</span>{" "}
                        <span className="text-white/15">
                            {words.map((word, wordIndex) => (
                                <span
                                    key={wordIndex}
                                    className={twMerge(
                                        "transition duration-500 text-white/15",
                                        wordIndex < currentWord && "text-white",
                                    )}
                                >{`${word} `}</span>
                            ))}
                        </span>{" "}
                        <span className="text-fuchsia-400 block">
                            We&apos;re here to help.
                        </span>
                    </div>
                </div>

                <div className="h-[150vh]" ref={scrollTarget}></div>
            </div>
        </section>
    );
}
