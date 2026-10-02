import Contact from "@/sections/Contact";
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
                <Contact content={content.contact} />
                <Faqs content={content.faqs} />
                <Footer content={content.footer} />
            </main>
        </>
    );
}
