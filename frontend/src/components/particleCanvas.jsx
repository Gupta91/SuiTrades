import React, { useEffect } from "react";
import { tsParticles } from "https://cdn.jsdelivr.net/npm/@tsparticles/engine@3.1.0/+esm";
import { loadAll } from "https://cdn.jsdelivr.net/npm/@tsparticles/all@3.1.0/+esm";

const ParticlesComponent = () => {
    useEffect(() => {
        async function loadParticles(options) {
            await loadAll(tsParticles);
            await tsParticles.load({ id: "tsparticles", options });
        }

        const configs = {
            particles: {
                fullscreen: {
                    enable: false,
                    zIndex: -1,
                },
                number: {
                    value: 150,
                },
                color: {
                    value: "#3b82f6",
                },
                links: {
                    enable: true,
                    distance: 100,
                    color: "#3b82f6",
                },
                shape: {
                    type: "circle",
                },
                opacity: {
                    value: 0.2,
                },
                size: {
                    value: {
                        min: 2,
                        max: 5,
                    },
                },
                move: {
                    enable: true,
                    speed: 1.5,
                },
            },
            background: {
                color: "#fff",
            },
            poisson: {
                enable: true,
            },
        };

        loadParticles(configs);
    }, []);

    return (
        <>
            <div
                style={{
                    position: "relative",
                    zIndex: "-1",
                    maxWidth: "500px",
                    maxHeight: "300px",
                    overflow: "hidden",
                }}
            >
                <div
                    id="tsparticles"
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
        </>
    );
};

export default ParticlesComponent;
