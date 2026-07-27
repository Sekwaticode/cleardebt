import "./Team.css";
import Tag from "@/components/Tag";
import Lihle from "@/assets/images/team-lihle.jpg";
import Tasmin from "@/assets/images/team-tasmin.jpg";
import Zelda from "@/assets/images/team-zelda.jpg";
import Angie from "@/assets/images/team-angie.jpg";
import Image from "next/image";

import "./Team.css";
import { FaInstagram, FaWhatsapp, FaLinkedinIn } from "react-icons/fa";

const teamMembers = [
    {
        id: 1,
        name: "Lihle",
        role: "Debt Specialist",
        description:
            "Helps clients understand debt review, create affordable repayment plans, and take the first step toward financial freedom.",
        image: Lihle,
    },
    {
        id: 2,
        name: "Tasmin",
        role: "Debt Counsellor",
        description:
            "Provides compassionate guidance, assesses financial situations, and supports clients throughout every stage of debt review.",
        image: Tasmin,
    },
    {
        id: 3,
        name: "Zelda",
        role: "Marketing Manager",
        description:
            "Leads marketing initiatives, builds brand awareness, and connects more South Africans with trusted debt relief solutions.",
        image: Zelda,
    },
    {
        id: 4,
        name: "Angie",
        role: "Debt Advisor",
        description:
            "Works closely with clients to explain available options and recommend practical solutions for managing outstanding debt.",
        image: Angie,
    },
];

export default function Team() {
    return (
        <div className="center">
           <Tag>Our Team</Tag>
                <h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                    Our Team of
                    <span className="text-fuchsia-400"> expert</span> debt
                    relief specialists
                </h2>
            <div className="team">
               
                <section className="wrapper">
                    <div className="card_Container">
                        {teamMembers.map((teamMember) => (
                            <div className="card" key={teamMember.id}>
                                <div className="imgBx">
                                    <Image
                                        src={teamMember.image}
                                        alt={teamMember.name}
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
                                            <a href="#">
                                                <FaInstagram />
                                            </a>
                                        </li>

                                        <li style={{ "--i": 2 }}>
                                            <a href="#">
                                                <FaWhatsapp />
                                            </a>
                                        </li>

                                        <li style={{ "--i": 3 }}>
                                            <a href="#">
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
