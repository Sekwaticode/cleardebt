"use client";

import Introduction from "@/sections/Introduction";
import Features from "@/sections/Features";
import Services from "@/sections/Services";
import Footer from "@/sections/Footer";


export default function Home() {
    return (
        <>
         <main className="min-h-screen bg-background">
   
            <Features />
            <Introduction />
            <Services />
            <Footer />
            </main>
        </>
    );
}
