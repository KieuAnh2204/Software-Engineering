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
const PORT = process.env.PORT || 3003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const rabbitmqService = new rabbitmq_service_1.RabbitMQService(RABBITMQ_URL, 'order-service');
const orders = [];
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
    res.json({ service: 'order-service', status: 'healthy', timestamp: new Date() });
});
app.post('/orders', authenticateToken, async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;
        const userId = req.user.userId;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ error: 'Shipping address is required' });
        }
        const availabilityResponse = await axios_1.default.post(`${PRODUCT_SERVICE_URL}/products/check-availability`, { items });
        if (!availabilityResponse.data.allAvailable) {
            return res.status(400).json({
                error: 'Some items are not available',
                unavailableItems: availabilityResponse.data.items.filter((item) => !item.inStock)
            });
        }
        const orderItems = availabilityResponse.data.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.requested,
            price: item.product.price,
            subtotal: item.requested * item.product.price,
        }));
        const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
        const newOrder = {
            id: (0, uuid_1.v4)(),
            userId,
            items: orderItems,
            totalAmount,
            status: 'pending',
            paymentStatus: 'pending',
            shippingAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        orders.push(newOrder);
        for (const item of items) {
            const product = availabilityResponse.data.items.find((p) => p.productId === item.productId);
            const newQuantity = product.available - item.quantity;
            await axios_1.default.post(`${PRODUCT_SERVICE_URL}/products/${item.productId}/inventory`, { quantity: newQuantity, reason: `Order ${newOrder.id} - Item reserved` });
        }
        const orderCreatedEvent = {
            orderId: newOrder.id,
            userId: newOrder.userId,
            items: newOrder.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
            totalAmount: newOrder.totalAmount,
            status: newOrder.status,
            createdAt: newOrder.createdAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.ORDER_EXCHANGE, events_1.ROUTING_KEYS.ORDER_CREATED, events_1.ORDER_EVENTS.ORDER_CREATED, orderCreatedEvent);
        const paymentRequiredEvent = {
            orderId: newOrder.id,
            userId: newOrder.userId,
            amount: newOrder.totalAmount,
            currency: 'USD',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.ORDER_EXCHANGE, events_1.ROUTING_KEYS.ORDER_PAYMENT_REQUIRED, events_1.ORDER_EVENTS.ORDER_PAYMENT_REQUIRED, paymentRequiredEvent);
        res.status(201).json(newOrder);
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/orders', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const userOrders = orders.filter(order => order.userId === userId);
        res.json(userOrders);
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/orders/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const order = orders.find(o => o.id === id && o.userId === userId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    }
    catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;
        const order = orders.find(o => o.id === id && o.userId === userId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        order.status = status;
        order.updatedAt = new Date();
        const orderUpdatedEvent = {
            orderId: order.id,
            status: order.status,
            updatedAt: order.updatedAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.ORDER_EXCHANGE, events_1.ROUTING_KEYS.ORDER_UPDATED, events_1.ORDER_EVENTS.ORDER_UPDATED, orderUpdatedEvent);
        res.json(order);
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const order = orders.find(o => o.id === id && o.userId === userId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending orders can be cancelled' });
        }
        order.status = 'cancelled';
        order.updatedAt = new Date();
        for (const item of order.items) {
            try {
                const productResponse = await axios_1.default.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
                const currentInventory = productResponse.data.inventory;
                const newQuantity = currentInventory + item.quantity;
                await axios_1.default.post(`${PRODUCT_SERVICE_URL}/products/${item.productId}/inventory`, { quantity: newQuantity, reason: `Order ${order.id} - Cancelled, inventory restored` });
            }
            catch (inventoryError) {
                console.error(`Failed to restore inventory for product ${item.productId}:`, inventoryError);
            }
        }
        await rabbitmqService.publishEvent(events_1.EXCHANGES.ORDER_EXCHANGE, 'order.cancelled', events_1.ORDER_EVENTS.ORDER_CANCELLED, { orderId: order.id, userId: order.userId, cancelledAt: order.updatedAt });
        res.json(order);
    }
    catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/admin/orders', authenticateToken, (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        let filteredOrders = [...orders];
        if (status) {
            filteredOrders = filteredOrders.filter(o => o.status === status);
        }
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
        res.json({
            orders: paginatedOrders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: filteredOrders.length,
                pages: Math.ceil(filteredOrders.length / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
async function handlePaymentCompleted(message) {
    try {
        const paymentData = message.data;
        const order = orders.find(o => o.id === paymentData.orderId);
        if (order) {
            order.paymentStatus = 'completed';
            order.status = 'confirmed';
            order.updatedAt = new Date();
            console.log(`Payment completed for order ${order.id}`);
            const orderUpdatedEvent = {
                orderId: order.id,
                status: order.status,
                updatedAt: order.updatedAt,
            };
            await rabbitmqService.publishEvent(events_1.EXCHANGES.ORDER_EXCHANGE, events_1.ROUTING_KEYS.ORDER_UPDATED, events_1.ORDER_EVENTS.ORDER_UPDATED, orderUpdatedEvent);
        }
    }
    catch (error) {
        console.error('Error handling payment completed event:', error);
    }
}
async function handlePaymentFailed(message) {
    try {
        const paymentData = message.data;
        const order = orders.find(o => o.id === paymentData.orderId);
        if (order) {
            order.paymentStatus = 'failed';
            order.updatedAt = new Date();
            console.log(`Payment failed for order ${order.id}: ${paymentData.reason}`);
            for (const item of order.items) {
                try {
                    const productResponse = await axios_1.default.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
                    const currentInventory = productResponse.data.inventory;
                    const newQuantity = currentInventory + item.quantity;
                    await axios_1.default.post(`${PRODUCT_SERVICE_URL}/products/${item.productId}/inventory`, { quantity: newQuantity, reason: `Order ${order.id} - Payment failed, inventory restored` });
                }
                catch (inventoryError) {
                    console.error(`Failed to restore inventory for product ${item.productId}:`, inventoryError);
                }
            }
        }
    }
    catch (error) {
        console.error('Error handling payment failed event:', error);
    }
}
async function startServer() {
    try {
        await rabbitmqService.connect();
        await rabbitmqService.subscribeToEvents(events_1.EXCHANGES.PAYMENT_EXCHANGE, events_1.ROUTING_KEYS.PAYMENT_COMPLETED, handlePaymentCompleted);
        await rabbitmqService.subscribeToEvents(events_1.EXCHANGES.PAYMENT_EXCHANGE, events_1.ROUTING_KEYS.PAYMENT_FAILED, handlePaymentFailed);
        app.listen(PORT, () => {
            console.log(`Order Service running on port ${PORT}`);
        });
        process.on('SIGINT', async () => {
            console.log('Shutting down Order Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('Shutting down Order Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start Order Service:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=testing.js.map