import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    axes: ["opsz"],
});

export const metadata: Metadata = {
    title: "Clear Debt",
    description: "Expert Debt solutions",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
          <body
    className={`${inter.variable} font-sans antialiased text-white bg-neutral-900`}
>
    {children}
</body>
        </html>
    );
}