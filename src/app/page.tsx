"use client";

import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import Introduction from "@/sections/Introduction";
import Features from "@/sections/Features";
import Services from "@/sections/Services";
import Integrations from "@/sections/Integrations";
import Contacts from "@/sections/Contact.tsx"
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";
import StaggeredMenu from "@/sections/StaggeredMenu";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "About", ariaLabel: "Learn about us", link: "/about" },
  { label: "Testimonials", ariaLabel: "View our testimonials", link: "/testimonials" },
  { label: "Contact", ariaLabel: "Get in touch", link: "/contact" },
];

const socialItems = [
  { label: "Facebook", link: "https://www.facebook.com/profile.php?id=61574247381160" },
  { label: "Whatsapp", link: "https://api.whatsapp.com/send/?phone=27793932311&text&type=phone_number&app_absent=0" },
  { label: "TikTok", link: "https://www.tiktok.com/@clear.debt" },
];


export default function Home() {
    return (
        <>
         <main className="min-h-screen bg-background">
      <StaggeredMenu
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials
        displayItemNumbering
        menuButtonColor="#ffffff"
        openMenuButtonColor="#111827"
        changeMenuColorOnOpen
        isFixed
        colors={["#1303a0", "#5227FF"]}
        accentColor="#5227FF"
      />
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
