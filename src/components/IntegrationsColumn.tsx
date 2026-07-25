"use client";

import { type IntegrationsType } from "@/sections/Integrations";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import { Fragment } from "react";

export default function IntegrationColumn(props: {
    integrations: IntegrationsType;
    className?: string;
    reverse?: boolean;
}) {
    const { integrations, className, reverse } = props;
    return (
        <motion.div
        initial={{y:reverse? '-50%' : 0}}
            animate={{ y: reverse ? 0 : "-50%" }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className={twMerge("flex flex-col gap-4 pb-4", className)}
        >
            {Array.from({ length: 2 }).map((_, i) => (
                <Fragment key={i}>
                    {integrations.map((integration) => (
                        <div
                            key={integration.name}
                            className="bg-neutral-900 border border-white/10 rounded-3xl p-6 "
                        >
                            <div className="flex justify-center">
                               <Image
    src={integration.icon}
    alt={integration.name}
    className="size-24 rounded-full object-cover"
/>
                            </div>
                            
                            <p className="text-center text-white mt-2">
                                {integration.review} - {integration.name}, {integration.location}
                            </p>
                        </div>
                    ))}
                </Fragment>
            ))}
        </motion.div>
    );
}
