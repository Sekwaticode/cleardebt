import {
    FaFacebookF,
    FaTiktok,
    FaWhatsapp,
    FaPhone,
} from "react-icons/fa";
import "./Footer.css";
import Image from "next/image";
import logoImage from "@/assets/images/logo.jpeg";
import { FiMail } from "react-icons/fi";

const Footer = () => {
    return (
        <>
            <footer>
                <div className="container">
                    <div className="sec aboutus">
                        <h2>About Us</h2>

                        <p>
                            We are passionate about helping South Africans
                            achieve financial freedom by assisting with credit
                            management. Every client matters to us and we&apos;re
                            committed to providing honest, professional and
                            caring service every step of the way.
                        </p>

                        <ul className="sci">
                            <li>
                                <a href="#" aria-label="Facebook">
                                    <FaFacebookF />
                                </a>
                            </li>

                            <li>
                                <a href="#" aria-label="TikTok">
                                    <FaTiktok />
                                </a>
                            </li>

                            <li>
                                <a href="#" aria-label="WhatsApp">
                                    <FaWhatsapp />
                                </a>
                            </li>
                        </ul>
                    </div>

                   

                    <div className="sec quickLinks">
                        <h2>Links</h2>

                        <ul>
                            <li>
                                <a href="#">Home</a>
                            </li>
                            <li>
                                <a href="/about">About</a>
                            </li>
                            <li>
                                <a href="/testimonials">Testimonials</a>
                            </li>
                            <li>
                                <a href="/contact">Contact</a>
                            </li>
                        </ul>
                    </div>

                    <div className="sec contact">
                        <h2>Contact</h2>

                        <ul className="info">
                            <li>
                                <span>
                                    <FaPhone />
                                </span>

                                <p>
                                    <a href="tel:+12345678900">079 393 2311</a>
                                </p>
                            </li>

                            <li>
                                <span>
                                    <FiMail />
                                </span>

                                <p>
                                    <a href="mailto:info@clear-debt.co.za">
                                        info@clear-debt.co.za
                                    </a>
                                </p>
                            </li>
                        </ul>
                    </div>
                     <div className="sec">
                        <Image
                                                       src={logoImage}
                                                       alt="Clear Debt logo"
                                                       className="size-24 rounded-full object-cover"
                                                   />
                    </div>
                </div>
            </footer>

            <div className="copyrightText">
                <p>&copy; Copyright 2026 Sekwaticode. All Rights Reserved.</p>
            </div>
        </>
    );
};

export default Footer;
