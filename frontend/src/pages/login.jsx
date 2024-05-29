import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
    genAddressSeed,
    generateNonce,
    generateRandomness,
    getExtendedEphemeralPublicKey,
    getZkLoginSignature,
    jwtToAddress,
} from "@mysten/zklogin";
import {
    makeExplorerUrl,
    requestSuiFromFaucet,
    shortenSuiAddress,
} from "@polymedia/suits";
import { Modal, isLocalhost } from "@polymedia/webutils";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";

/* Configuration */

import config from "../config.json"; // copy and modify config.example.json with your own values
import Navbar from "../components/navbar";

const NETWORK = "devnet";
const MAX_EPOCH = 2; // keep ephemeral keys active for this many Sui epochs from now (1 epoch ~= 24h)

const suiClient = new SuiClient({
    url: getFullnodeUrl(NETWORK),
});

/* Session storage keys */

const setupDataKey = "zklogin-demo.setup";
const accountDataKey = "zklogin-demo.accounts";

export default function Login() {
    const accounts = useRef(loadAccounts()); // useRef() instead of useState() because of setInterval()
    const [balances, setBalances] = useState(new Map()); // Map<Sui address, SUI balance>
    const [modalContent, setModalContent] = useState("");

    useEffect(() => {
        completeZkLogin();
        fetchBalances(accounts.current);
        const interval = setInterval(
            () => fetchBalances(accounts.current),
            5_000
        );
        return () => {
            clearInterval(interval);
        };
    }, []);

    /* zkLogin end-to-end */

    /**
     * Start the zkLogin process by getting a JWT token from an OpenID provider.
     * https://docs.sui.io/concepts/cryptography/zklogin#get-jwt-token
     */
    async function beginZkLogin(provider) {
        setModalContent(`🔑 Logging in with ${provider}...`);

        // Create a nonce
        const { epoch } = await suiClient.getLatestSuiSystemState();
        const maxEpoch = Number(epoch) + MAX_EPOCH; // the ephemeral key will be valid for MAX_EPOCH from now
        const ephemeralKeyPair = new Ed25519Keypair();
        const randomness = generateRandomness();
        const nonce = generateNonce(
            ephemeralKeyPair.getPublicKey(),
            maxEpoch,
            randomness
        );

        // Save data to session storage so completeZkLogin() can use it after the redirect
        saveSetupData({
            provider,
            maxEpoch,
            randomness: randomness.toString(),
            ephemeralPrivateKey: ephemeralKeyPair.getSecretKey(),
        });

        // Start the OAuth flow with the OpenID provider
        const urlParamsBase = {
            nonce: nonce,
            redirect_uri: window.location.origin,
            response_type: "id_token",
            scope: "openid",
        };
        let loginUrl;
        switch (provider) {
            case "Google": {
                const urlParams = new URLSearchParams({
                    ...urlParamsBase,
                    client_id: config.CLIENT_ID_GOOGLE,
                });
                loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${urlParams.toString()}`;
                break;
            }
            case "Twitch": {
                const urlParams = new URLSearchParams({
                    ...urlParamsBase,
                    client_id: config.CLIENT_ID_TWITCH,
                    force_verify: "true",
                    lang: "en",
                    login_type: "login",
                });
                loginUrl = `https://id.twitch.tv/oauth2/authorize?${urlParams.toString()}`;
                break;
            }
            case "Facebook": {
                const urlParams = new URLSearchParams({
                    ...urlParamsBase,
                    client_id: config.CLIENT_ID_FACEBOOK,
                });
                loginUrl = `https://www.facebook.com/v19.0/dialog/oauth?${urlParams.toString()}`;
                break;
            }
        }
        window.location.replace(loginUrl);
    }

    /**
     * Complete the zkLogin process.
     * It sends the JWT to the salt server to get a salt, then
     * it derives the user address from the JWT and the salt, and finally
     * it gets a zero-knowledge proof from the Mysten Labs proving service.
     */
    async function completeZkLogin() {
        // === Grab and decode the JWT that beginZkLogin() produced ===
        // https://docs.sui.io/concepts/cryptography/zklogin#decoding-jwt

        // grab the JWT from the URL fragment (the '#...')
        const urlFragment = window.location.hash.substring(1);
        const urlParams = new URLSearchParams(urlFragment);
        const jwt = urlParams.get("id_token");
        if (!jwt) {
            return;
        }

        // remove the URL fragment
        window.history.replaceState(null, "", window.location.pathname);

        // decode the JWT
        const jwtPayload = jwtDecode(jwt);
        if (!jwtPayload.sub || !jwtPayload.aud) {
            console.warn("[completeZkLogin] missing jwt.sub or jwt.aud");
            return;
        }

        // === Get the salt ===
        // https://docs.sui.io/concepts/cryptography/zklogin#user-salt-management

        const requestOptions =
            config.URL_SALT_SERVICE === "/dummy-salt-service.json"
                ? // dev, using a JSON file (same salt all the time)
                  {
                      method: "GET",
                  }
                : // prod, using an actual salt server
                  {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ jwt }),
                  };

        const saltResponse = await fetch(
            config.URL_SALT_SERVICE,
            requestOptions
        )
            .then((res) => {
                console.debug("[completeZkLogin] salt service success");
                return res.json();
            })
            .catch((error) => {
                console.warn("[completeZkLogin] salt service error:", error);
                return null;
            });

        if (!saltResponse) {
            return;
        }

        const userSalt = BigInt(saltResponse.salt);

        // === Get a Sui address for the user ===
        // https://docs.sui.io/concepts/cryptography/zklogin#get-the-users-sui-address

        const userAddr = jwtToAddress(jwt, userSalt);

        // === Load and clear the data which beginZkLogin() created before the redirect ===
        const setupData = loadSetupData();
        if (!setupData) {
            console.warn("[completeZkLogin] missing session storage data");
            return;
        }
        clearSetupData();
        for (const account of accounts.current) {
            if (userAddr === account.userAddr) {
                console.warn(
                    `[completeZkLogin] already logged in with this ${setupData.provider} account`
                );
                return;
            }
        }

        // === Get the zero-knowledge proof ===
        // https://docs.sui.io/concepts/cryptography/zklogin#get-the-zero-knowledge-proof

        const ephemeralKeyPair = keypairFromSecretKey(
            setupData.ephemeralPrivateKey
        );
        const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();
        const payload = JSON.stringify(
            {
                maxEpoch: setupData.maxEpoch,
                jwtRandomness: setupData.randomness,
                extendedEphemeralPublicKey:
                    getExtendedEphemeralPublicKey(ephemeralPublicKey),
                jwt,
                salt: userSalt.toString(),
                keyClaimName: "sub",
            },
            null,
            2
        );

        console.debug("[completeZkLogin] Requesting ZK proof with:", payload);
        setModalContent(
            "⏳ Requesting ZK proof. This can take a few seconds..."
        );

        const zkProofs = await fetch(config.URL_ZK_PROVER, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
        })
            .then((res) => {
                console.debug("[completeZkLogin] ZK proving service success");
                return res.json();
            })
            .catch((error) => {
                console.warn(
                    "[completeZkLogin] ZK proving service error:",
                    error
                );
                return null;
            })
            .finally(() => {
                setModalContent("");
            });

        if (!zkProofs) {
            return;
        }

        // === Save data to session storage so sendTransaction() can use it ===
        saveAccount({
            provider: setupData.provider,
            userAddr,
            zkProofs,
            ephemeralPrivateKey: setupData.ephemeralPrivateKey,
            userSalt: userSalt.toString(),
            sub: jwtPayload.sub,
            aud:
                typeof jwtPayload.aud === "string"
                    ? jwtPayload.aud
                    : jwtPayload.aud[0],
            maxEpoch: setupData.maxEpoch,
        });
    }

    /**
     * Assemble a zkLogin signature and submit a transaction
     * https://docs.sui.io/concepts/cryptography/zklogin#assemble-the-zklogin-signature-and-submit-the-transaction
     */
    async function sendTransaction(account) {
        setModalContent("🚀 Sending transaction...");

        // Sign the transaction bytes with the ephemeral private key
        const txb = new TransactionBlock();
        txb.setSender(account.userAddr);

        const ephemeralKeyPair = keypairFromSecretKey(
            account.ephemeralPrivateKey
        );
        const { bytes, signature: userSignature } = await txb.sign({
            client: suiClient,
            signer: ephemeralKeyPair,
        });

        // Generate an address seed by combining userSalt, sub (subject ID), and aud (audience)
        const addressSeed = genAddressSeed(
            BigInt(account.userSalt),
            "sub",
            account.sub,
            account.aud
        ).toString();

        // Serialize the zkLogin signature by combining the ZK proof (inputs), the maxEpoch,
        // and the ephemeral signature (userSignature)
        const zkLoginSignature = getZkLoginSignature({
            inputs: {
                ...account.zkProofs,
                addressSeed,
            },
            maxEpoch: account.maxEpoch,
            userSignature,
        });

        // Execute the transaction
        await suiClient
            .executeTransactionBlock({
                transactionBlock: bytes,
                signature: zkLoginSignature,
                options: {
                    showEffects: true,
                },
            })
            .then((result) => {
                console.debug(
                    "[sendTransaction] executeTransactionBlock response:",
                    result
                );
                fetchBalances([account]);
            })
            .catch((error) => {
                console.warn(
                    "[sendTransaction] executeTransactionBlock failed:",
                    error
                );
                return null;
            })
            .finally(() => {
                setModalContent("");
            });
    }

    /**
     * Create a keypair from a base64-encoded secret key
     */
    function keypairFromSecretKey(privateKeyBase64) {
        const keyPair = decodeSuiPrivateKey(privateKeyBase64);
        return Ed25519Keypair.fromSecretKey(keyPair.secretKey);
    }

    /**
     * Get the SUI balance for each account
     */
    async function fetchBalances(accounts) {
        if (accounts.length == 0) {
            return;
        }
        const newBalances = new Map();
        for (const account of accounts) {
            const suiBalance = await suiClient.getBalance({
                owner: account.userAddr,
                coinType: "0x2::sui::SUI",
            });
            newBalances.set(
                account.userAddr,
                +suiBalance.totalBalance / 1_000_000_000
            );
        }
        setBalances(
            (prevBalances) => new Map([...prevBalances, ...newBalances])
        );
    }

    /* Session storage */

    function saveSetupData(data) {
        sessionStorage.setItem(setupDataKey, JSON.stringify(data));
    }

    function loadSetupData() {
        const dataRaw = sessionStorage.getItem(setupDataKey);
        if (!dataRaw) {
            return null;
        }
        const data = JSON.parse(dataRaw);
        return data;
    }

    function clearSetupData() {
        sessionStorage.removeItem(setupDataKey);
    }

    function saveAccount(account) {
        const newAccounts = [account, ...accounts.current];
        sessionStorage.setItem(accountDataKey, JSON.stringify(newAccounts));
        accounts.current = newAccounts;
        fetchBalances([account]);
    }

    function loadAccounts() {
        const dataRaw = sessionStorage.getItem(accountDataKey);
        if (!dataRaw) {
            return [];
        }
        const data = JSON.parse(dataRaw);
        return data;
    }

    function clearState() {
        sessionStorage.clear();
        accounts.current = [];
        setBalances(new Map());
    }

    /* HTML */

    const openIdProviders = isLocalhost()
        ? ["Google", "Twitch", "Facebook"]
        : ["Google", "Twitch"]; // Facebook requires business verification to publish the app
    return (
        <div id="page">
            <div
                className="bg-cover bg-center min-h-screen"
                style={{ backgroundImage: `url(/background.jpg)` }}
            >
                <Navbar />
                <Modal content={modalContent} />

                <div className="text-white text-xl w-1/4 px-4 py-2 bg-gradient-to-r from-indigo-800 to-blue-500 rounded-lg mx-16 mt-8" id="network-indicator">
                    <label>Connected to {NETWORK}</label>
                </div>

                <div id="login-buttons" className="text-white text-xl px-4 py-2rounded-lg mx-12">
                    <h2 className="font-bold my-5">Log in:</h2>
                    {openIdProviders.map((provider) => (
                        <button
                            className={`btn-login mr-3 px-4 py-2 bg-gradient-to-r from-indigo-800 to-blue-500 rounded-lg  ${provider}`}
                            onClick={() => {
                                beginZkLogin(provider);
                            }}
                            key={provider}
                        >
                            {provider}
                        </button>
                    ))}
                </div>

                {accounts.current.length > 0 && (
                    <div id="accounts" className="section">
                        <h2>Accounts:</h2>
                        {accounts.current.map((acct) => {
                            const balance = balances.get(acct.userAddr);
                            const explorerLink = makeExplorerUrl(
                                NETWORK,
                                "address",
                                acct.userAddr
                            );
                            return (
                                <div className="account" key={acct.userAddr}>
                                    <div>
                                        <label
                                            className={`provider ${acct.provider}`}
                                        >
                                            {acct.provider}
                                        </label>
                                    </div>
                                    <div>
                                        Address:{" "}
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href={explorerLink}
                                        >
                                            {shortenSuiAddress(acct.userAddr)}
                                        </a>
                                    </div>
                                    <div>User ID: {acct.sub}</div>
                                    <div>
                                        Balance:{" "}
                                        {typeof balance === "undefined"
                                            ? "(loading)"
                                            : `${balance} SUI`}
                                    </div>
                                    <button
                                        className={`btn-send ${
                                            !balance ? "disabled" : ""
                                        }`}
                                        disabled={!balance}
                                        onClick={() => {
                                            sendTransaction(acct);
                                        }}
                                    >
                                        Send transaction
                                    </button>
                                    {balance === 0 && (
                                        <button
                                            className="btn-faucet"
                                            onClick={() => {
                                                requestSuiFromFaucet(
                                                    NETWORK,
                                                    acct.userAddr
                                                );
                                                setModalContent(
                                                    "💰 Requesting SUI from faucet. This will take a few seconds..."
                                                );
                                                setTimeout(() => {
                                                    setModalContent("");
                                                }, 3000);
                                            }}
                                        >
                                            Use faucet
                                        </button>
                                    )}
                                    <hr />
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="text-white text-xl px-4 py-2 my-5 rounded-lg mx-16">
                    <button
                        className="btn-clear"
                        onClick={() => {
                            clearState();
                        }}
                    >
                        🧨 CLEAR STATE
                    </button>
                </div>
            </div>
        </div>
    );
}
