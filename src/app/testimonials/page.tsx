"use client";

import Integrations from "@/sections/Integrations";
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";
import CTA from "@/sections/CallToAction";
import Script from "next/script";

export default function Home() {
    return (
        <>
            <main className="min-h-screen bg-background">
            
                <Integrations />
                <div className="container">
                    <div id="JFWebsiteWidget-01a090bc176870008176b0cc4f433b1c94d4"></div>
                    <Script src="https://www.jotform.com/website-widgets/embed/01a090bc176870008176b0cc4f433b1c94d4" />
                </div>
                <Faqs />
                <CTA />
                <Footer />
            </main>
        </>
    );
}
