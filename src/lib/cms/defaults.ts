/* Built-in content for every editable section. The public site falls back to
   these whenever a section has not been customised in the admin (or Supabase
   is unreachable), and "Reset to default" in the admin restores them. */

import type { StaticImageData } from "next/image";
import type { MediaImage } from "./types";

import logoImage from "@/assets/images/logo.jpeg";
import ticker1 from "@/assets/images/1-removebg-preview.png";
import ticker2 from "@/assets/images/2-removebg-preview.png";
import ticker3 from "@/assets/images/3-removebg-preview.png";
import ticker4 from "@/assets/images/4-removebg-preview.png";
import ticker5 from "@/assets/images/5-removebg-preview.png";
import avatar1 from "@/assets/images/avatar-ashwin-santiago.jpg";
import avatar2 from "@/assets/images/avatar-lula-meyers.jpg";
import avatar3 from "@/assets/images/avatar-florence-shaw.jpg";
import avatar4 from "@/assets/images/avatar-owen-garcia.jpg";
import testimonial1 from "@/assets/images/Testimonial-1.png";
import testimonial2 from "@/assets/images/Testimonial-2.png";
import testimonial3 from "@/assets/images/Testimonial-3.png";
import testimonial4 from "@/assets/images/Testimonial-4.png";
import testimonial5 from "@/assets/images/Testimonial-5.png";
import testimonial6 from "@/assets/images/Testimonial-6.png";
import teamLihle from "@/assets/images/team-lihle.jpg";
import teamTasmin from "@/assets/images/team-tasmin.jpg";
import teamZelda from "@/assets/images/team-zelda.jpg";
import teamAngie from "@/assets/images/team-angie.jpg";

const img = (image: StaticImageData, alt: string): MediaImage => ({
    src: image.src,
    width: image.width,
    height: image.height,
    alt,
});

const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=27793932311&text&type=phone_number&app_absent=0";
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61574247381160";
const TIKTOK_URL = "https://www.tiktok.com/@clear.debt";

