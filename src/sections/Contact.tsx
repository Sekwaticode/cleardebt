"use client";

import Tag from "@/components/Tag";
import ConsultationForm from "@/components/ConsultationForm";
import HighlightText from "@/components/HighlightText";
import { DEFAULT_CONTENT, type ContactContent } from "@/lib/cms/defaults";

export default function Contact({ content = DEFAULT_CONTENT.contact }: { content?: ContactContent }) {
    return (
        <section className="py-24 lg:py-36">
            <div className="container">
                <div className="flex justify-center mb-12 lg:mb-16">
                    <Tag>{content.tag}</Tag>
                </div>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    <HighlightText value={content.heading} />
                </h2>
                <div className="mt-12 lg:mt-16">
                    <ConsultationForm content={content} />
                </div>
            </div>
        </section>
    );
}
