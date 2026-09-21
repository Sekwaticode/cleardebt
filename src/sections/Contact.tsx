"use client";

import Tag from "@/components/Tag";
import Script from "next/script";

export default function Contact() {
    return (
        <section className="py-24 lg:py-36">
            <div className="container">
                <div className="flex justify-center mb-12 lg:mb-16">
                    <Tag>Get in Touch</Tag>
                </div>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    Book your
                    <span className="text-fuchsia-400"> appointment</span> and
                    start your journey to finacial freedom now!
                </h2>
                <div className="items-center">
                    <div id="JFWebsiteWidget-01a0924a970870008db688482350bf73f440"></div>

                    <Script src="https://www.jotform.com/website-widgets/embed/01a0924a970870008db688482350bf73f440" />
                </div>
            </div>
        </section>
    );
}
