import client from './suiClient.js';

export const getAccountBalance = async (address) => {
    try {
        const balance = await client.getBalance(address);
        return balance;
    } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
};

export const transferCoins = async (senderPrivateKey, recipientAddress, amount) => {
    try {
        const transaction = await client.transfer({
            sender: senderPrivateKey,
            recipient: recipientAddress,
            amount,
        });
        return transaction;
    } catch (error) {
        console.error('Error transferring coins:', error);
        throw error;
    }
};

