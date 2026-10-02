"use client";

import { Fragment } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DEFAULT_CONTENT, type LogoTickerContent } from "@/lib/cms/defaults";

export default function LogoTicker({ content = DEFAULT_CONTENT.logoTicker }: { content?: LogoTickerContent }) {
    return (
        <section className="py-24 overflow-x-clip">
            <div className="container">
                <div className="flex justify-center">
                    <h3 className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold text-center">
                        {content.heading}
                    </h3>
                </div>

                <div className="flex overflow-hidden mt-12 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    <motion.div
                        animate={{ x: "-50%" }}
                        transition={{
                            duration: 30,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        className="flex flex-none gap-24 pr-24"
                    >
                        {Array.from({ length: 2 }).map((_, i) => (
                            <Fragment key={i}>
                                {content.logos.map((logo, j) => (
                                    <Image
                                        key={j}
                                        src={logo.image}
                                        alt={logo.image.alt}
                                    />
                                ))}
                            </Fragment>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
