"use client";

import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import Introduction from "@/sections/Introduction";
import Features from "@/sections/Features";
import Services from "@/sections/Services";
import Integrations from "@/sections/Integrations";
import Contacts from "@/sections/Contact"
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";



export default function Home() {
    return (
        <>
         <main className="min-h-screen bg-background">
 
            <Hero />
            <LogoTicker />
            <Introduction />
            <Features />
            <Services />
            <Integrations />
            <Contacts/>
            <Faqs />
            <Footer />
            </main>
        </>
    );
}
