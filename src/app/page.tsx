import Hero from "@/sections/Hero";
import LogoTicker from "@/sections/LogoTicker";
import Introduction from "@/sections/Introduction";
import Features from "@/sections/Features";
import Services from "@/sections/Services";
import Integrations from "@/sections/Integrations";
import Contacts from "@/sections/Contact"
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";
import { getSiteContent } from "@/lib/cms/content";

// Rebuilt immediately when content is published in the admin; this is a safety net.
export const revalidate = 600;

export default async function Home() {
    const content = await getSiteContent();
    return (
        <>
         <main className="min-h-screen bg-background">

            <Hero content={content.hero} creditScore={content.creditScoreProfile} />
            <LogoTicker content={content.logoTicker} />
            <Introduction content={content.introduction} />
            <Features content={content.features} />
            <Services content={content.services} bento={content.magicBento} stepper={content.stepper} />
            <Integrations content={content.integrations} />
            <Contacts content={content.contact} />
            <Faqs content={content.faqs} />
            <Footer content={content.footer} />
            </main>
        </>
    );
}
