import "./Team.css";
import Tag from "@/components/Tag"
import Lihle from "@/assets/images/team-lihle.jpg"
import Tasmin from "@/assets/images/team-tasmin.jpg"
import Zelda from "@/assets/images/team-zelda.jpg"
import Angie from "@/assets/images/team-angie.jpg"
import Image from "next/image";

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
      <div className="team">
        <Tag>Our Team</Tag>
<h2 className="text-6xl font-medium mt-6 text-center max-w-xl mx-auto">
                   Our Team of 
                    <span className="text-fuchsia-400"> expert</span> debt relief specialists
                </h2>
        <div className="profiles">
          {teamMembers.map((member) => (
            <div className="profile" key={member.id}>
              <div className="card">
                <div className="head">
                  <Image src={member.image} alt={member.name} />

                  <div className="name">{member.name}</div>
                </div>

                <div className="content">
                  <div className="role">{member.role}</div>

                  {member.description}
                </div>

                
              </div>

              <Image
  className="w-40 h-40 rounded-full object-cover border-4 border-fuchsia-400 shadow-xl"
                src={member.image}
                alt={member.name}
                id="picture"
              />

              <div className="details">
                {member.name}
                <span>{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}