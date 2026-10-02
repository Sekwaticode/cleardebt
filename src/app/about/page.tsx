import Introduction from "@/sections/Introduction";
import Features from "@/sections/Features";
import Services from "@/sections/Services";
import Footer from "@/sections/Footer";
import { getSiteContent } from "@/lib/cms/content";

// Rebuilt immediately when content is published in the admin; this is a safety net.
export const revalidate = 600;


export default async function Home() {
    const content = await getSiteContent();
    return (
        <>
         <main className="min-h-screen bg-background">

            <Features content={content.features} />
            <Introduction content={content.introduction} />
            <Services content={content.services} bento={content.magicBento} stepper={content.stepper} />
            <Footer content={content.footer} />
            </main>
        </>
    );
}
