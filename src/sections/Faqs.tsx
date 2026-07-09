"use client";

import Tag from "@/components/Tag";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
    {
        question: "What is debt review removal?",
        answer: "Debt review removal is the process of assisting qualifying consumers to exit debt review once they have met the necessary legal requirements. ClearDebt guides you through the process and helps ensure the required documentation is completed correctly.",
    },
    {
        question: "What is prescribed debt?",
        answer: "In certain circumstances, debt may prescribe if it meets the requirements set out in South African law. ClearDebt can assess your situation and advise whether any of your debts may qualify for prescription.",
    },
    {
        question: "Can you help remove judgments from my credit record?",
        answer: "Yes. If you qualify, ClearDebt can assist with the judgment removal process and guide you through the necessary legal and administrative steps to help restore your credit profile.",
    },
    {
        question: "How long does the process take?",
        answer: "The timeframe depends on the specific service and your individual circumstances. After reviewing your case, our consultants will provide an estimated timeline and keep you informed throughout the process.",
    },
    {
        question: "How do I get started?",
        answer: "Getting started is simple. Contact ClearDebt for a free consultation, and one of our experienced consultants will assess your situation, explain your options, and recommend the most suitable solution for your needs.",
    },
];

export default function Faqs() {
    const [selectedIndex, setSelectedIndex] = useState(0);
    return (
        <section className="py-24">
            <div className="container">
                <div className="flex justify-center">
                    <Tag>FAQs</Tag>
                </div>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    Questions? We&apos;ve got{" "}
                    <span className="text-fuchsia-400">answers</span>
                </h2>
                <div className="mt-12 flex flex-col gap-6 max-w-xl mx-auto">
                    {faqs.map((faq, faqIndex) => (
                        <div
                            key={faq.question}
                            className="bg-neutral-900 rounded-2xl border border-white/10 p-6"
                        >
                            <div
                                className="flex justify-between items-center"
                                onClick={() => setSelectedIndex(faqIndex)}
                            >
                                <h3 className="font-medium">{faq.question}</h3>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={twMerge(
                                        "feather feather-plus text-fuchsia-400 flex-shrink-0 transition duration-300",
                                        selectedIndex === faqIndex &&
                                            "rotate-45",
                                    )}
                                >
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                            <AnimatePresence>
                                {selectedIndex === faqIndex && (
                                    <motion.div
                                        initial={{ height: 0, marginTop: 0 }}
                                        animate={{
                                            height: "auto",
                                            marginTop: 24,
                                        }}
                                        exit={{ height: 0, marginTop: 0 }}
                                        className={twMerge("overflow-hidden")}
                                    >
                                        <p className="text-white/50">
                                            {faq.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
