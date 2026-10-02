import Tag from "@/components/Tag";
import IntegrationColumn from "@/components/IntegrationsColumn";
import HighlightText from "@/components/HighlightText";
import { DEFAULT_CONTENT, type IntegrationsContent } from "@/lib/cms/defaults";

export type IntegrationsType = IntegrationsContent["testimonials"];

export default function Integrations({ content = DEFAULT_CONTENT.integrations }: { content?: IntegrationsContent }) {
    const integrations = content.testimonials;
    return (
        <section className="py-24 overflow-hidden">
            <div className="container">
                <div className="grid lg:grid-cols-2 items-center lg:gap-16">
                    <div>
                        <Tag>{content.tag}</Tag>
                        <h2 className="text-6xl font-medium mt-6">
                            <HighlightText value={content.heading} />
                        </h2>

                        <p className="text-white/50 mt-4 text-lg">
                            {content.description}
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
                </div>{" "}

            </div>
        </section>
    );
}
