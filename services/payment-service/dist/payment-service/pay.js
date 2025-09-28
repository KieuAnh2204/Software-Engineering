"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const rabbitmq_service_1 = require("../shared/rabbitmq.service");
const events_1 = require("../shared/events");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const rabbitmqService = new rabbitmq_service_1.RabbitMQService(RABBITMQ_URL, 'payment-service');
const payments = [];
const mockPaymentProviders = {
    'credit_card': {
        name: 'Credit Card Processor',
        process: async (payment) => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const success = Math.random() > 0.1;
            if (success) {
                return {
                    success: true,
                    transactionId: `cc_${(0, uuid_1.v4)()}`,
                };
            }
            else {
                return {
                    success: false,
                    error: 'Payment declined by bank',
                };
            }
        },
    },
    'paypal': {
        name: 'PayPal',
        process: async (payment) => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const success = Math.random() > 0.05;
            if (success) {
                return {
                    success: true,
                    transactionId: `pp_${(0, uuid_1.v4)()}`,
                };
            }
            else {
                return {
                    success: false,
                    error: 'Insufficient funds in PayPal account',
                };
            }
        },
    },
    'bank_transfer': {
        name: 'Bank Transfer',
        process: async (payment) => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const success = Math.random() > 0.15;
            if (success) {
                return {
                    success: true,
                    transactionId: `bt_${(0, uuid_1.v4)()}`,
                };
            }
            else {
                return {
                    success: false,
                    error: 'Bank transfer failed - insufficient funds',
                };
            }
        },
    },
};
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const response = await axios_1.default.post(`${USER_SERVICE_URL}/users/validate-token`, { token });
        req.user = response.data.user;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
