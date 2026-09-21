"use client";

import Contact from "@/sections/Contact";
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";

export default function Home() {
    return (
        <>
            <main className="min-h-screen bg-background">
                <Contact />
                <Faqs />
                <Footer />
            </main>
        </>
    );
}
