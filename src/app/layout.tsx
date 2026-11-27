import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"
import "./globals.css";
import StaggeredMenu from "@/sections/StaggeredMenu";
import { getSiteContent } from "@/lib/cms/content";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    axes: ["opsz"],
});

export const metadata: Metadata = {
    title: "Debt Counsellors",
    description: "",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { staggeredMenu: menu } = await getSiteContent();
    return (
        <html lang="en">
             
        <body className={`${inter.variable} font-sans antialiased text-neutral-900 relative`}>
      <StaggeredMenu
                    position="right"
                    items={menu.items}
                    socialItems={menu.socials}
                    menuText={menu.menuText}
                    closeText={menu.closeText}
                    socialsTitle={menu.socialsTitle}
                    logo={menu.logo}
                    displaySocials
                    displayItemNumbering
                    menuButtonColor="#111827"
                    openMenuButtonColor="#111827"
                    changeMenuColorOnOpen
                    isFixed
                    colors={["#1303a0", "#5227FF"]}
                    accentColor="#5227FF"
                  />
  {/* Light grid background with a soft violet glow */}
  <div
    aria-hidden
    className="absolute inset-0 -z-10 h-full w-full pointer-events-none bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"
  >
    <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]" />
  </div>

  {children}
  <div id="JFWebsiteWidget-01a0822240b070008adae7de7855e3e27e1d"></div>
<Script src="https://www.jotform.com/website-widgets/embed/01a0822240b070008adae7de7855e3e27e1d"/>
</body>
        </html>
    );
}