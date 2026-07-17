import "./Team.css";

const teamMembers = [
  {
    id: 1,
    name: "Sophia Diggs",
    role: "Co Founder and CEO",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim, accusamus fuga.",
    image: "/images/avatar 2.png",
    linkedin: "#",
    github: "#",
    email: "#",
  },
  {
    id: 2,
    name: "Lana Ward",
    role: "Content Head",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Consectetur, harum recusandae!",
    image: "/images/avatar 3.png",
    linkedin: "#",
    github: "#",
    email: "#",
  },
  {
    id: 3,
    name: "Jackson Cano",
    role: "Sales Manager",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel magni distinctio quae.",
    image: "/images/avatar 4.png",
    linkedin: "#",
    github: "#",
    email: "#",
  },
];

export default function Team() {
  return (
    <div className="center">
      <div className="team">
        <div className="title">Our Team</div>

        <div className="profiles">
          {teamMembers.map((member) => (
            <div className="profile" key={member.id}>
              <div className="card">
                <div className="head">
                  <img src={member.image} alt={member.name} />

                  <div className="name">{member.name}</div>
                </div>

                <div className="content">
                  <div className="role">{member.role}</div>

                  {member.description}
                </div>

                <div className="icons">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fa-brands fa-linkedin"></i>
                  </a>

                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fa-brands fa-github"></i>
                  </a>

                  <a href={member.email}>
                    <i className="fa-solid fa-envelope"></i>
                  </a>
                </div>
              </div>

              <img
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