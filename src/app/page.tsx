"use client";

import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import Introduction from "@/sections/Introduction";
import Features from "@/sections/Features";
import Services from "@/sections/Services";
import Integrations from "@/sections/Integrations";
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";
import Team from "@/sections/Team/Team";
import StaggeredMenu from "@/sections/StaggeredMenu";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "About", ariaLabel: "Learn about us", link: "/about" },
  { label: "Services", ariaLabel: "View our services", link: "/services" },
  { label: "Contact", ariaLabel: "Get in touch", link: "/contact" },
];

const socialItems = [
  { label: "Facebook", link: "https://facebook.com" },
  { label: "Twitter", link: "https://twitter.com" },
  { label: "Instagram", link: "https://instagram.com" },
  { label: "LinkedIn", link: "https://linkedin.com" },
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
            <Faqs />
            <Team />
            <Footer />
            </main>
        </>
    );
}
