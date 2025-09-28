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
const PORT = process.env.PORT || 3002;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const rabbitmqService = new rabbitmq_service_1.RabbitMQService(RABBITMQ_URL, 'product-service');
const products = [
    {
        id: (0, uuid_1.v4)(),
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 199.99,
        category: 'Electronics',
        inventory: 50,
        imageUrl: 'https://example.com/headphones.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: (0, uuid_1.v4)(),
        name: 'Smartphone',
        description: 'Latest smartphone with advanced camera features',
        price: 699.99,
        category: 'Electronics',
        inventory: 25,
        imageUrl: 'https://example.com/smartphone.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
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
    res.json({ service: 'product-service', status: 'healthy', timestamp: new Date() });
});
app.get('/products', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        let filteredProducts = [...products];
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm));
        }
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        res.json({
            products: paginatedProducts,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: filteredProducts.length,
                pages: Math.ceil(filteredProducts.length / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        const product = products.find(p => p.id === id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/products', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category, inventory, imageUrl } = req.body;
        if (!name || !description || !price || !category || inventory === undefined) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }
        const newProduct = {
            id: (0, uuid_1.v4)(),
            name,
            description,
            price: Number(price),
            category,
            inventory: Number(inventory),
            imageUrl,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        products.push(newProduct);
        const productCreatedEvent = {
            productId: newProduct.id,
            name: newProduct.name,
            price: newProduct.price,
            category: newProduct.category,
            inventory: newProduct.inventory,
            createdAt: newProduct.createdAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.PRODUCT_EXCHANGE, events_1.ROUTING_KEYS.PRODUCT_CREATED, events_1.PRODUCT_EVENTS.PRODUCT_CREATED, productCreatedEvent);
        res.status(201).json(newProduct);
    }
    catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, inventory, imageUrl } = req.body;
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const product = products[productIndex];
        const previousInventory = product.inventory;
        if (name)
            product.name = name;
        if (description)
            product.description = description;
        if (price)
            product.price = Number(price);
        if (category)
            product.category = category;
        if (inventory !== undefined)
            product.inventory = Number(inventory);
        if (imageUrl)
            product.imageUrl = imageUrl;
        product.updatedAt = new Date();
        const productUpdatedEvent = {
            productId: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            inventory: product.inventory,
            updatedAt: product.updatedAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.PRODUCT_EXCHANGE, events_1.ROUTING_KEYS.PRODUCT_UPDATED, events_1.PRODUCT_EVENTS.PRODUCT_UPDATED, productUpdatedEvent);
        if (inventory !== undefined && previousInventory !== product.inventory) {
            const inventoryUpdatedEvent = {
                productId: product.id,
                previousQuantity: previousInventory,
                newQuantity: product.inventory,
                reason: 'Manual update',
                updatedAt: product.updatedAt,
            };
            await rabbitmqService.publishEvent(events_1.EXCHANGES.PRODUCT_EXCHANGE, events_1.ROUTING_KEYS.INVENTORY_UPDATED, events_1.PRODUCT_EVENTS.INVENTORY_UPDATED, inventoryUpdatedEvent);
        }
        res.json(product);
    }
    catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const deletedProduct = products.splice(productIndex, 1)[0];
        await rabbitmqService.publishEvent(events_1.EXCHANGES.PRODUCT_EXCHANGE, events_1.ROUTING_KEYS.PRODUCT_DELETED, events_1.PRODUCT_EVENTS.PRODUCT_DELETED, { productId: deletedProduct.id, deletedAt: new Date() });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/categories', (req, res) => {
    try {
        const categories = [...new Set(products.map(p => p.category))];
        res.json(categories);
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/products/:id/inventory', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, reason = 'Order processing' } = req.body;
        const product = products.find(p => p.id === id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (quantity === undefined) {
            return res.status(400).json({ error: 'Quantity is required' });
        }
        const previousQuantity = product.inventory;
        product.inventory = Number(quantity);
        product.updatedAt = new Date();
        const inventoryUpdatedEvent = {
            productId: product.id,
            previousQuantity,
            newQuantity: product.inventory,
            reason,
            updatedAt: product.updatedAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.PRODUCT_EXCHANGE, events_1.ROUTING_KEYS.INVENTORY_UPDATED, events_1.PRODUCT_EVENTS.INVENTORY_UPDATED, inventoryUpdatedEvent);
        if (product.inventory < 10) {
            await rabbitmqService.publishEvent(events_1.EXCHANGES.PRODUCT_EXCHANGE, 'product.inventory.low', events_1.PRODUCT_EVENTS.INVENTORY_LOW, { productId: product.id, currentInventory: product.inventory });
        }
        res.json({
            productId: product.id,
            previousQuantity,
            newQuantity: product.inventory,
            success: true
        });
    }
    catch (error) {
        console.error('Update inventory error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/products/check-availability', (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Items array is required' });
        }
        const availability = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                productId: item.productId,
                requested: item.quantity,
                available: product ? product.inventory : 0,
                inStock: product ? product.inventory >= item.quantity : false,
                product: product ? {
                    name: product.name,
                    price: product.price,
                } : null,
            };
        });
        const allAvailable = availability.every(item => item.inStock);
        res.json({
            allAvailable,
            items: availability,
        });
    }
    catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
async function startServer() {
    try {
        await rabbitmqService.connect();
        app.listen(PORT, () => {
            console.log(`Product Service running on port ${PORT}`);
        });
        process.on('SIGINT', async () => {
            console.log('Shutting down Product Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('Shutting down Product Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start Product Service:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=pro.js.map