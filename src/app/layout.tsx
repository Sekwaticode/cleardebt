import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"
import "./globals.css";
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

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    axes: ["opsz"],
});

export const metadata: Metadata = {
    title: "Clear Debt",
    description: "",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
             
        <body className={`${inter.variable} font-sans antialiased text-white relative`}>
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
  <div
    className="
      fixed
      inset-0
      -z-10
      pointer-events-none
      [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]
    "
  />

  {children}
  <div id="JFWebsiteWidget-01a0822240b070008adae7de7855e3e27e1d"></div>
<Script src="https://www.jotform.com/website-widgets/embed/01a0822240b070008adae7de7855e3e27e1d"/>
</body>
        </html>
    );
}