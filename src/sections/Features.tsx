import Tag from "@/components/Tag";
import FeatureCard from "./FeatureCard";
import Image from "next/image";
import Avatar from "@/components/Avatar";
import Key from "@/components/Key";
import HighlightText from "@/components/HighlightText";
import { DEFAULT_CONTENT, type FeaturesContent } from "@/lib/cms/defaults";

export default function Features({ content = DEFAULT_CONTENT.features }: { content?: FeaturesContent }) {
    const { communityCard, supportCard, keysCard } = content;
    return (
        <section className="py-16 md:py-20 lg:py-24">
            <div className="container">
                <div className="flex justify-center">
                    <Tag>{content.tag}</Tag>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-center mt-6 max-w-2xl mx-auto">
                    <HighlightText value={content.heading} />
                </h2>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        title={communityCard.title}
                        description={communityCard.description}
                        className="md:col-span-2 lg:col-span-1 group"
                    >
                        <div className="aspect-video flex items-center justify-center">
                            <Avatar className="z-40">
                                <Image
                                    src={communityCard.avatar1}
                                    alt={communityCard.avatar1.alt}
                                    className="rounded-full"
                                />
                            </Avatar>
                            <Avatar className="-ml-6 border-indigo-500 z-30">
                                <Image
                                    src={communityCard.avatar2}
                                    alt={communityCard.avatar2.alt}
                                    className="rounded-full"
                                />
                            </Avatar>
                            <Avatar className="-ml-6 border-indigo-500 z-20">
                                <Image
                                    src={communityCard.avatar3}
                                    alt={communityCard.avatar3.alt}
                                    className="rounded-full"
                                />
                            </Avatar>
                            <Avatar className="-ml-6 border-transparent group-hover:border-indigo-500 transition">
                                <div className="size-full bg-neutral-700 rounded-full inline-flex items-center justify-center relative">
                                    <Image
                                        src={communityCard.avatar4}
                                        alt={communityCard.avatar4.alt}
                                        className="absolute size-full rounded-full opacity-0 group-hover:opacity-100 transition"
                                    />
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className="size-1.5 rounded-full bg-white inline-flex"
                                        ></span>
                                    ))}
                                </div>
                            </Avatar>
                        </div>
                    </FeatureCard>

                    <FeatureCard
                        title={supportCard.title}
                        description={supportCard.description}
                        className="group"
                    >
                        <div className="aspect-video flex items-center justify-center">
                            <p className="text-4xl font-extrabold text-white/20 group-hover:text-white/10 transition duration-500 text-center">
                                {supportCard.text}{" "}
                                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent relative">
                                    <span>{supportCard.highlight}</span>
                                    <video
                                        src={supportCard.video}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                                    />
                                </span>{" "}
                                {supportCard.suffix}
                            </p>
                        </div>
                    </FeatureCard>

                    <FeatureCard
                        title={keysCard.title}
                        description={keysCard.description}
                        className="group lg:col-span-1"
                    >
                        <div className="aspect-video flex items-center justify-center gap-4">
                            <Key className="w-28 outline outline-2 outline-offset-4 outline-transparent group-hover:outline-fuchsia-400 transition-all duration-500 group-hover:translate-y-1">
                                {keysCard.key1}
                            </Key>

                            <Key className="outline outline-2 outline-offset-4 outline-transparent group-hover:outline-fuchsia-400 transition-all duration-500 group-hover:translate-y-1 delay-150">
                                {keysCard.key2}
                            </Key>

                            <Key className="outline outline-2 outline-offset-4 outline-transparent group-hover:outline-fuchsia-400 transition-all duration-500 group-hover:translate-y-1 delay-300">
                                {keysCard.key3}
                            </Key>
                        </div>
                    </FeatureCard>
                </div>



            </div>

        </section>
    );
}
