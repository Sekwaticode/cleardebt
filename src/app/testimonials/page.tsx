import Integrations from "@/sections/Integrations";
import Faqs from "@/sections/Faqs";
import Footer from "@/sections/Footer";
import CTA from "@/sections/CallToAction";
import Script from "next/script";
import { getSiteContent } from "@/lib/cms/content";

// Rebuilt immediately when content is published in the admin; this is a safety net.
export const revalidate = 600;

export default async function Home() {
    const content = await getSiteContent();
    return (
        <>
            <main className="min-h-screen bg-background">

                <Integrations content={content.integrations} />
                <div className="container">
                    <div id="JFWebsiteWidget-01a090bc176870008176b0cc4f433b1c94d4"></div>
                    <Script src="https://www.jotform.com/website-widgets/embed/01a090bc176870008176b0cc4f433b1c94d4" />
                </div>
                <Faqs content={content.faqs} />
                <CTA content={content.callToAction} />
                <Footer content={content.footer} />
            </main>
        </>
    );
}
