import express from 'express';
import cors from 'cors';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { RabbitMQService } from '../shared/rabbitmq.service';
import { 
  USER_EVENTS, 
  EXCHANGES, 
  ROUTING_KEYS, 
  UserCreatedEvent, 
  UserUpdatedEvent 
} from '../shared/events';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

// Middleware
app.use(cors());
app.use(express.json());

// RabbitMQ service
const rabbitmqService = new RabbitMQService(RABBITMQ_URL, 'user-service');

// In-memory user storage (replace with database in production)
interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

const users: User[] = [];

// Middleware for JWT authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ service: 'user-service', status: 'healthy', timestamp: new Date() });
});

// Register new user
app.post('/users/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);

    // Publish user created event
    const userCreatedEvent: UserCreatedEvent = {
      userId: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      createdAt: newUser.createdAt,
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.USER_EXCHANGE,
      ROUTING_KEYS.USER_CREATED,
      USER_EVENTS.USER_CREATED,
      userCreatedEvent
    );

    // Return user without password
    const { password: _, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' } as jwt.SignOptions
    );

    // Publish user authenticated event
    await rabbitmqService.publishEvent(
      EXCHANGES.USER_EXCHANGE,
      'user.authenticated',
      USER_EVENTS.USER_AUTHENTICATED,
      { userId: user.id, email: user.email, authenticatedAt: new Date() }
    );

    res.json({ token, userId: user.id, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
app.get('/users/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user without password
    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    const user = users[userIndex];
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    user.updatedAt = new Date();

    // Publish user updated event
    const userUpdatedEvent: UserUpdatedEvent = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      updatedAt: user.updatedAt,
    };

    await rabbitmqService.publishEvent(
      EXCHANGES.USER_EXCHANGE,
      ROUTING_KEYS.USER_UPDATED,
      USER_EVENTS.USER_UPDATED,
      userUpdatedEvent
    );

    // Return user without password
    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin endpoint)
app.get('/users', authenticateToken, (req, res) => {
  try {
    const usersResponse = users.map(({ password: _, ...user }) => user);
    res.json(usersResponse);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate token endpoint (used by other services)
app.post('/users/validate-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.json({ valid: true, user: decoded });
    });
  } catch (error) {
    console.error('Token validation error:', error);
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
      console.log(`User Service running on port ${PORT}`);
    });

    // Graceful shutdown
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
  } catch (error) {
    console.error('Failed to start User Service:', error);
    process.exit(1);
  }
}

startServer();