app.get('/health', (req, res) => {
    res.json({ service: 'payment-service', status: 'healthy', timestamp: new Date() });
});
app.post('/payments', authenticateToken, async (req, res) => {
    try {
        const { orderId, amount, currency = 'USD', paymentMethod, metadata } = req.body;
        const userId = req.user.userId;
        if (!orderId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Order ID, amount, and payment method are required' });
        }
        if (!mockPaymentProviders[paymentMethod]) {
            return res.status(400).json({
                error: 'Invalid payment method',
                supportedMethods: Object.keys(mockPaymentProviders)
            });
        }
        const existingPayment = payments.find(p => p.orderId === orderId && p.status !== 'failed');
        if (existingPayment) {
            return res.status(409).json({ error: 'Payment already exists for this order' });
        }
        const newPayment = {
            id: (0, uuid_1.v4)(),
            orderId,
            userId,
            amount: Number(amount),
            currency,
            paymentMethod,
            status: 'pending',
            metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        payments.push(newPayment);
        await rabbitmqService.publishEvent(events_1.EXCHANGES.PAYMENT_EXCHANGE, 'payment.initiated', events_1.PAYMENT_EVENTS.PAYMENT_INITIATED, {
            paymentId: newPayment.id,
            orderId: newPayment.orderId,
            userId: newPayment.userId,
            amount: newPayment.amount,
            currency: newPayment.currency,
            paymentMethod: newPayment.paymentMethod,
            initiatedAt: newPayment.createdAt,
        });
        processPaymentAsync(newPayment);
        res.status(201).json({
            paymentId: newPayment.id,
            status: newPayment.status,
            amount: newPayment.amount,
            currency: newPayment.currency,
            paymentMethod: newPayment.paymentMethod,
        });
    }
    catch (error) {
        console.error('Initiate payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/payments/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const payment = payments.find(p => p.id === id && p.userId === userId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json({
            id: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            transactionId: payment.transactionId,
            failureReason: payment.failureReason,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            completedAt: payment.completedAt,
        });
    }
    catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/payments', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const { status, page = 1, limit = 10 } = req.query;
        let userPayments = payments.filter(p => p.userId === userId);
        if (status) {
            userPayments = userPayments.filter(p => p.status === status);
        }
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedPayments = userPayments.slice(startIndex, endIndex);
        res.json({
            payments: paginatedPayments.map(p => ({
                id: p.id,
                orderId: p.orderId,
                amount: p.amount,
                currency: p.currency,
                paymentMethod: p.paymentMethod,
                status: p.status,
                transactionId: p.transactionId,
                failureReason: p.failureReason,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                completedAt: p.completedAt,
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: userPayments.length,
                pages: Math.ceil(userPayments.length / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/payments/:id/refund', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Customer requested refund' } = req.body;
        const userId = req.user.userId;
        const payment = payments.find(p => p.id === id && p.userId === userId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        if (payment.status !== 'completed') {
            return res.status(400).json({ error: 'Only completed payments can be refunded' });
        }
        payment.status = 'refunded';
        payment.updatedAt = new Date();
        payment.metadata = { ...payment.metadata, refundReason: reason };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.PAYMENT_EXCHANGE, events_1.ROUTING_KEYS.PAYMENT_REFUNDED, events_1.PAYMENT_EVENTS.PAYMENT_REFUNDED, {
            paymentId: payment.id,
            orderId: payment.orderId,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            reason,
            refundedAt: payment.updatedAt,
        });
        res.json({
            paymentId: payment.id,
            status: payment.status,
            refundedAt: payment.updatedAt,
        });
    }
    catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/payment-methods', (req, res) => {
    try {
        const methods = Object.keys(mockPaymentProviders).map(key => ({
            id: key,
            name: mockPaymentProviders[key].name,
        }));
        res.json(methods);
    }
    catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/admin/payments', authenticateToken, (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let filteredPayments = [...payments];
        if (status) {
            filteredPayments = filteredPayments.filter(p => p.status === status);
        }
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
        res.json({
            payments: paginatedPayments,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: filteredPayments.length,
                pages: Math.ceil(filteredPayments.length / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get admin payments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
async function processPaymentAsync(payment) {
    try {
        payment.status = 'processing';
        payment.updatedAt = new Date();
        const provider = mockPaymentProviders[payment.paymentMethod];
        const result = await provider.process(payment);
        if (result.success) {
            payment.status = 'completed';
            payment.transactionId = result.transactionId;
            payment.completedAt = new Date();
            payment.updatedAt = new Date();
            const paymentCompletedEvent = {
                paymentId: payment.id,
                orderId: payment.orderId,
                userId: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                paymentMethod: payment.paymentMethod,
                completedAt: payment.completedAt,
            };
            await rabbitmqService.publishEvent(events_1.EXCHANGES.PAYMENT_EXCHANGE, events_1.ROUTING_KEYS.PAYMENT_COMPLETED, events_1.PAYMENT_EVENTS.PAYMENT_COMPLETED, paymentCompletedEvent);
            console.log(`Payment ${payment.id} completed successfully`);
        }
        else {
            payment.status = 'failed';
            payment.failureReason = result.error;
            payment.updatedAt = new Date();
            const paymentFailedEvent = {
                paymentId: payment.id,
                orderId: payment.orderId,
                userId: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                reason: result.error || 'Payment processing failed',
                failedAt: payment.updatedAt,
            };
            await rabbitmqService.publishEvent(events_1.EXCHANGES.PAYMENT_EXCHANGE, events_1.ROUTING_KEYS.PAYMENT_FAILED, events_1.PAYMENT_EVENTS.PAYMENT_FAILED, paymentFailedEvent);
            console.log(`Payment ${payment.id} failed: ${result.error}`);
        }
    }
    catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        payment.status = 'failed';
        payment.failureReason = 'Internal processing error';
        payment.updatedAt = new Date();
    }
}
async function handlePaymentRequired(message) {
    try {
        const paymentData = message.data;
        console.log(`Payment required for order ${paymentData.orderId}: $${paymentData.amount}`);
    }
    catch (error) {
        console.error('Error handling payment required event:', error);
    }
}
async function startServer() {
    try {
        await rabbitmqService.connect();
        await rabbitmqService.subscribeToEvents(events_1.EXCHANGES.ORDER_EXCHANGE, events_1.ROUTING_KEYS.ORDER_PAYMENT_REQUIRED, handlePaymentRequired);
        app.listen(PORT, () => {
            console.log(`Payment Service running on port ${PORT}`);
        });
        process.on('SIGINT', async () => {
            console.log('Shutting down Payment Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('Shutting down Payment Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start Payment Service:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=pay.js.map