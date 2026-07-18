"use client";

import Button from "@/components/Button";
import Pointer from "@/components/Pointer";
import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";
import cursorYouImage from "@/assets/images/cursor-you.svg";

export default function Hero() {
    const [leftPointerScope, leftPointerAnimate] = useAnimate();
    const [rightPointerScope, rightPointerAnimate] = useAnimate();

    useEffect(() => {
      

        leftPointerAnimate([
            [leftPointerScope.current, { opacity: 1 }, { duration: 0.2 }],
            [leftPointerScope.current, { y: 0, x: -100 }, { duration: 0.4 }],
            [
                leftPointerScope.current,
                { x: 0, y: [0, 16, 0] },
                { duration: 0.4, ease: "easeInOut" },
            ],
        ]);


        rightPointerAnimate([
            [
                rightPointerScope.current,
                { opacity: 1 },
                { duration: 0.5, delay: 1.5 },
            ],
            [rightPointerScope.current, { x: 175, y: 0 }, { duration: 0.5 }],
            [
                rightPointerScope.current,
                { x: 0, y: [0, 20, 0] },
                { duration: 0.5 },
            ],
        ]);
    }, []);
    return (
        <section
            className="py-24 overflow-x-clip"
            style={{ cursor: `url(${cursorYouImage.src}), auto` }}
        >
            <div className="container relative">
          

                <motion.div
                    ref={leftPointerScope}
                    initial={{ opacity: 0, y: 100, x: -200 }}
                    className="absolute left-56 top-96"
                >
                    <Pointer name="Credit Repair!" />
                </motion.div>
                <motion.div
                    ref={rightPointerScope}
                    initial={{ opacity: 0, x: 275, y: 100 }}
                    className="absolute right-80 top-4"
                >
                    <Pointer name="Financial Freedom" color="red" />
                </motion.div>
                <div className="flex justify-center">
                    <div className="inline-flex py-1 px-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full text-neutral-950 font-semibold">
                        Helping South Africans become debt free{" "}
                    </div>
                </div>{" "}
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium text-center mt-6">
                    Take Control of Your Debt, Rebuild Your Future{" "}
                </h1>
                <p className="text-center text-xl text-white/50 mt-8 max-w-2xl mx-auto">
                    {" "}
                    ClearDebt helps South Africans improve their financial
                    future through debt review removal, prescribed debt
                    assistance, credit profile updates, judgment removal, and
                    expert credit guidance. Start your journey toward financial
                    freedom with a team you can trust.
                </p>
                <form
                    className="flex border border-white/15 rounded-full p-2 mt-8 md:max-w-2xl mx-auto"
                    id="inputEmail"
                >
                    <input
                        type="email"
                        placeholder="Get you credit assessment now!"
                        className="bg-transparent px-4 md:flex-1 w-full"
                    ></input>
                    <Button
                        type="submit"
                        variant="primary"
                        className="whitespace-nowrap"
                        size="sm"
                    >
                        Contact Us!
                    </Button>
                </form>
            </div>
        </section>
    );
}
