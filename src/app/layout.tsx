import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"
import "./globals.css";

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