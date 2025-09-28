export interface MessagePayload {
    eventType: string;
    data: any;
    timestamp: Date;
    serviceId: string;
    correlationId?: string;
}
export declare class RabbitMQService {
    private connection;
    private channel;
    private readonly url;
    private readonly serviceName;
    constructor(url: string, serviceName: string);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publishEvent(exchange: string, routingKey: string, eventType: string, data: any): Promise<void>;
    subscribeToEvents(exchange: string, routingKey: string, handler: (message: MessagePayload) => Promise<void>): Promise<void>;
    sendDirectMessage(queue: string, eventType: string, data: any): Promise<void>;
    listenToQueue(queue: string, handler: (message: MessagePayload) => Promise<void>): Promise<void>;
    private generateCorrelationId;
}
