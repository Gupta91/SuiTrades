import React from "react";
import TradingViewWidget from "../components/tradingViewWidget";
import Navbar from "../components/navbar";

export default function Home() {
    return (
        <div style={{ backgroundImage: "url('/background.png')" }}>
            <Navbar />
            <div className="flex justify-center">
                <TradingViewWidget />
            </div>
        </div>
    );
}
