import "./Team.css";
import Tag from "@/components/Tag";
import Image from "next/image";
import HighlightText from "@/components/HighlightText";
import { DEFAULT_CONTENT } from "@/lib/cms/defaults";

import { FaInstagram, FaWhatsapp, FaLinkedinIn } from "react-icons/fa";

/** @param {{ content?: import("@/lib/cms/defaults").TeamContent }} props */
export default function Team({ content = DEFAULT_CONTENT.team }) {
    return (
        <div className="center">
           <Tag>{content.tag}</Tag>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    <HighlightText value={content.heading} />
                </h2>
            <div className="team">

                <section className="wrapper">
                    <div className="card_Container">
                        {content.members.map((teamMember, index) => (
                            <div className="card" key={index}>
                                <div className="imgBx">
                                    <Image
                                        src={teamMember.image}
                                        alt={teamMember.image.alt || teamMember.name}
                                    />
                                </div>

                                <div className="content">
                                    <div className="contentBx">
                                        <h3>
                                            {teamMember.name}
                                            <br />
                                            <span>{teamMember.role}</span>
                                        </h3>
                                    </div>

                                    <ul className="sci">
                                        <li style={{ "--i": 1 }}>
                                            <a href={teamMember.instagramUrl || "#"} aria-label={`${teamMember.name} on Instagram`}>
                                                <FaInstagram />
                                            </a>
                                        </li>

                                        <li style={{ "--i": 2 }}>
                                            <a href={teamMember.whatsappUrl || "#"} aria-label={`${teamMember.name} on WhatsApp`}>
                                                <FaWhatsapp />
                                            </a>
                                        </li>

                                        <li style={{ "--i": 3 }}>
                                            <a href={teamMember.linkedinUrl || "#"} aria-label={`${teamMember.name} on LinkedIn`}>
                                                <FaLinkedinIn />
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
