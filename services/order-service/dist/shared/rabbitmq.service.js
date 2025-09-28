"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQService = void 0;
const amqp = __importStar(require("amqplib"));
class RabbitMQService {
    connection = null;
    channel = null;
    url;
    serviceName;
    constructor(url, serviceName) {
        this.url = url;
        this.serviceName = serviceName;
    }
    async connect() {
        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
            this.connection.on('error', (err) => {
                console.error(`RabbitMQ connection error for ${this.serviceName}:`, err);
            });
            this.connection.on('close', () => {
                console.log(`RabbitMQ connection closed for ${this.serviceName}`);
            });
            console.log(`${this.serviceName} connected to RabbitMQ`);
        }
        catch (error) {
            console.error(`Failed to connect to RabbitMQ for ${this.serviceName}:`, error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log(`${this.serviceName} disconnected from RabbitMQ`);
        }
        catch (error) {
            console.error(`Error disconnecting from RabbitMQ for ${this.serviceName}:`, error);
        }
    }
    async publishEvent(exchange, routingKey, eventType, data) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not available');
        }
        try {
            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            const message = {
                eventType,
                data,
                timestamp: new Date(),
                serviceId: this.serviceName,
                correlationId: this.generateCorrelationId(),
            };
            const messageBuffer = Buffer.from(JSON.stringify(message));
            this.channel.publish(exchange, routingKey, messageBuffer, {
                persistent: true,
                correlationId: message.correlationId,
            });
            console.log(`Event published: ${eventType} to ${exchange}/${routingKey}`);
        }
        catch (error) {
            console.error(`Failed to publish event ${eventType}:`, error);
            throw error;
        }
    }
    async subscribeToEvents(exchange, routingKey, handler) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not available');
        }
        try {
            await this.channel.assertExchange(exchange, 'topic', { durable: true });
            const queueName = `${this.serviceName}_${routingKey}_queue`;
            const queue = await this.channel.assertQueue(queueName, { durable: true });
            await this.channel.bindQueue(queue.queue, exchange, routingKey);
            this.channel.consume(queue.queue, async (msg) => {
                if (msg) {
                    try {
                        const messagePayload = JSON.parse(msg.content.toString());
                        await handler(messagePayload);
                        this.channel.ack(msg);
                        console.log(`Event processed: ${messagePayload.eventType}`);
                    }
                    catch (error) {
                        console.error('Error processing message:', error);
                        this.channel.nack(msg, false, false);
                    }
                }
            });
            console.log(`Subscribed to events: ${exchange}/${routingKey}`);
        }
        catch (error) {
            console.error(`Failed to subscribe to events ${exchange}/${routingKey}:`, error);
            throw error;
        }
    }
    async sendDirectMessage(queue, eventType, data) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not available');
        }
        try {
            await this.channel.assertQueue(queue, { durable: true });
            const message = {
                eventType,
                data,
                timestamp: new Date(),
                serviceId: this.serviceName,
                correlationId: this.generateCorrelationId(),
            };
            const messageBuffer = Buffer.from(JSON.stringify(message));
            this.channel.sendToQueue(queue, messageBuffer, {
                persistent: true,
                correlationId: message.correlationId,
            });
            console.log(`Direct message sent: ${eventType} to queue ${queue}`);
        }
        catch (error) {
            console.error(`Failed to send direct message ${eventType}:`, error);
            throw error;
        }
    }
    async listenToQueue(queue, handler) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not available');
        }
        try {
            await this.channel.assertQueue(queue, { durable: true });
            this.channel.consume(queue, async (msg) => {
                if (msg) {
                    try {
                        const messagePayload = JSON.parse(msg.content.toString());
                        await handler(messagePayload);
                        this.channel.ack(msg);
                        console.log(`Queue message processed: ${messagePayload.eventType}`);
                    }
                    catch (error) {
                        console.error('Error processing queue message:', error);
                        this.channel.nack(msg, false, false);
                    }
                }
            });
            console.log(`Listening to queue: ${queue}`);
        }
        catch (error) {
            console.error(`Failed to listen to queue ${queue}:`, error);
            throw error;
        }
    }
    generateCorrelationId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
exports.RabbitMQService = RabbitMQService;
//# sourceMappingURL=rabbitmq.service.js.map