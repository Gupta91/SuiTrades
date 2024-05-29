import { DeepBookClient } from '@mysten/deepbook';
import client from './suiClient.js';
const deepBook = new DeepBookClient({
    client,
    currentAddress: '0x000000000000000000000000000000000000000000000000000000000000dee9', // Replace with actual contract address
});

export const placeOrder = async (order) => {
    try {
        const response = await deepBook.placeOrder(order);
        return response;
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
};

export const cancelOrder = async (orderId) => {
    try {
        const response = await deepBook.cancelOrder(orderId);
        return response;
    } catch (error) {
        console.error('Error canceling order:', error);
        throw error;
    }
};

