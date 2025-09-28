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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const rabbitmq_service_1 = require("../shared/rabbitmq.service");
const events_1 = require("../shared/events");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const rabbitmqService = new rabbitmq_service_1.RabbitMQService(RABBITMQ_URL, 'user-service');
const users = [];
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};
app.get('/health', (req, res) => {
    res.json({ service: 'user-service', status: 'healthy', timestamp: new Date() });
});
app.post('/users/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: (0, uuid_1.v4)(),
            email,
            password: hashedPassword,
            firstName,
            lastName,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        users.push(newUser);
        const userCreatedEvent = {
            userId: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            createdAt: newUser.createdAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.USER_EXCHANGE, events_1.ROUTING_KEYS.USER_CREATED, events_1.USER_EVENTS.USER_CREATED, userCreatedEvent);
        const { password: _, ...userResponse } = newUser;
        res.status(201).json(userResponse);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || '24h' });
        await rabbitmqService.publishEvent(events_1.EXCHANGES.USER_EXCHANGE, 'user.authenticated', events_1.USER_EVENTS.USER_AUTHENTICATED, { userId: user.id, email: user.email, authenticatedAt: new Date() });
        res.json({ token, userId: user.id, email: user.email });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/users/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const user = users.find(u => u.id === id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { password: _, ...userResponse } = user;
        res.json(userResponse);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/users/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email } = req.body;
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[userIndex];
        if (firstName)
            user.firstName = firstName;
        if (lastName)
            user.lastName = lastName;
        if (email)
            user.email = email;
        user.updatedAt = new Date();
        const userUpdatedEvent = {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            updatedAt: user.updatedAt,
        };
        await rabbitmqService.publishEvent(events_1.EXCHANGES.USER_EXCHANGE, events_1.ROUTING_KEYS.USER_UPDATED, events_1.USER_EVENTS.USER_UPDATED, userUpdatedEvent);
        const { password: _, ...userResponse } = user;
        res.json(userResponse);
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/users', authenticateToken, (req, res) => {
    try {
        const usersResponse = users.map(({ password: _, ...user }) => user);
        res.json(usersResponse);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/users/validate-token', (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            res.json({ valid: true, user: decoded });
        });
    }
    catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
async function startServer() {
    try {
        await rabbitmqService.connect();
        app.listen(PORT, () => {
            console.log(`User Service running on port ${PORT}`);
        });
        process.on('SIGINT', async () => {
            console.log('Shutting down User Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('Shutting down User Service...');
            await rabbitmqService.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start User Service:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=user.js.map