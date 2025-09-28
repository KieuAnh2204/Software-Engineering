import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import axios from 'axios';
import { RabbitMQService } from '../shared/rabbitmq.service';
import { AuthenticatedRequest } from '../shared/types';
import { 
  PAYMENT_EVENTS, 
  ORDER_EVENTS,
  EXCHANGES, 
  ROUTING_KEYS, 
  QUEUES,
  PaymentCompletedEvent, 
  PaymentFailedEvent,
  PaymentRequiredEvent,
  MessagePayload
} from '../shared/events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ service
const rabbitmqService = new RabbitMQService(RABBITMQ_URL, 'payment-service');

// In-memory payment storage (replace with database in production)
interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  failureReason?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const payments: Payment[] = [];

// Mock payment providers
const mockPaymentProviders = {
  'credit_card': {
    name: 'Credit Card Processor',
    process: async (payment: Payment) => {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 90% success rate for simulation
      const success = Math.random() > 0.1;
      
      if (success) {
        return {
          success: true,
          transactionId: `cc_${uuidv4()}`,
        };
      } else {
        return {
          success: false,
          error: 'Payment declined by bank',
        };
      }
    },
  },
  'paypal': {
    name: 'PayPal',
    process: async (payment: Payment) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 95% success rate for PayPal
      const success = Math.random() > 0.05;
      
      if (success) {
        return {
          success: true,
          transactionId: `pp_${uuidv4()}`,
        };
      } else {
        return {
          success: false,
          error: 'Insufficient funds in PayPal account',
        };
      }
    },
  },
  'bank_transfer': {
    name: 'Bank Transfer',
    process: async (payment: Payment) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 85% success rate for bank transfer
      const success = Math.random() > 0.15;
      
      if (success) {
        return {
          success: true,
          transactionId: `bt_${uuidv4()}`,
        };
      } else {
        return {
          success: false,
          error: 'Bank transfer failed - insufficient funds',
        };
      }
    },
  },
};

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
  res.json({ service: 'payment-service', status: 'healthy', timestamp: new Date() });
});

// Initiate payment
app.post('/payments', authenticateToken, async (req, res) => {
  try {
    const { orderId, amount, currency = 'USD', paymentMethod, metadata } = req.body;
    const userId = req.user!.userId;

    // Validate input
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Order ID, amount, and payment method are required' });
    }

    if (!mockPaymentProviders[paymentMethod as keyof typeof mockPaymentProviders]) {
      return res.status(400).json({ 
        error: 'Invalid payment method',
        supportedMethods: Object.keys(mockPaymentProviders)
      });
    }

    // Check if payment already exists for this order
    const existingPayment = payments.find(p => p.orderId === orderId && p.status !== 'failed');
    if (existingPayment) {
      return res.status(409).json({ error: 'Payment already exists for this order' });
    }

    // Create payment record
    const newPayment: Payment = {
      id: uuidv4(),
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

    // Publish payment initiated event
    await rabbitmqService.publishEvent(
      EXCHANGES.PAYMENT_EXCHANGE,
      'payment.initiated',
      PAYMENT_EVENTS.PAYMENT_INITIATED,
      {
        paymentId: newPayment.id,
        orderId: newPayment.orderId,
        userId: newPayment.userId,
        amount: newPayment.amount,
        currency: newPayment.currency,
        paymentMethod: newPayment.paymentMethod,
        initiatedAt: newPayment.createdAt,
      }
    );

    // Process payment asynchronously
    processPaymentAsync(newPayment);

    res.status(201).json({
      paymentId: newPayment.id,
      status: newPayment.status,
      amount: newPayment.amount,
      currency: newPayment.currency,
      paymentMethod: newPayment.paymentMethod,
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status
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
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payments for user
app.get('/payments', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10 } = req.query;
    
    let userPayments = payments.filter(p => p.userId === userId);
    
    // Filter by status
    if (status) {
      userPayments = userPayments.filter(p => p.status === status);
    }
    
    // Pagination
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
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refund payment
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
    
    // Publish payment refunded event
    await rabbitmqService.publishEvent(
      EXCHANGES.PAYMENT_EXCHANGE,
      ROUTING_KEYS.PAYMENT_REFUNDED,
      PAYMENT_EVENTS.PAYMENT_REFUNDED,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        reason,
        refundedAt: payment.updatedAt,
      }
    );
    
    res.json({
      paymentId: payment.id,
      status: payment.status,
      refundedAt: payment.updatedAt,
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supported payment methods
app.get('/payment-methods', (req, res) => {
  try {
    const methods = Object.keys(mockPaymentProviders).map(key => ({
      id: key,
      name: mockPaymentProviders[key as keyof typeof mockPaymentProviders].name,
    }));
    
    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint - get all payments
app.get('/admin/payments', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let filteredPayments = [...payments];
    
    // Filter by status
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }
    
    // Pagination
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
  } catch (error) {
    console.error('Get admin payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Async payment processing
async function processPaymentAsync(payment: Payment) {
  try {
    payment.status = 'processing';
    payment.updatedAt = new Date();
    
    const provider = mockPaymentProviders[payment.paymentMethod as keyof typeof mockPaymentProviders];
    const result = await provider.process(payment);
    
    if (result.success) {
      payment.status = 'completed';
      payment.transactionId = result.transactionId;
      payment.completedAt = new Date();
      payment.updatedAt = new Date();
      
      // Publish payment completed event
      const paymentCompletedEvent: PaymentCompletedEvent = {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        completedAt: payment.completedAt,
      };
      
      await rabbitmqService.publishEvent(
        EXCHANGES.PAYMENT_EXCHANGE,
        ROUTING_KEYS.PAYMENT_COMPLETED,
        PAYMENT_EVENTS.PAYMENT_COMPLETED,
        paymentCompletedEvent
      );
      
      console.log(`Payment ${payment.id} completed successfully`);
    } else {
      payment.status = 'failed';
      payment.failureReason = result.error;
      payment.updatedAt = new Date();
      
      // Publish payment failed event
      const paymentFailedEvent: PaymentFailedEvent = {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        reason: result.error || 'Payment processing failed',
        failedAt: payment.updatedAt,
      };
      
      await rabbitmqService.publishEvent(
        EXCHANGES.PAYMENT_EXCHANGE,
        ROUTING_KEYS.PAYMENT_FAILED,
        PAYMENT_EVENTS.PAYMENT_FAILED,
        paymentFailedEvent
      );
      
      console.log(`Payment ${payment.id} failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`Error processing payment ${payment.id}:`, error);
    payment.status = 'failed';
    payment.failureReason = 'Internal processing error';
    payment.updatedAt = new Date();
  }
}

// Event handlers
async function handlePaymentRequired(message: MessagePayload) {
  try {
    const paymentData = message.data as PaymentRequiredEvent;
    console.log(`Payment required for order ${paymentData.orderId}: $${paymentData.amount}`);
    
    // Here you could implement automatic payment processing
    // or send notifications to the user about pending payment
  } catch (error) {
    console.error('Error handling payment required event:', error);
  }
}

// Start server
async function startServer() {
  try {
    // Connect to RabbitMQ
    await rabbitmqService.connect();

    // Subscribe to order events
    await rabbitmqService.subscribeToEvents(
      EXCHANGES.ORDER_EXCHANGE,
      ROUTING_KEYS.ORDER_PAYMENT_REQUIRED,
      handlePaymentRequired
    );

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`Payment Service running on port ${PORT}`);
    });

    // Graceful shutdown
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
  } catch (error) {
    console.error('Failed to start Payment Service:', error);
    process.exit(1);
  }
}

startServer();