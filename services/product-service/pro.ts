import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';
import { RabbitMQService } from '../shared/rabbitmq.service';
import { 
  PRODUCT_EVENTS, 
  EXCHANGES, 
  ROUTING_KEYS, 
  ProductCreatedEvent, 
  ProductUpdatedEvent,
  InventoryUpdatedEvent 
} from '../shared/events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ service
const rabbitmqService = new RabbitMQService(RABBITMQ_URL, 'product-service');

// In-memory product storage (replace with database in production)
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inventory: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const products: Product[] = [
  {
    id: uuidv4(),
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
    id: uuidv4(),
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

// Middleware for JWT authentication
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Validate token with User Service
    const response = await axios.post(`${USER_SERVICE_URL}/users/validate-token`, { token });
    req.user = response.data.user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'product-service', status: 'healthy', timestamp: new Date() });
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let filteredProducts = [...products];

    // Filter by category
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === (category as string).toLowerCase()
      );
    }

    // Search by name or description
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
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
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
app.get('/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product (admin endpoint)
app.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, inventory, imageUrl } = req.body;

    // Validate input
    if (!name || !description || !price || !category || inventory === undefined) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Create product
    const newProduct: Product = {
      id: uuidv4(),
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

    // Publish product created event
    const productCreatedEvent: ProductCreatedEvent = {
      productId: newProduct.id,
      name: newProduct.name,
      price: newProduct.price,
      category: newProduct.category,
      inventory: newProduct.inventory,
      createdAt: newProduct.createdAt,
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.PRODUCT_EXCHANGE,
      ROUTING_KEYS.PRODUCT_CREATED,
      PRODUCT_EVENTS.PRODUCT_CREATED,
      productCreatedEvent
    );

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (admin endpoint)
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

    // Update product
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (inventory !== undefined) product.inventory = Number(inventory);
    if (imageUrl) product.imageUrl = imageUrl;
    product.updatedAt = new Date();

    // Publish product updated event
    const productUpdatedEvent: ProductUpdatedEvent = {
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      inventory: product.inventory,
      updatedAt: product.updatedAt,
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.PRODUCT_EXCHANGE,
      ROUTING_KEYS.PRODUCT_UPDATED,
      PRODUCT_EVENTS.PRODUCT_UPDATED,
      productUpdatedEvent
    );

    // If inventory changed, publish inventory updated event
    if (inventory !== undefined && previousInventory !== product.inventory) {
      const inventoryUpdatedEvent: InventoryUpdatedEvent = {
        productId: product.id,
        previousQuantity: previousInventory,
        newQuantity: product.inventory,
        reason: 'Manual update',
        updatedAt: product.updatedAt,
      };

      await rabbitmqService.publishEvent(
        EXCHANGES.PRODUCT_EXCHANGE,
        ROUTING_KEYS.INVENTORY_UPDATED,
        PRODUCT_EVENTS.INVENTORY_UPDATED,
        inventoryUpdatedEvent
      );
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (admin endpoint)
app.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    // Publish product deleted event
    await rabbitmqService.publishEvent(
      EXCHANGES.PRODUCT_EXCHANGE,
      ROUTING_KEYS.PRODUCT_DELETED,
      PRODUCT_EVENTS.PRODUCT_DELETED,
      { productId: deletedProduct.id, deletedAt: new Date() }
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product categories
app.get('/categories', (req, res) => {
  try {
    const categories = [...new Set(products.map(p => p.category))];
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory (used by other services)
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

    // Publish inventory updated event
    const inventoryUpdatedEvent: InventoryUpdatedEvent = {
      productId: product.id,
      previousQuantity,
      newQuantity: product.inventory,
      reason,
      updatedAt: product.updatedAt,
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.PRODUCT_EXCHANGE,
      ROUTING_KEYS.INVENTORY_UPDATED,
      PRODUCT_EVENTS.INVENTORY_UPDATED,
      inventoryUpdatedEvent
    );

    // Check for low inventory
    if (product.inventory < 10) {
      await rabbitmqService.publishEvent(
        EXCHANGES.PRODUCT_EXCHANGE,
        'product.inventory.low',
        PRODUCT_EVENTS.INVENTORY_LOW,
        { productId: product.id, currentInventory: product.inventory }
      );
    }

    res.json({ 
      productId: product.id, 
      previousQuantity, 
      newQuantity: product.inventory,
      success: true 
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check product availability (used by other services)
app.post('/products/check-availability', (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }

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
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  try {
    // Connect to RabbitMQ
    await rabbitmqService.connect();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Product Service running on port ${PORT}`);
    });

    // Graceful shutdown
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
  } catch (error) {
    console.error('Failed to start Product Service:', error);
    process.exit(1);
  }
}

startServer();