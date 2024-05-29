import { Canvas } from "@react-three/fiber";

const CubeCanvas = () => {
    return (
        <Canvas
            frameloop="demand"
            camera={{ position: [-4, 3, 6], fov: 45, near: 0.1, far: 200 }}
        ></Canvas>
    );
};

export default CubeCanvas;
