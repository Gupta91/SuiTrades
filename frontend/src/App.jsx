
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import About from "./pages/about";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { createNetworkConfig, SuiClientProvider } from "@mysten/dapp-kit";
import Mint from "./pages/mint";

function App() {

    const { networkConfig } = createNetworkConfig({
        testnet: { url: getFullnodeUrl("testnet") },
      });
      
    return (
        <>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <EnokiFlowProvider apiKey={import.meta.env.VITE_ENOKI_PUB_KEY}>
        <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/mint" element={<Mint />} />
                </Routes>
            </BrowserRouter>
        </EnokiFlowProvider>
      </SuiClientProvider>
            
        </>
    );
}

export default App;
