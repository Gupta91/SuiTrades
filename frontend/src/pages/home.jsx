import React from "react";
import TradingViewWidget from "../components/tradingViewWidget";
import Navbar from "../components/navbar";
import { ReactTyped } from "react-typed";
import ParticleCanvas from "../components/particleCanvas";
import ToTopButton from "../components/ToTopButton";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useEnokiFlow } from "@mysten/enoki/react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui.js/faucet";
import { ExternalLink } from "lucide-react";

export default function Home() {
    const client = useSuiClient();
    const enokiFlow = useEnokiFlow(); // The EnokiFlow instance
    /* The account information of the current user. */
    const [balance, setBalance] = useState(0);
    /* Transfer form state */
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);

    const [formData, setFormData] = useState({
        recipientAddress: "",
        amount: "",
    });

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const keypair = await enokiFlow.getKeypair({
                    network: "testnet",
                });
                const address = keypair.toSuiAddress();
                const balance = await client.getBalance({ owner: address });
                setBalance(parseInt(balance.totalBalance) / 10 ** 9);
                console.log("Balance____", balance);
            } catch (error) {
                console.error("Error fetching balance:", error);
            }
        };

        fetchBalance();
    }, [transferLoading]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleChangeAddress = (e) => {
        setRecipientAddress(e.target.value);
        console.log(recipientAddress);
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleChangeAmountSell = (e) => {
        setAmount(e.target.value);
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    /**
     * Transfer SUI to another account. This transaction is not sponsored by the app.
     */
    async function transferSui() {
        const promise = async () => {
            // track("Transfer SUI");

            setTransferLoading(true);

            // Validate the transfer amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount)) {
                setTransferLoading(false);
                throw new Error("Invalid amount");
            }

            console.log(
                "Transfering",
                parsedAmount,
                "SUI to",
                recipientAddress
            );

            // Get the keypair for the current user.
            const keypair = await enokiFlow.getKeypair({ network: "testnet" });

            // Create a new transaction block
            const txb = new TransactionBlock();

            console.log("here");

            // Add some transactions to the block...
            const [coin] = txb.splitCoins(txb.gas, [
                txb.pure(parsedAmount * 10 ** 9),
            ]);
            txb.transferObjects([coin], txb.pure(recipientAddress));

            // Sign and execute the transaction block, using the Enoki keypair
            const res = await client.signAndExecuteTransactionBlock({
                signer: keypair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showBalanceChanges: true,
                },
            });

            setTransferLoading(false);

            console.log("Transfer response", res);

            if (res.effects?.status.status !== "success") {
                const suiBalanceChange =
                    res.balanceChanges
                        ?.filter((balanceChange) => {
                            return balanceChange.coinType === "0x2::sui::SUI";
                        })
                        .map((balanceChange) => {
                            return parseInt(balanceChange.amount) / 10 ** 9;
                        })
                        .reduce((acc, change) => {
                            if (change.coinType === "0x2::sui::SUI") {
                                return acc + parseInt(change.amount);
                            }
                            return acc;
                        }) || 0;
                setBalance(balance - suiBalanceChange);
                throw new Error(
                    "Transfer failed with status: " + res.effects?.status.error
                );
            }

            return res;
        };

        toast.promise(promise, {
            loading: "Transfer SUI...",
            success: (data) => {
                const suiBalanceChange =
                    data.balanceChanges
                        ?.filter((balanceChange) => {
                            return balanceChange.coinType === "0x2::sui::SUI";
                        })
                        .map((balanceChange) => {
                            return parseInt(balanceChange.amount) / 10 ** 9;
                        })
                        .reduce((acc, change) => {
                            if (change.coinType === "0x2::sui::SUI") {
                                return acc + parseInt(change.amount);
                            }
                            return acc;
                        }) || 0;
                setBalance(balance - suiBalanceChange);

                return (
                    <span className="flex flex-row items-center gap-2">
                        Transfer successful!{" "}
                        <a
                            href={`https://suiscan.xyz/testnet/tx/${data.digest}`}
                            target="_blank"
                        >
                            <ExternalLink width={12} />
                        </a>
                    </span>
                );
            },
            error: (error) => {
                return error.message;
            },
        });
    }

    /**
     * Transfer SUI to another account. This transaction is not sponsored by the app.
     */
    async function transferSui1() {
        const promise = async () => {
            // track("Transfer SUI");

            setTransferLoading(true);

            // Validate the transfer amount
            const parsedAmount = parseFloat("1");
            if (isNaN(parsedAmount)) {
                setTransferLoading(false);
                throw new Error("Invalid amount");
            }

            console.log(
                "Transfering",
                parsedAmount,
                "SUI to",
                recipientAddress
            );

            // Get the keypair for the current user.
            const keypair = await enokiFlow.getKeypair({ network: "testnet" });

            // Create a new transaction block
            const txb = new TransactionBlock();

            console.log("here");

            // Add some transactions to the block...
            const [coin] = txb.splitCoins(txb.gas, [
                txb.pure(parsedAmount * 10 ** 9),
            ]);
            txb.transferObjects([coin], txb.pure(recipientAddress));

            // Sign and execute the transaction block, using the Enoki keypair
            const res = await client.signAndExecuteTransactionBlock({
                signer: keypair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showBalanceChanges: true,
                },
            });

            // const address = keypair.toSuiAddress();
            // console.log("Address", address);
            // console.log("Keypair", keypair);
            // setSuiAddress(address);

            // const balance = await client.getBalance({ owner: address });
            // console.log("Balance", balance);

            // setBalance(parseInt(balance.totalBalance) / 10 ** 9);

            setTransferLoading(false);

            console.log("Transfer response", res);

            if (res.effects?.status.status !== "success") {
                const suiBalanceChange =
                    res.balanceChanges
                        ?.filter((balanceChange) => {
                            return balanceChange.coinType === "0x2::sui::SUI";
                        })
                        .map((balanceChange) => {
                            return parseInt(balanceChange.amount) / 10 ** 9;
                        })
                        .reduce((acc, change) => {
                            if (change.coinType === "0x2::sui::SUI") {
                                return acc + parseInt(change.amount);
                            }
                            return acc;
                        }) || 0;
                setBalance(balance - suiBalanceChange);
                throw new Error(
                    "Transfer failed with status: " + res.effects?.status.error
                );
            }

            return res;
        };

        toast.promise(promise, {
            loading: "Transfer SUI...",
            success: (data) => {
                const suiBalanceChange =
                    data.balanceChanges
                        ?.filter((balanceChange) => {
                            return balanceChange.coinType === "0x2::sui::SUI";
                        })
                        .map((balanceChange) => {
                            return parseInt(balanceChange.amount) / 10 ** 9;
                        })
                        .reduce((acc, change) => {
                            if (change.coinType === "0x2::sui::SUI") {
                                return acc + parseInt(change.amount);
                            }
                            return acc;
                        }) || 0;
                setBalance(balance - suiBalanceChange);

                return (
                    <span className="flex flex-row items-center gap-2">
                        Transfer successful!{" "}
                        <a
                            href={`https://suiscan.xyz/testnet/tx/${data.digest}`}
                            target="_blank"
                        >
                            <ExternalLink width={12} />
                        </a>
                    </span>
                );
            },
            error: (error) => {
                return error.message;
            },
        });
    }

    /**
     * Transfer SUI to another account. This transaction is not sponsored by the app.
     */
    async function transferSui5() {
        const promise = async () => {
            // track("Transfer SUI");

            setTransferLoading(true);

            // Validate the transfer amount
            const parsedAmount = parseFloat("5");
            if (isNaN(parsedAmount)) {
                setTransferLoading(false);
                throw new Error("Invalid amount");
            }

            console.log(
                "Transfering",
                parsedAmount,
                "SUI to",
                recipientAddress
            );

            // Get the keypair for the current user.
            const keypair = await enokiFlow.getKeypair({ network: "testnet" });

            // Create a new transaction block
            const txb = new TransactionBlock();

            // Add some transactions to the block...
            const [coin] = txb.splitCoins(txb.gas, [
                txb.pure(parsedAmount * 10 ** 9),
            ]);
            txb.transferObjects([coin], txb.pure(recipientAddress));

            // Sign and execute the transaction block, using the Enoki keypair
            const res = await client.signAndExecuteTransactionBlock({
                signer: keypair,
                transactionBlock: txb,
                options: {
                    showEffects: true,
                    showBalanceChanges: true,
                },
            });

            setTransferLoading(false);

            console.log("Transfer response", res);

            if (res.effects?.status.status !== "success") {
                const suiBalanceChange =
                    res.balanceChanges
                        ?.filter((balanceChange) => {
                            return balanceChange.coinType === "0x2::sui::SUI";
                        })
                        .map((balanceChange) => {
                            return parseInt(balanceChange.amount) / 10 ** 9;
                        })
                        .reduce((acc, change) => {
                            if (change.coinType === "0x2::sui::SUI") {
                                return acc + parseInt(change.amount);
                            }
                            return acc;
                        }) || 0;
                setBalance(balance - suiBalanceChange);
                throw new Error(
                    "Transfer failed with status: " + res.effects?.status.error
                );
            }

            return res;
        };

        toast.promise(promise, {
            loading: "Transfer SUI...",
            success: (data) => {
                const suiBalanceChange =
                    data.balanceChanges
                        ?.filter((balanceChange) => {
                            return balanceChange.coinType === "0x2::sui::SUI";
                        })
                        .map((balanceChange) => {
                            return parseInt(balanceChange.amount) / 10 ** 9;
                        })
                        .reduce((acc, change) => {
                            if (change.coinType === "0x2::sui::SUI") {
                                return acc + parseInt(change.amount);
                            }
                            return acc;
                        }) || 0;
                setBalance(balance - suiBalanceChange);

                return (
                    <span className="flex flex-row items-center gap-2">
                        Transfer successful!{" "}
                        <a
                            href={`https://suiscan.xyz/testnet/tx/${data.digest}`}
                            target="_blank"
                        >
                            <ExternalLink width={12} />
                        </a>
                    </span>
                );
            },
            error: (error) => {
                return error.message;
            },
        });
    }

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundImage: `url(/background.jpg)`,
                backgroundSize: "cover", // Add this line
                backgroundPosition: "center", // Add this line
            }}
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
                            "SUItrades",
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
                    initial={{ opacity: 0, x: 10 }}
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
                        Wallet Balance: {balance}
                    </h1>
                </motion.div>
            </div>
            <motion.div
                className="flex justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1, y: -80 }}
                transition={{ duration: 1 }}
            >
                <h1 className="text-white font-serif text-6xl mb-12">
                    Transact
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: -80 }}
                transition={{ duration: 1 }}
            >
                <div className="flex justify-center py-5 text-xl">
                    <motion.button className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg">
                        Recipient Wallet Address:
                    </motion.button>
                    <motion.input
                        className="w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        type="text"
                        name="recipientAddress"
                        value={formData.recipientAddress}
                        onChange={handleChangeAddress}
                        placeholder="Eg. 0xa8837b..."
                        whileHover={{ scale: 1.05 }}
                    />
                </div>

                <div className="flex justify-center text-xl mt-5 mb-24">
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            transferSui1();
                        }}
                    >
                        Send 1 SUI
                    </motion.button>
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            transferSui5();
                        }}
                    >
                        Send 5 SUI
                    </motion.button>
                    <motion.button
                        className=" bg-gradient-to-r from-indigo-700 to-blue-500 text-white  py-2 px-8 mx-2 rounded-lg"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                            transferSui();
                        }}
                    >
                        Send SUI:
                    </motion.button>
                    <motion.input
                        className="w-1/4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        type="number"
                        name="sell"
                        onChange={handleChangeAmountSell}
                        placeholder="Eg. 0.2"
                        whileHover={{ scale: 1.05 }}
                    />
                </div>
            </motion.div>
            <div className="py-28"></div>
        </div>
    );
}
