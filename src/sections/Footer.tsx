import { FaFacebookF, FaTiktok, FaWhatsapp, FaPhone } from "react-icons/fa";
import "./Footer.css";
import Image from "next/image";
import { FiMail } from "react-icons/fi";
import { DEFAULT_CONTENT, type FooterContent } from "@/lib/cms/defaults";

const Footer = ({ content = DEFAULT_CONTENT.footer }: { content?: FooterContent }) => {
    const socials = [
        { href: content.facebookUrl, label: "Facebook", icon: <FaFacebookF /> },
        { href: content.tiktokUrl, label: "TikTok", icon: <FaTiktok /> },
        { href: content.whatsappUrl, label: "WhatsApp", icon: <FaWhatsapp /> },
    ].filter((s) => s.href);

    return (
        <>
            <footer>
                <div className="container">
                    <div className="sec aboutus">
                        <h2>{content.aboutTitle}</h2>

                        <p>{content.aboutText}</p>
                    </div>

                    <div className="sec quickLinks">
                        <h2>{content.linksTitle}</h2>

                        <ul>
                            {content.links.map((link, i) => (
                                <li key={i}>
                                    <a href={link.href}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="sec contact">
                        <h2>{content.contactTitle}</h2>

                        <ul className="info">
                            {content.phoneDisplay && (
                                <li>
                                    <span>
                                        <FaPhone />
                                    </span>

                                    <p>
                                        <a href={`tel:${content.phoneNumber || content.phoneDisplay.replace(/[^0-9+]/g, "")}`}>
                                            {content.phoneDisplay}
                                        </a>
                                    </p>
                                </li>
                            )}

                            {content.email && (
                                <li>
                                    <span>
                                        <FiMail />
                                    </span>

                                    <p>
                                        <a href={`mailto:${content.email}`}>{content.email}</a>
                                    </p>
                                </li>
                            )}
                        </ul>
                        <ul className="sci">
                            {socials.map((s) => (
                                <li key={s.label}>
                                    <a href={s.href} aria-label={s.label}>
                                        {s.icon}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="sec">
                        <Image
                            src={content.logo}
                            alt={content.logo.alt}
                            className="size-24 rounded-full object-cover"
                        />
                        <h2 className="text-white/50">{content.registration}</h2>
                    </div>
                </div>
            </footer>

            <div className="copyrightText">
                <p>{content.copyright}</p>
            </div>
        </>
    );
};

export default Footer;
