"use client";

import Integrations from "@/sections/Integrations";
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";
import Script from "next/script";
import StaggeredMenu from "@/sections/StaggeredMenu";

const menuItems = [
    { label: "Home", ariaLabel: "Go to home page", link: "/" },
    { label: "About", ariaLabel: "Learn about us", link: "/about" },
    { label: "Testimonials", ariaLabel: "View our testimonials", link: "/testimonials" },
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
                <Integrations />
                <div id="JFWebsiteWidget-01a090bc176870008176b0cc4f433b1c94d4"></div>
                <Script src="https://www.jotform.com/website-widgets/embed/01a090bc176870008176b0cc4f433b1c94d4" />
                <Faqs />

                <Footer />
            </main>
        </>
    );
}
