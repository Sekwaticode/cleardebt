"use client";

import { Fragment } from "react";
import quantumLogo from "@/assets/images/1-removebg-preview.png";
import acmeLogo from "@/assets/images/2-removebg-preview.png";
import echoValleyLogo from "@/assets/images/3-removebg-preview.png";
import pulseLogo from "@/assets/images/4-removebg-preview.png";
import outsideLogo from "@/assets/images/5-removebg-preview.png";

import Image from "next/image";
import { motion } from "framer-motion";

const logos = [
    { name: "Quantum", image: quantumLogo },
    { name: "Acme Corp", image: acmeLogo },
    { name: "Echo Valley", image: echoValleyLogo },
    { name: "Pulse", image: pulseLogo },
    { name: "Outside", image: outsideLogo },
  
];

export default function LogoTicker() {
    return (
        <section className="py-24 overflow-x-clip">
            <div className="container">
                <h3 className="text-center text-white/50 text-xl">
                    We have various service to help you achieve relief from
                    debt!{" "}
                </h3>

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
                                {logos.map((logo) => (
                                    <Image
                                        key={logo.name}
                                        src={logo.image}
                                        alt={logo.name}
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
