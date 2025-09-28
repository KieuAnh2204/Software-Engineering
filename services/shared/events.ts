import * as amqp from 'amqplib';

export interface MessagePayload {
  eventType: string;
  data: any;
  timestamp: Date;
  serviceId: string;
  correlationId?: string;
}

// Event types for inter-service communication

// User Service Events
export const USER_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_AUTHENTICATED: 'user.authenticated',
} as const;

// Product Service Events
export const PRODUCT_EVENTS = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  INVENTORY_UPDATED: 'product.inventory.updated',
  INVENTORY_LOW: 'product.inventory.low',
} as const;

// Order Service Events
export const ORDER_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_PAYMENT_REQUIRED: 'order.payment.required',
} as const;

// Payment Service Events
export const PAYMENT_EVENTS = {
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
} as const;

// Exchange names
export const EXCHANGES = {
  USER_EXCHANGE: 'user.exchange',
  PRODUCT_EXCHANGE: 'product.exchange',
  ORDER_EXCHANGE: 'order.exchange',
  PAYMENT_EXCHANGE: 'payment.exchange',
} as const;

// Routing keys
export const ROUTING_KEYS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  INVENTORY_UPDATED: 'product.inventory.updated',
  
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_PAYMENT_REQUIRED: 'order.payment.required',
  
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
} as const;

// Queue names
export const QUEUES = {
  USER_PROCESSING: 'user.processing.queue',
  PRODUCT_PROCESSING: 'product.processing.queue',
  ORDER_PROCESSING: 'order.processing.queue',
  PAYMENT_PROCESSING: 'payment.processing.queue',
  INVENTORY_UPDATES: 'inventory.updates.queue',
  NOTIFICATION_QUEUE: 'notification.queue',
} as const;

// Event data interfaces
export interface UserCreatedEvent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface UserUpdatedEvent {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  updatedAt: Date;
}

export interface ProductCreatedEvent {
  productId: string;
  name: string;
  price: number;
  category: string;
  inventory: number;
  createdAt: Date;
}

export interface ProductUpdatedEvent {
  productId: string;
  name?: string;
  price?: number;
  category?: string;
  inventory?: number;
  updatedAt: Date;
}

export interface InventoryUpdatedEvent {
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  updatedAt: Date;
}

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: Date;
}

export interface OrderUpdatedEvent {
  orderId: string;
  status: string;
  updatedAt: Date;
}

export interface PaymentRequiredEvent {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  dueDate: Date;
}

export interface PaymentCompletedEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  completedAt: Date;
}

export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  reason: string;
  failedAt: Date;
}