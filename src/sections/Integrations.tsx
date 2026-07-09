import Tag from "@/components/Tag";

import IntegrationColumn from "@/components/IntegrationsColumn";

const integrations = [
    {
        description:
            '"ClearDebt helped me regain control of my finances. The team was professional from start to finish."',
        name: "Sarah Mokoena",
        location: "Johannesburg",
    },
    {
        description:
            '"I never thought improving my credit profile could be this straightforward. Highly recommended."',
        name: "David Nkosi",
        location: "Pretoria",
    },
    {
        description:
            '"The advice I received gave me confidence to move forward financially. Thank you, ClearDebt!"',
        name: "Lerato Jacobs",
        location: "Cape Town",
    },
    {
        description:
            '"Excellent service and clear communication throughout the entire process."',
        name: "Thabo Naidoo",
        location: "Durban",
    },
    {
        description:
            '"The team explained every step and made what felt overwhelming much easier to understand."',
        name: "Amanda Williams",
        location: "Gqeberha",
    },
    {
        description:
            '"Professional, responsive, and genuinely committed to helping clients achieve financial freedom."',
        name: "Michael van der Merwe",
        location: "Bloemfontein",
    },
];

export type IntegrationsType = typeof integrations;

export default function Integrations() {
    return (
        <section className="py-24 overflow-hidden">
            <div className="container">
                <div className="grid lg:grid-cols-2 items-center lg:gap-16">
                    <div>
                        <Tag>Testimonials</Tag>
                        <h2 className="text-6xl font-medium mt-6">
                            Our {" "}
                            <span className="text-fuchsia-400">valuable clients</span> have been impacted by our work!
                        </h2>

                
                    </div>
                    <div className="h-[400px] lg:h-[800px] mt-8 lg:mt-0 overflow-hidden grid  md:grid-cols-2 gap-4 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
                        <IntegrationColumn integrations={integrations} />
                        <IntegrationColumn
                            integrations={integrations.slice().reverse()}
                            reverse
                            className="hidden md:flex"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
