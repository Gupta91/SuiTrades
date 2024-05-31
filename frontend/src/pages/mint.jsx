import Navbar from "../components/navbar";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Mint() {
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        description: "",
        imageUrl: "",
        decimals: "9",
        totalSupply: "",
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation logic here
        onSubmit(formData);
    };

    return (
        <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: `url(/background.jpg)` }}>
            <Navbar />
            <motion.form
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5 }}
                className="mx-auto w-full max-w-2xl overflow-hidden bg-gray-100 rounded-lg shadow-lg"
                onSubmit={handleSubmit}
            >
                <h1 className="text-3xl font-bold text-center p-6">Coin Generator</h1>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block mb-1">Name</label>
                        <motion.input
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Eg. Sui"
                            whileHover={{ scale: 1.05 }}

                        />
                        {errors.name && (
                            <span className="text-red-500">{errors.name}</span>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1">Coin Symbol</label>
                        <motion.input
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            type="text"
                            name="symbol"
                            value={formData.symbol}
                            onChange={handleChange}
                            placeholder="Eg. SUI"
                            whileHover={{ scale: 1.05 }}

                        />
                        {errors.symbol && (
                            <span className="text-red-500">{errors.symbol}</span>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1">Description (Optional)</label>
                        <motion.input
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Eg. Some description about the coin"
                            whileHover={{ scale: 1.05 }}

                        />
                        {errors.description && (
                            <span className="text-red-500">{errors.description}</span>
                        )}
                    </div>
                </div>
                <div className="flex justify-center p-6">
                    <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 text-white bg-blue-800 rounded-md hover:bg-black focus:outline-none font-bold text-xl"
                        type="submit"
                    >
                        Create coin
                    </motion.button>
                </div>
            </motion.form>
        </div>
    );
}
