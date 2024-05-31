import React from "react";
import TradingViewWidget from "../components/tradingViewWidget";
import Navbar from "../components/navbar";

export default function About() {
    return (
        <div style={{ backgroundImage: "url('/background.png')" }}>
            <Navbar />
            <div className="flex m-16 mt-16 text-white text-2xl min-h-screen">
                <h1>
                    SUItrades offers an intuitive platform on the Sui blockchain
                    for easy token creation and trading, addressing issues like
                    fair launches and affordability. Leveraging the SUI
                    blockchain, it ensures fast, efficient transactions with
                    fixed gas fees, democratizing crypto innovation. It enables
                    instant trading, fair launch practices, and wallet
                    visualization, simplifying onboarding for new users. With
                    scalable SUI blockchain tech, it fosters broader blockchain
                    adoption by providing equal access to crypto markets.
                    SUItrades aims to demystify crypto and make it accessible to
                    all, revolutionizing the tokenization landscape.
                </h1>
            </div>
        </div>
    );
}
