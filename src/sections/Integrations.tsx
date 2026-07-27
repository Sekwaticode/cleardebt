import Tag from "@/components/Tag";
import Testimonial1 from "@/assets/images/Testimonial-1.png";
import Testimonial2 from "@/assets/images/Testimonial-2.png";
import Testimonial3 from "@/assets/images/Testimonial-3.png";
import Testimonial4 from "@/assets/images/Testimonial-4.png";
import Testimonial5 from "@/assets/images/Testimonial-5.png";
import Testimonial6 from "@/assets/images/Testimonial-6.png";
import IntegrationColumn from "@/components/IntegrationsColumn";

const integrations = [
    {
    name: "Sarah M.",
    icon: Testimonial1,
    location: "Johannesburg",
    review:
      "Clear Debt helped me regain control of my finances. The process was simple and the team supported me every step of the way.",
  },
  {
    name: "David K.",
    icon: Testimonial2,
    location: "Cape Town",
    review:
      "I was overwhelmed by debt, but Clear Debt negotiated affordable repayments that changed my life.",
  },
  {
    name: "Thabang N.",
    icon: Testimonial3,
    location: "Durban",
    review:
      "Professional, caring, and transparent. I finally have peace of mind knowing my debt is under control.",
  },
  {
    name: "Michael T.",
    icon: Testimonial4,
    location: "Pretoria",
    review:
      "The consultants explained everything clearly and made the debt review process stress-free.",
  },
  {
    name: "Marco S.",
    icon: Testimonial5,
    location: "Bloemfontein",
    review:
      "Excellent service from start to finish. I highly recommend Clear Debt to anyone struggling financially.",
  },
  {
    name: "Jason R.",
    icon: Testimonial6,
    location: "Port Elizabeth",
    review:
      "Thanks to Clear Debt I can finally budget properly and plan for my future again.",
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
                            We have impacted{" "}
                            <span className="text-fuchsia-400">South Africans</span> across the nation!
                        </h2>

                        <p className="text-white/50 mt-4 text-lg">
                      We have helped a number of ordinary South Africans achieve their financial freedom and relief from debt. Through our tailored, expert debt solutions, we have allowed individuals and families to have a renewed financial liberation.
                        </p>
                    </div>
                    <div className="h-[400px] lg:h-[800px] mt-8 lg:mt-0 overflow-hidden grid  md:grid-cols-2 gap-4 [mask-icon:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
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
