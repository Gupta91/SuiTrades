import { useEnokiFlow } from "@mysten/enoki/react";
import { useEffect, useState } from "react";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui.js/faucet";
import { ExternalLink } from "lucide-react";
// import {
//     Card,
//     CardContent,
//     CardDescription,
//     CardFooter,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "sonner";
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger,
// } from "@/components/ui/popover";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { track } from "@vercel/analytics";

export default function Login() {
    const client = useSuiClient();
    const enokiFlow = useEnokiFlow(); // The EnokiFlow instance

    /**
     * The current user session, if any. This is used to determine whether the user is logged in or
     * not.
     */
    const [session, setSession] = useState(null);

    /* The account information of the current user. */
    const [suiAddress, setSuiAddress] = useState(null);
    const [balance, setBalance] = useState(0);
    const [accountLoading, setAccountLoading] = useState(true);

    /* Transfer form state */
    const [recipientAddress, setRecipientAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);

    /* Counter state */
    const [counter, setCounter] = useState(0);
    const [counterLoading, setCounterLoading] = useState(false);
    const [countLoading, setCountLoading] = useState(false);

    /**
     * When the page loads, complete the login flow.
     */
    useEffect(() => {
        completeLogin();
    }, []);

    /**
     * When the user logs in, fetch the account information.
     */
    useEffect(() => {
        if (session) {
            getAccountInfo();
            getCount();
        }
    }, [session]);

    /**
     * Complete the Enoki login flow after the user is redirected back to the app.
     */
    const completeLogin = async () => {
        try {
            await enokiFlow.handleAuthCallback();
        } catch (error) {
            console.error("Error handling auth callback", error);
        } finally {
            // Fetch the session
            const session = await enokiFlow.getSession();
            console.log("Session", session);
            if (session && session.jwt) {
                setSession(session);
            }

            // remove the URL fragment
            window.history.replaceState(null, "", window.location.pathname);
        }
    };

    /**
     * Fetch the account information of the current user.
     */
    const getAccountInfo = async () => {
        setAccountLoading(true);

        const keypair = await enokiFlow.getKeypair({ network: "testnet" });
        const address = keypair.toSuiAddress();
        console.log("Address", address);
        console.log("Keypair", keypair);
        setSuiAddress(address);

        const balance = await client.getBalance({ owner: address });
        console.log("Balance", balance);

        setBalance(parseInt(balance.totalBalance) / 10 ** 9);

        setAccountLoading(false);
    };

    /**
     * Request SUI from the faucet.
     */
    const onRequestSui = async () => {
        const promise = async () => {
            track("Request SUI");

            // Ensures the user is logged in and has a SUI address.
            if (!suiAddress) {
                throw new Error("No SUI address found");
            }

            if (balance > 3) {
                throw new Error("You already have enough SUI!");
            }

            // Request SUI from the faucet.
            const res = await requestSuiFromFaucetV0({
                host: getFaucetHost("testnet"),
                recipient: suiAddress,
            });

            if (res.error) {
                throw new Error(res.error);
            }

            return res;
        };

        toast.promise(promise, {
            loading: "Requesting SUI...",
            success: (data) => {
                console.log("SUI requested successfully!", data);

                const suiBalanceChange = data.transferredGasObjects
                    .map((faucetUpdate) => {
                        return faucetUpdate.amount / 10 ** 9;
                    })
                    .reduce((acc, change) => {
                        return acc + change;
                    }, 0);

                setBalance(balance + suiBalanceChange);

                return "SUI requested successfully! ";
            },
            error: (error) => {
                return error.message;
            },
        });
    };

    /**
     * Transfer SUI to another account. This transaction is not sponsored by the app.
     */
    async function transferSui() {
        const promise = async () => {
            track("Transfer SUI");

            setTransferLoading(true);

            // Validate the transfer amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount)) {
                setTransferLoading(false);
                throw new Error("Invalid amount");
            }

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

    async function getCount() {
        setCountLoading(true);

        const res = await client.getObject({
            id: "0xd710735500fc1be7dc448b783ad1fb0b5fd209890a67e518cc47e7dc26856aa6",
            options: {
                showContent: true,
            },
        });

        setCounter(Number(res.data.content.fields.count));

        setCountLoading(false);
    }

    /**
     * Increment the global counter. This transaction is sponsored by the app.
     */
    async function incrementCounter() {
        const promise = async () => {
            track("Increment Counter");

            setCounterLoading(true);

            // Create a new transaction block
            const txb = new TransactionBlock();

            // Add some transactions to the block...
            txb.moveCall({
                arguments: [
                    txb.pure(
                        "0xd710735500fc1be7dc448b783ad1fb0b5fd209890a67e518cc47e7dc26856aa6"
                    ),
                ],
                target: "0x5794fff859ee70e28ec8a419f2a73830fb66bcaaaf76a68e41fcaf5e057d7bcc::global_counter::increment",
            });

            try {
                // Sponsor and execute the transaction block, using the Enoki keypair
                const res = await enokiFlow.sponsorAndExecuteTransactionBlock({
                    transactionBlock: txb,
                    network: "testnet",
                    client,
                });
                setCounterLoading(false);

                return res;
            } catch (error) {
                setCounterLoading(false);
                throw error;
            }
        };

        toast.promise(promise, {
            loading: "Incrementing counter...",
            success: (data) => {
                getCount();
                return (
                    <span className="flex flex-row items-center gap-2">
                        Counter incremented!{" "}
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

    const [isHovered, setIsHovered] = useState(false);
    const [copySuccess, setCopySuccess] = useState("");

    const copyToClipboard = () => {
        navigator.clipboard.writeText(suiAddress).then(
            () => {
                setCopySuccess("✓");
                setTimeout(() => setCopySuccess(""), 2000); // Clear the message after 2 seconds
            },
            (err) => {
                console.error("Failed to copy: ", err);
            }
        );
    };

    const truncateAddress = (address, length) => {
        if (address.length <= length) return address;
        const truncated = address.substring(0, length) + "...";
        return truncated;
    };

    if (session) {
        return (
            <div className="relative inline-block">
                <img
                    src="profile.png"
                    alt="Profile"
                    style={{ height: 50, width: 50 }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="cursor-pointer"
                />
                {isHovered && (
                    <div
                        className="absolute top-12 w-78 -translate-x-60 bg-black rounded shadow-lg p-4"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <p className="text-white">Wallet Adress:</p>
                        <div className="flex items-center py-2 space-x-2">
                            <button
                                onClick={copyToClipboard}
                                className="text-white bg-gray-800 p-1 rounded hover:bg-gray-700 focus:outline-none"
                                title="Copy to clipboard"
                            >
                                <i className="fas fa-copy"></i>
                            </button>
                            {copySuccess && (
                                <span className="text-green-500">
                                    {copySuccess}
                                </span>
                            )}
                            <p className="text-white">
                                {truncateAddress(suiAddress, 25)}
                            </p>
                        </div>
                        <p className="text-white">Balance:</p>
                        <p className="text-white">{balance} SUI</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start">
            {/* <a href="https://github.com/dantheman8300/enoki-example-app" target="_blank" className="absolute top-4 right-0 sm:right-4" onClick={() => {track('github')}}><Button variant={'link'} size={'icon'}><Github /></Button></a>
      <div>
        <h1 className="text-4xl font-bold m-4">Enoki Demo App</h1>
        <p className="text-md m-4 opacity-50 max-w-md">This is a demo app that showcases the <a href="https://portal.enoki.mystenlabs.com" target="_blank" className="underline cursor-pointer text-blue-700 hover:text-blue-500">Enoki</a> zkLogin flow and sponsored transaction flow. NOTE: This example runs on the <span className="text-blue-700">Sui test network</span></p>
      </div> */}
            {console.log("session", session)}
            {session ? (
                <a className="text-white text-6xl absolute z-10">Logged in</a>
            ) : (
                <a
                    onClick={async () => {
                        track("Sign in with Google");
                        console.log(import.meta.env.VITE_ENOKI_PUB_KEY);
                        console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
                        window.location.href =
                            await enokiFlow.createAuthorizationURL({
                                provider: "google",
                                clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                                redirectUrl: window.location.href.split("#")[0],
                                network: "testnet",
                            });
                        completeLogin();
                    }}
                >
                    Sign in with Google
                </a>
            )}
        </div>
    );
}
