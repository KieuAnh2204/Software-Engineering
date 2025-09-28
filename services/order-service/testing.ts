import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';
import { RabbitMQService } from '../shared/rabbitmq.service';
import { 
  ORDER_EVENTS, 
  PAYMENT_EVENTS,
  EXCHANGES, 
  ROUTING_KEYS, 
  QUEUES,
  OrderCreatedEvent, 
  OrderUpdatedEvent,
  PaymentRequiredEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  MessagePayload
} from '../shared/events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ service
const rabbitmqService = new RabbitMQService(RABBITMQ_URL, 'order-service');

// In-memory order storage (replace with database in production)
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const orders: Order[] = [];

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
  res.json({ service: 'order-service', status: 'healthy', timestamp: new Date() });
});

// Create new order
app.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    // Check product availability
    const availabilityResponse = await axios.post(
      `${PRODUCT_SERVICE_URL}/products/check-availability`,
      { items }
    );

    if (!availabilityResponse.data.allAvailable) {
      return res.status(400).json({ 
        error: 'Some items are not available',
        unavailableItems: availabilityResponse.data.items.filter((item: any) => !item.inStock)
      });
    }

    // Calculate order details
    const orderItems: OrderItem[] = availabilityResponse.data.items.map((item: any) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.requested,
      price: item.product.price,
      subtotal: item.requested * item.product.price,
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Create order
    const newOrder: Order = {
      id: uuidv4(),
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

    // Update inventory for reserved items
    for (const item of items) {
      const product = availabilityResponse.data.items.find((p: any) => p.productId === item.productId);
      const newQuantity = product.available - item.quantity;
      
      await axios.post(
        `${PRODUCT_SERVICE_URL}/products/${item.productId}/inventory`,
        { quantity: newQuantity, reason: `Order ${newOrder.id} - Item reserved` }
      );
    }

    // Publish order created event
    const orderCreatedEvent: OrderCreatedEvent = {
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

    await rabbitmqService.publishEvent(
      EXCHANGES.ORDER_EXCHANGE,
      ROUTING_KEYS.ORDER_CREATED,
      ORDER_EVENTS.ORDER_CREATED,
      orderCreatedEvent
    );

    // Send payment required event
    const paymentRequiredEvent: PaymentRequiredEvent = {
      orderId: newOrder.id,
      userId: newOrder.userId,
      amount: newOrder.totalAmount,
      currency: 'USD',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.ORDER_EXCHANGE,
      ROUTING_KEYS.ORDER_PAYMENT_REQUIRED,
      ORDER_EVENTS.ORDER_PAYMENT_REQUIRED,
      paymentRequiredEvent
    );

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's orders
app.get('/orders', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const userOrders = orders.filter(order => order.userId === userId);
    
    res.json(userOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
app.get('/orders/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const order = orders.find(o => o.id === id && o.userId === userId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
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

    // Publish order updated event
    const orderUpdatedEvent: OrderUpdatedEvent = {
      orderId: order.id,
      status: order.status,
      updatedAt: order.updatedAt,
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.ORDER_EXCHANGE,
      ROUTING_KEYS.ORDER_UPDATED,
      ORDER_EVENTS.ORDER_UPDATED,
      orderUpdatedEvent
    );

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel order
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

    // Restore inventory
    for (const item of order.items) {
      try {
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
        const currentInventory = productResponse.data.inventory;
        const newQuantity = currentInventory + item.quantity;
        
        await axios.post(
          `${PRODUCT_SERVICE_URL}/products/${item.productId}/inventory`,
          { quantity: newQuantity, reason: `Order ${order.id} - Cancelled, inventory restored` }
        );
      } catch (inventoryError) {
        console.error(`Failed to restore inventory for product ${item.productId}:`, inventoryError);
      }
    }

    // Publish order cancelled event
    await rabbitmqService.publishEvent(
      EXCHANGES.ORDER_EXCHANGE,
      'order.cancelled',
      ORDER_EVENTS.ORDER_CANCELLED,
      { orderId: order.id, userId: order.userId, cancelledAt: order.updatedAt }
    );

    res.json(order);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders (admin endpoint)
app.get('/admin/orders', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let filteredOrders = [...orders];

    // Filter by status
    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status);
    }

    // Pagination
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
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event handlers
async function handlePaymentCompleted(message: MessagePayload) {
  try {
    const paymentData = message.data as PaymentCompletedEvent;
    const order = orders.find(o => o.id === paymentData.orderId);
    
    if (order) {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      order.updatedAt = new Date();

      console.log(`Payment completed for order ${order.id}`);

      // Publish order updated event
      const orderUpdatedEvent: OrderUpdatedEvent = {
        orderId: order.id,
        status: order.status,
        updatedAt: order.updatedAt,
      };

      await rabbitmqService.publishEvent(
        EXCHANGES.ORDER_EXCHANGE,
        ROUTING_KEYS.ORDER_UPDATED,
        ORDER_EVENTS.ORDER_UPDATED,
        orderUpdatedEvent
      );
    }
  } catch (error) {
    console.error('Error handling payment completed event:', error);
  }
}

async function handlePaymentFailed(message: MessagePayload) {
  try {
    const paymentData = message.data as PaymentFailedEvent;
    const order = orders.find(o => o.id === paymentData.orderId);
    
    if (order) {
      order.paymentStatus = 'failed';
      order.updatedAt = new Date();

      console.log(`Payment failed for order ${order.id}: ${paymentData.reason}`);

      // Restore inventory since payment failed
      for (const item of order.items) {
        try {
          const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${item.productId}`);
          const currentInventory = productResponse.data.inventory;
          const newQuantity = currentInventory + item.quantity;
          
          await axios.post(
            `${PRODUCT_SERVICE_URL}/products/${item.productId}/inventory`,
            { quantity: newQuantity, reason: `Order ${order.id} - Payment failed, inventory restored` }
          );
        } catch (inventoryError) {
          console.error(`Failed to restore inventory for product ${item.productId}:`, inventoryError);
        }
      }
    }
  } catch (error) {
    console.error('Error handling payment failed event:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Connect to RabbitMQ
    await rabbitmqService.connect();

    // Subscribe to payment events
    await rabbitmqService.subscribeToEvents(
      EXCHANGES.PAYMENT_EXCHANGE,
      ROUTING_KEYS.PAYMENT_COMPLETED,
      handlePaymentCompleted
    );

    await rabbitmqService.subscribeToEvents(
      EXCHANGES.PAYMENT_EXCHANGE,
      ROUTING_KEYS.PAYMENT_FAILED,
      handlePaymentFailed
    );

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });

    // Graceful shutdown
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
  } catch (error) {
    console.error('Failed to start Order Service:', error);
    process.exit(1);
  }
}

startServer();