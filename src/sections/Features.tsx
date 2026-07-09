import Tag from "@/components/Tag";
import FeatureCard from "./FeatureCard";
import Image from "next/image";
import avatar1 from "@/assets/images/avatar-ashwin-santiago.jpg";
import avatar2 from "@/assets/images/avatar-lula-meyers.jpg";
import avatar3 from "@/assets/images/avatar-florence-shaw.jpg";
import avatar4 from "@/assets/images/avatar-owen-garcia.jpg";
import Avatar from "@/components/Avatar";
import Key from "@/components/Key";

const features = [
    "Debt Review Removal",
    "Judgement Removal",
    "Update Credit Bureau",
    "Prescribed (Old) Debt Removal",
    "Admin Order Removal",
    "Credit Advice",
];

export default function Features() {
    return (
        <section className="py-16 md:py-20 lg:py-24">
            <div className="container">
                <div className="flex justify-center">
                    <Tag>Services</Tag>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium text-center mt-6 max-w-2xl mx-auto">
                    Trusted debt{" "}
                    <span className="text-fuchsia-400">management</span>
                </h2>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    
                    <FeatureCard
                        title="Helping real South Africans who are just like you!"
                        description="We reach South Africans from Mbombela to Stellenbosch, relieving them from financial stress"
                        className="md:col-span-2 lg:col-span-1 group"
                    >
                        <div className="aspect-video flex items-center justify-center">
                            <Avatar className="z-40">
                                <Image src={avatar1} alt="Avatar1" className="rounded-full" />
                            </Avatar>
                            <Avatar className="-ml-6 border-indigo-500 z-30">
                                <Image src={avatar2} alt="Avatar2" className="rounded-full" />
                            </Avatar>
                            <Avatar className="-ml-6 border-amber-500 z-20">
                                <Image src={avatar3} alt="Avatar3" className="rounded-full" />
                            </Avatar>
                            <Avatar className="-ml-6 border-transparent group-hover:border-green-500 transition">
                                <div className="size-full bg-neutral-700 rounded-full inline-flex items-center justify-center relative">
                                    <Image
                                        src={avatar4}
                                        alt="Avatar 4"
                                        className="absolute size-full rounded-full opacity-0 group-hover:opacity-100 transition"
                                    />
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <span key={i} className="size-1.5 rounded-full bg-white inline-flex"></span>
                                    ))}
                                </div>
                            </Avatar>
                        </div>
                    </FeatureCard>

                    <FeatureCard
                        title="You don't have to do it alone"
                        description="With our expert services, you do not have to feel suffocated and alone. We are here for you!"
                        className="group"
                    >
                        <div className="aspect-video flex items-center justify-center">
                            <p className="text-4xl font-extrabold text-white/20 group-hover:text-white/10 transition duration-500 text-center">
                                Stop it! Get some{" "}
                                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent relative">
                                    <span>Help</span>
                                    <video
                                        src="/assets/vlipsy-michael-jordan-stop-it-get-some-help-BmvcehRm.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none"
                                    />
                                </span>{" "}
                                !
                            </p>
                        </div>
                    </FeatureCard>

                    <FeatureCard
                        title="Control debt, alter your financial future and delete negative credit"
                        description=""
                        className="group lg:col-span-1"
                    >
                        <div className="aspect-video flex items-center justify-center gap-4">
                            <Key className="w-28 outline outline-2 outline-offset-4 outline-transparent group-hover:outline-fuchsia-400 transition-all duration-500 group-hover:translate-y-1">
                                ctrl
                            </Key>

                            <Key className="outline outline-2 outline-offset-4 outline-transparent group-hover:outline-fuchsia-400 transition-all duration-500 group-hover:translate-y-1 delay-150">
                                alt
                            </Key>

                            <Key className="outline outline-2 outline-offset-4 outline-transparent group-hover:outline-fuchsia-400 transition-all duration-500 group-hover:translate-y-1 delay-300">
                                del
                            </Key>
                        </div>
                    </FeatureCard>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                    {features.map((feature) => (
                        <div
                            key={feature}
                            className="bg-neutral-900 border border-white/10 inline-flex px-3 md:px-5 py-1.5 md:py-2 rounded-2xl gap-3 items-center hover:scale-105 transition duration-500 group"
                        >
                            <span className="bg-fuchsia-400 text-neutral-950 size-5 rounded-full inline-flex justify-center text-xl group-hover:rotate-45 transition duration-500">
                                &#10038;
                            </span>
                            <span className="font-medium md:text-lg">
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}