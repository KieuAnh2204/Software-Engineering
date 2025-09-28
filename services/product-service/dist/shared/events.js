"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUES = exports.ROUTING_KEYS = exports.EXCHANGES = exports.PAYMENT_EVENTS = exports.ORDER_EVENTS = exports.PRODUCT_EVENTS = exports.USER_EVENTS = void 0;
exports.USER_EVENTS = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_AUTHENTICATED: 'user.authenticated',
};
exports.PRODUCT_EVENTS = {
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_DELETED: 'product.deleted',
    INVENTORY_UPDATED: 'product.inventory.updated',
    INVENTORY_LOW: 'product.inventory.low',
};
exports.ORDER_EVENTS = {
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ORDER_CANCELLED: 'order.cancelled',
    ORDER_CONFIRMED: 'order.confirmed',
    ORDER_SHIPPED: 'order.shipped',
    ORDER_DELIVERED: 'order.delivered',
    ORDER_PAYMENT_REQUIRED: 'order.payment.required',
};
exports.PAYMENT_EVENTS = {
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_REFUNDED: 'payment.refunded',
};
exports.EXCHANGES = {
    USER_EXCHANGE: 'user.exchange',
    PRODUCT_EXCHANGE: 'product.exchange',
    ORDER_EXCHANGE: 'order.exchange',
    PAYMENT_EXCHANGE: 'payment.exchange',
};
exports.ROUTING_KEYS = {
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
};
exports.QUEUES = {
    USER_PROCESSING: 'user.processing.queue',
    PRODUCT_PROCESSING: 'product.processing.queue',
    ORDER_PROCESSING: 'order.processing.queue',
    PAYMENT_PROCESSING: 'payment.processing.queue',
    INVENTORY_UPDATES: 'inventory.updates.queue',
    NOTIFICATION_QUEUE: 'notification.queue',
};
//# sourceMappingURL=events.js.map