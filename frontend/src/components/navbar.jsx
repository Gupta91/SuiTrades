// import React from "react";
import Login from "./login";
import "../App.css";

export default function Navbar() {
    return (
        <>
            <div className="flex flex-wrap">
                <section className="relative mx-auto">
                    <nav className="flex justify-between bg-transparent text-white font-bold w-screen">
                        <div className="px-5 xl:px-12 py-6 flex w-full items-center">
                            <ul className="hidden md:flex px-4 font-serif space-x-12">
                                <li>
                                    <a
                                        className="font-serif hover:text-blue-500 text-xl tracking-widest"
                                        href="/"
                                    >
                                        HOME
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="font-serif hover:text-blue-500 text-xl tracking-widest"
                                        href="/about"
                                    >
                                        ABOUT
                                    </a>
                                </li>
                            </ul>
                            <div className="flex-grow"></div>
                            <Login className="justify-right"/>
                        </div>
                    </nav>
                </section>
            </div>
        </>
    );
}
