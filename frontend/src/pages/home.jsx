import React from "react";
import TradingViewWidget from "../components/tradingViewWidget";
import Navbar from "../components/navbar";
import { ReactTyped } from "react-typed";
import ParticleCanvas from "../components/particleCanvas";
import ToTopButton from "../components/ToTopButton";
import { motion } from "framer-motion";

export default function Home() {
    return (
        <>
            <div
                className="bg-cover min-h-screen"
                style={{ backgroundImage: `url(/background.jpg)` }}
            >
                <Navbar />
                <div className="flex h-screen">
                    <iframe
                        className="w-1/2 h-full"
                        src="https://my.spline.design/clonercubesimplecopy-27368f3c737cc364ab5c03002a2024af/"
                        width="100%"
                        height="100%"
                    ></iframe>
                    <div className="w-1/2 flex items-center">
                        <ReactTyped
                            className="text-white font-serif text-6xl"
                            strings={[
                                "suicoins",
                                "simple transactions",
                                "walletless",
                            ]}
                            typeSpeed={200}
                            loop
                        />
                    </div>
                </div>
                <div className="flex justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1, y: -100 }}
                        transition={{ duration: 1 }}
                        className="relative text-white font-serif text-xl px-16 py-10"
                    >
                        <TradingViewWidget />
                    </motion.div>
                    <motion.div
                        className="text-white text-xl mx-8 font-serif"
                        initial={{ opacity: 0, x: 200 }}
                        whileInView={{ opacity: 1, x: -50 }}
                        transition={{ duration: 1 }}
                    >
                        <h1 className="my-3 bg-gradient-to-r from-indigo-800 to-blue-500 rounded-lg px-3 py-3">
                            Profit:
                        </h1>
                        <h1 className="my-3 bg-gradient-to-r from-indigo-700 to-blue-500 rounded-lg px-3 py-3">
                            Value:
                        </h1>
                        <h1 className="my-3  bg-gradient-to-r from-indigo-700 to-blue-500 rounded-lg px-3 py-3">
                            Market Cap:
                        </h1>
                        <div className="bg-white my-6 h-[3px] w-full"></div>
                        <h1 className="my-3  bg-gradient-to-r from-indigo-700 to-blue-500 rounded-lg px-3 py-3">
                            Net Profit:
                        </h1>
                        <h1 className="my-3  bg-gradient-to-r from-indigo-700 to-blue-500 rounded-lg px-3 py-3">
                            Initial:
                        </h1>
                        <h1 className="my-3  bg-gradient-to-r from-indigo-700 to-blue-500 rounded-lg px-3 py-3">
                            Balance:
                        </h1>
                        <h1 className="my-3  bg-gradient-to-r from-indigo-700 to-blue-500 rounded-lg px-3 py-3">
                            Wallet Balance:
                        </h1>
                    </motion.div>
                </div>
                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1, y: -80 }}
                    transition={{ duration: 1 }}
                >
                    <h1 className="text-white font-serif text-6xl">Transact</h1>
                </motion.div>
                <div className="flex justify-center text-xl mt-24">
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: -80 }}
                        transition={{ duration: 1 }}
                    >
                        Buy 1.0 SUI
                    </motion.button>
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: -80 }}
                        transition={{ duration: 2 }}
                    >
                        Buy 5.0 SUI
                    </motion.button>
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: -80 }}
                        transition={{ duration: 3 }}
                    >
                        Buy X SUI
                    </motion.button>
                </div>
                {/* New set of buttons */}
                <div className="flex justify-center text-xl mt-24">
                    {/* New buttons */}
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: -80 }}
                        transition={{ duration: 3 }}
                    >
                        Sell 25%
                    </motion.button>
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: -80 }}
                        transition={{ duration: 2 }}
                    >
                        Sell 100%
                    </motion.button>
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: -80 }}
                        transition={{ duration: 1 }}
                    >
                        Sell X%
                    </motion.button>
                </div>
                <ToTopButton />
            </div>
        </>
    );
}
