import MagicBento from "@/components/MagicBento";
import Tag from "@/components/Tag";
import HighlightText from "@/components/HighlightText";
import {
    DEFAULT_CONTENT,
    type MagicBentoContent,
    type ServicesContent,
    type StepperContent,
} from "@/lib/cms/defaults";

export default function Services({
    content = DEFAULT_CONTENT.services,
    bento = DEFAULT_CONTENT.magicBento,
    stepper = DEFAULT_CONTENT.stepper,
}: {
    content?: ServicesContent;
    bento?: MagicBentoContent;
    stepper?: StepperContent;
}) {
    return (
        <section className="py-16 md:py-20 lg:py-24">
            <div className="container">
                <div className="flex flex-col items-center">
                    <Tag>{content.tag}</Tag>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-center mt-6 max-w-2xl mx-auto">
                        <HighlightText value={content.heading} />
                    </h2>

                    <p className="text-white/60 text-center mt-6 max-w-xl">
                        {content.description}
                    </p>

                    <div className="mt-12 w-full">
                        <MagicBento
                            content={bento}
                            stepper={stepper}
                            textAutoHide={true}
                            enableStars
                            enableSpotlight
                            enableBorderGlow={true}
                            enableTilt={false}
                            enableMagnetism={false}
                            clickEffect
                            spotlightRadius={400}
                            particleCount={12}
                            glowColor="132, 0, 255"
                            disableAnimations={false}
                        />
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3 justify-center">
                        {content.pills.map((feature, i) => (
                            <div
                                key={i}
                                className="bg-neutral-900 border border-white/10 inline-flex px-3 md:px-5 py-1.5 md:py-2 rounded-2xl gap-3 items-center hover:scale-105 transition duration-500 group"
                            >
                                <span className="bg-fuchsia-400 text-neutral-950 size-5 rounded-full inline-flex justify-center items-center text-xl group-hover:rotate-45 transition duration-500">
                                    &#10038;
                                </span>

                                <span className="font-medium md:text-lg">
                                    {feature.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