export const DEFAULT_CONTENT = {
    hero: {
        badge: "Helping South Africans become debt free",
        title: "Take Control of Your Debt, Rebuild Your Future",
        description:
            "ClearDebt helps South Africans improve their financial future through debt review removal, prescribed debt assistance, credit profile updates, judgment removal, and expert credit guidance. Start your journey toward financial freedom with a team you can trust.",
        inputPlaceholder: "Get your credit assessment now! What is your name?",
        buttonText: "Contact Us!",
        whatsappNumber: "27793932311",
    },

    logoTicker: {
        heading: "We have various services to help you achieve relief from debt!",
        logos: [
            { image: img(ticker1, "Quantum") },
            { image: img(ticker2, "Acme Corp") },
            { image: img(ticker3, "Echo Valley") },
            { image: img(ticker4, "Pulse") },
            { image: img(ticker5, "Outside") },
        ],
    },

    introduction: {
        tag: "Introducing Clear Debt",
        image: img(logoImage, "Clear Debt"),
        leadText: "At Clear Debt, we help South Africans",
        revealText:
            "legally and effectively clear their debt records. From removing outdated or unlawful listings to providing expert credit advice, our goal is to restore your financial freedom and empower you to move forward with financial confidence.",
        closingText: "We're here to help.",
    },

    features: {
        tag: "Services",
        heading: { before: "Trusted debt", highlight: "management", after: "" },
        communityCard: {
            title: "Helping real South Africans who are just like you!",
            description: "We reach South Africans from Mbombela to Stellenbosch, relieving them from financial stress",
            avatar1: img(avatar1, "Avatar1"),
            avatar2: img(avatar2, "Avatar2"),
            avatar3: img(avatar3, "Avatar3"),
            avatar4: img(avatar4, "Avatar 4"),
        },
        supportCard: {
            title: "You don't have to do it alone",
            description: "With our expert services, you do not have to feel suffocated and alone. We are here for you!",
            text: "Stop it! Get some",
            highlight: "Help",
            suffix: "!",
            video: "/assets/vlipsy-michael-jordan-stop-it-get-some-help-BmvcehRm.mp4",
        },
        keysCard: {
            title: "Control debt, alter your financial future and delete negative credit",
            description: "",
            key1: "ctrl",
            key2: "alt",
            key3: "del",
        },
    },

    services: {
        tag: "Services",
        heading: { before: "Trusted debt", highlight: "management", after: "" },
        description:
            "Professional solutions to help you take control of your credit profile and move towards a healthier financial future.",
        pills: [
            { text: "Debt Review Removal" },
            { text: "Judgement Removal" },
            { text: "Update Credit Bureau" },
            { text: "Prescribed (Old) Debt Removal" },
            { text: "Admin Order Removal" },
            { text: "Credit Advice" },
        ],
    },

    magicBento: {
        cards: [
            {
                label: "Debt Relief",
                title: "Debt Review Removal",
                description: "Exit debt review legally and restore your financial freedom with expert assistance.",
            },
            {
                label: "Legal Help",
                title: "Judgement Removal",
                description: "Remove qualifying court judgments from your credit profile to improve your creditworthiness.",
            },
            {
                label: "Credit Record",
                title: "Update Credit Bureau",
                description: "Ensure your credit records are accurate and up to date across all major credit bureaus.",
            },
            {
                label: "Old Debt",
                title: "Prescribed Debt Removal",
                description: "Have legally prescribed old debt identified and removed from your credit profile.",
            },
            {
                label: "Admin Orders",
                title: "Admin Order Removal",
                description: "Get assistance with removing administration orders and rebuilding your financial standing.",
            },
            {
                label: "Expert Advice",
                title: "Prescription removal",
                description: "Get rid of old, expired debt that is affecting your credit profile.",
            },
        ],
    },

    stepper: {
        steps: [
            { title: "Free Credit Check" },
            { title: "Document Collection" },
            { title: "Application Preparation" },
            { title: "Submission & Follow Up" },
            { title: "Results & Assistance" },
        ],
        backButtonText: "Previous",
        nextButtonText: "Next",
        finishButtonText: "Finish",
    },

    integrations: {
        tag: "Testimonials",
        heading: { before: "We have impacted", highlight: "South Africans", after: "across the nation!" },
        description:
            "We have helped a number of ordinary South Africans achieve their financial freedom and relief from debt. Through our tailored, expert debt solutions, we have allowed individuals and families to have a renewed financial liberation.",
        testimonials: [
            {
                name: "Sarah M.",
                location: "Johannesburg",
                review: "Clear Debt helped me regain control of my finances. The process was simple and the team supported me every step of the way.",
                image: img(testimonial1, "Sarah M."),
            },
            {
                name: "David K.",
                location: "Cape Town",
                review: "I was overwhelmed by debt, but Clear Debt negotiated affordable repayments that changed my life.",
                image: img(testimonial2, "David K."),
            },
            {
                name: "Thabang N.",
                location: "Durban",
                review: "Professional, caring, and transparent. I finally have peace of mind knowing my debt is under control.",
                image: img(testimonial3, "Thabang N."),
            },
            {
                name: "Michael T.",
                location: "Pretoria",
                review: "The consultants explained everything clearly and made the debt review process stress-free.",
                image: img(testimonial4, "Michael T."),
            },
            {
                name: "Marco S.",
                location: "Bloemfontein",
                review: "Excellent service from start to finish. I highly recommend Clear Debt to anyone struggling financially.",
                image: img(testimonial5, "Marco S."),
            },
            {
                name: "Jason R.",
                location: "Port Elizabeth",
                review: "Thanks to Clear Debt I can finally budget properly and plan for my future again.",
                image: img(testimonial6, "Jason R."),
            },
        ],
    },

    contact: {
        tag: "Get in Touch",
        heading: {
            before: "Book your",
            highlight: "appointment",
            after: "and start your journey to financial freedom now!",
        },
    },

    faqs: {
        tag: "FAQs",
        heading: { before: "Questions? We've got", highlight: "answers", after: "" },
        items: [
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
        ],
    },

    callToAction: {
        text: "Get a free credit check!",
    },

    footer: {
        aboutTitle: "About Us",
        aboutText:
            "We are passionate about helping South Africans achieve financial freedom by assisting with credit management. Every client matters to us and we're committed to providing honest, professional and caring service every step of the way.",
        linksTitle: "Links",
        links: [
            { label: "Home", href: "#" },
            { label: "About", href: "/about" },
            { label: "Testimonials", href: "/testimonials" },
            { label: "Contact", href: "/contact" },
        ],
        contactTitle: "Contact",
        phoneDisplay: "079 393 2311",
        phoneNumber: "+27793932311",
        email: "info@clear-debt.co.za",
        facebookUrl: FACEBOOK_URL,
        tiktokUrl: TIKTOK_URL,
        whatsappUrl: WHATSAPP_URL,
        logo: img(logoImage, "Clear Debt logo"),
        registration: "NCRDC4086",
        copyright: "© Copyright 2026 Sekwaticode. All Rights Reserved.",
    },

    team: {
        tag: "Our Team",
        heading: { before: "Our Team of", highlight: "expert", after: "debt relief specialists" },
        members: [
            {
                name: "Lihle",
                role: "Debt Specialist",
                description:
                    "Helps clients understand debt review, create affordable repayment plans, and take the first step toward financial freedom.",
                image: img(teamLihle, "Lihle"),
                instagramUrl: "#",
                whatsappUrl: "#",
                linkedinUrl: "#",
            },
            {
                name: "Tasmin",
                role: "Debt Counsellor",
                description:
                    "Provides compassionate guidance, assesses financial situations, and supports clients throughout every stage of debt review.",
                image: img(teamTasmin, "Tasmin"),
                instagramUrl: "#",
                whatsappUrl: "#",
                linkedinUrl: "#",
            },
            {
                name: "Zelda",
                role: "Marketing Manager",
                description:
                    "Leads marketing initiatives, builds brand awareness, and connects more South Africans with trusted debt relief solutions.",
                image: img(teamZelda, "Zelda"),
                instagramUrl: "#",
                whatsappUrl: "#",
                linkedinUrl: "#",
            },
            {
                name: "Angie",
                role: "Debt Advisor",
                description:
                    "Works closely with clients to explain available options and recommend practical solutions for managing outstanding debt.",
                image: img(teamAngie, "Angie"),
                instagramUrl: "#",
                whatsappUrl: "#",
                linkedinUrl: "#",
            },
        ],
    },

    staggeredMenu: {
        logo: img(logoImage, "Clear Debt logo"),
        menuText: "Menu",
        closeText: "Close",
        items: [
            { label: "Home", link: "/", ariaLabel: "Go to home page" },
            { label: "About", link: "/about", ariaLabel: "Learn about us" },
            { label: "Testimonials", link: "/testimonials", ariaLabel: "View our testimonials" },
            { label: "Contact", link: "/contact", ariaLabel: "Get in touch" },
            { label: "Forms", link: "/forms", ariaLabel: "Sign in to complete your forms" },
        ],
        socialsTitle: "Socials",
        socials: [
            { label: "Facebook", link: FACEBOOK_URL },
            { label: "Whatsapp", link: WHATSAPP_URL },
            { label: "TikTok", link: TIKTOK_URL },
        ],
    },

    creditScoreProfile: {
        subtitle: "Your Credit Profile",
        title: "Score Breakdown",
        scoreLabel: "Credit Score",
        scoreBefore: 548,
        scoreAfter: 712,
        scoreMax: 999,
        factors: [
            { label: "Payment History", value: 35, rating: "Excellent" },
            { label: "Credit Utilisation", value: 30, rating: "Good" },
            { label: "Account Age", value: 15, rating: "Good" },
            { label: "Credit Mix", value: 10, rating: "Very Good" },
            { label: "New Enquiries", value: 10, rating: "Fair" },
        ],
        milestones: [{ text: "Debt review removed" }, { text: "Judgment cleared" }],
    },
};

export type SiteContent = typeof DEFAULT_CONTENT;
export type SectionKey = keyof SiteContent;

export type HeroContent = SiteContent["hero"];
export type LogoTickerContent = SiteContent["logoTicker"];
export type IntroductionContent = SiteContent["introduction"];
export type FeaturesContent = SiteContent["features"];
export type ServicesContent = SiteContent["services"];
export type MagicBentoContent = SiteContent["magicBento"];
export type StepperContent = SiteContent["stepper"];
export type IntegrationsContent = SiteContent["integrations"];
export type ContactContent = SiteContent["contact"];
export type FaqsContent = SiteContent["faqs"];
export type CallToActionContent = SiteContent["callToAction"];
export type FooterContent = SiteContent["footer"];
export type TeamContent = SiteContent["team"];
export type StaggeredMenuContent = SiteContent["staggeredMenu"];
export type CreditScoreProfileContent = SiteContent["creditScoreProfile"];
