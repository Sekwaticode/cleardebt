"use client";

import { useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Tag from "@/components/Tag";
import Script from "next/script";

const text = `legally and effectively clear their debt records. From removing outdated or unlawful listings to providing expert credit advice, our goal is to restore your financial freedom and empower you to move forward with financial confidence.`;

const words = text.split(" ");

export default function Contact() {
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
    console.log(currentWord);
    return (
        <section className="py-24 lg:py-36">
            <div className="container">
                <div className="sticky top-20 md:top-28 lg:top-32">
                    <div className="flex justify-center mb-12 lg:mb-16">
                        <Tag>Get in Touch</Tag>
                    </div>
                    <div className="items-center">
                        <div id="JFWebsiteWidget-01a0924a970870008db688482350bf73f440"></div>
                        <Script src="https://www.jotform.com/website-widgets/embed/01a0924a970870008db688482350bf73f440" />
                    </div>
                </div>

                <div className="h-[150vh]" ref={scrollTarget} />
            </div>
        </section>
    );
}
