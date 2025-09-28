export interface MessagePayload {
    eventType: string;
    data: any;
    timestamp: Date;
    serviceId: string;
    correlationId?: string;
}
export declare const USER_EVENTS: {
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
    readonly USER_AUTHENTICATED: "user.authenticated";
};
export declare const PRODUCT_EVENTS: {
    readonly PRODUCT_CREATED: "product.created";
    readonly PRODUCT_UPDATED: "product.updated";
    readonly PRODUCT_DELETED: "product.deleted";
    readonly INVENTORY_UPDATED: "product.inventory.updated";
    readonly INVENTORY_LOW: "product.inventory.low";
};
export declare const ORDER_EVENTS: {
    readonly ORDER_CREATED: "order.created";
    readonly ORDER_UPDATED: "order.updated";
    readonly ORDER_CANCELLED: "order.cancelled";
    readonly ORDER_CONFIRMED: "order.confirmed";
    readonly ORDER_SHIPPED: "order.shipped";
    readonly ORDER_DELIVERED: "order.delivered";
    readonly ORDER_PAYMENT_REQUIRED: "order.payment.required";
};
export declare const PAYMENT_EVENTS: {
    readonly PAYMENT_INITIATED: "payment.initiated";
    readonly PAYMENT_COMPLETED: "payment.completed";
    readonly PAYMENT_FAILED: "payment.failed";
    readonly PAYMENT_REFUNDED: "payment.refunded";
};
export declare const EXCHANGES: {
    readonly USER_EXCHANGE: "user.exchange";
    readonly PRODUCT_EXCHANGE: "product.exchange";
    readonly ORDER_EXCHANGE: "order.exchange";
    readonly PAYMENT_EXCHANGE: "payment.exchange";
};
export declare const ROUTING_KEYS: {
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
    readonly PRODUCT_CREATED: "product.created";
    readonly PRODUCT_UPDATED: "product.updated";
    readonly PRODUCT_DELETED: "product.deleted";
    readonly INVENTORY_UPDATED: "product.inventory.updated";
    readonly ORDER_CREATED: "order.created";
    readonly ORDER_UPDATED: "order.updated";
    readonly ORDER_CANCELLED: "order.cancelled";
    readonly ORDER_PAYMENT_REQUIRED: "order.payment.required";
    readonly PAYMENT_COMPLETED: "payment.completed";
    readonly PAYMENT_FAILED: "payment.failed";
    readonly PAYMENT_REFUNDED: "payment.refunded";
};
export declare const QUEUES: {
    readonly USER_PROCESSING: "user.processing.queue";
    readonly PRODUCT_PROCESSING: "product.processing.queue";
    readonly ORDER_PROCESSING: "order.processing.queue";
    readonly PAYMENT_PROCESSING: "payment.processing.queue";
    readonly INVENTORY_UPDATES: "inventory.updates.queue";
    readonly NOTIFICATION_QUEUE: "notification.queue";
};
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
