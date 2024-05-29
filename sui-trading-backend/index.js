import express from 'express';
import bodyParser from 'body-parser';
import { getAccountBalance, transferCoins } from './utils.js';
import { placeOrder, cancelOrder } from './deepbook.js';

const app = express();
app.use(bodyParser.json());

app.get('/balance/:address', async (req, res) => {
    try {
        const balance = await getAccountBalance(req.params.address);
        res.json(balance);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/transfer', async (req, res) => {
    const { senderPrivateKey, recipientAddress, amount } = req.body;
    try {
        const transaction = await transferCoins(senderPrivateKey, recipientAddress, amount);
        res.json(transaction);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/order', async (req, res) => {
    try {
        const response = await placeOrder(req.body);
        res.json(response);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.post('/cancel-order', async (req, res) => {
    try {
        const response = await cancelOrder(req.body.orderId);
        res.json(response);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});