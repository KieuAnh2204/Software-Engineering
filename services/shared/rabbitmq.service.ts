import * as amqp from 'amqplib';

export interface MessagePayload {
  eventType: string;
  data: any;
  timestamp: Date;
  serviceId: string;
  correlationId?: string;
}

export class RabbitMQService {
  private connection: any = null;
  private channel: any = null;
  private readonly url: string;
  private readonly serviceName: string;

  constructor(url: string, serviceName: string) {
    this.url = url;
    this.serviceName = serviceName;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }
      
      // Handle connection events
      this.connection.on('error', (err: Error) => {
        console.error(`RabbitMQ connection error for ${this.serviceName}:`, err);
      });
      
      this.connection.on('close', () => {
        console.log(`RabbitMQ connection closed for ${this.serviceName}`);
      });

      console.log(`${this.serviceName} connected to RabbitMQ`);
    } catch (error) {
      console.error(`Failed to connect to RabbitMQ for ${this.serviceName}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log(`${this.serviceName} disconnected from RabbitMQ`);
    } catch (error) {
      console.error(`Error disconnecting from RabbitMQ for ${this.serviceName}:`, error);
    }
  }

  async publishEvent(exchange: string, routingKey: string, eventType: string, data: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });

      const message: MessagePayload = {
        eventType,
        data,
        timestamp: new Date(),
        serviceId: this.serviceName,
        correlationId: this.generateCorrelationId(),
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const published = this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        correlationId: message.correlationId,
      });

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

      console.log(`Event published: ${eventType} to ${exchange}/${routingKey}`);
    } catch (error) {
      console.error(`Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }

  async subscribeToEvents(
    exchange: string,
    routingKey: string,
    handler: (message: MessagePayload) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
      const queueName = `${this.serviceName}_${routingKey}_queue`;
      const queue = await this.channel.assertQueue(queueName, { durable: true });
      
      await this.channel.bindQueue(queue.queue, exchange, routingKey);

      await this.channel.consume(queue.queue, async (msg: any) => {
        if (msg && this.channel) {
          try {
            const messagePayload: MessagePayload = JSON.parse(msg.content.toString());
            await handler(messagePayload);
            this.channel.ack(msg);
            console.log(`Event processed: ${messagePayload.eventType}`);
          } catch (error) {
            console.error('Error processing message:', error);
            this.channel.nack(msg, false, false); // Don't requeue failed messages
          }
        }
      });

      console.log(`Subscribed to events: ${exchange}/${routingKey}`);
    } catch (error) {
      console.error(`Failed to subscribe to events ${exchange}/${routingKey}:`, error);
      throw error;
    }
  }

  async sendDirectMessage(queue: string, eventType: string, data: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });

      const message: MessagePayload = {
        eventType,
        data,
        timestamp: new Date(),
        serviceId: this.serviceName,
        correlationId: this.generateCorrelationId(),
      };

      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const sent = this.channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        correlationId: message.correlationId,
      });

      if (!sent) {
        throw new Error('Failed to send message to queue');
      }

      console.log(`Direct message sent: ${eventType} to queue ${queue}`);
    } catch (error) {
      console.error(`Failed to send direct message ${eventType}:`, error);
      throw error;
    }
  }

  async listenToQueue(
    queue: string,
    handler: (message: MessagePayload) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not available');
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });

      await this.channel.consume(queue, async (msg: any) => {
        if (msg && this.channel) {
          try {
            const messagePayload: MessagePayload = JSON.parse(msg.content.toString());
            await handler(messagePayload);
            this.channel.ack(msg);
            console.log(`Queue message processed: ${messagePayload.eventType}`);
          } catch (error) {
            console.error('Error processing queue message:', error);
            this.channel.nack(msg, false, false);
          }
        }
      });

      console.log(`Listening to queue: ${queue}`);
    } catch (error) {
      console.error(`Failed to listen to queue ${queue}:`, error);
      throw error;
    }
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}