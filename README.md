# FoodFast Delivery – Microservices Architecture
> A scalable, cloud-native microservices platform for online food ordering.

## 📚 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Screenshots (placeholder)](#screenshots-placeholder)
- [Prerequisites](#prerequisites)
- [Repository Layout](#repository-layout)
- [Environment Variables](#environment-variables)
- [Running Locally with Docker Compose](#running-locally-with-docker-compose)
- [Running on Kubernetes](#running-on-kubernetes)
- [Microservices & Endpoints](#microservices--endpoints)
- [Frontend Setup](#frontend-setup)
- [Testing & Linting](#testing--linting)
- [Troubleshooting](#troubleshooting)
- [Demo & Submission](#demo--submission)

---

## Overview
FoodFast Delivery is a cloud-native, domain-driven platform for online food ordering. It supports three core personas:
- **Customer** – browses menus, places orders, tracks status.
- **Restaurant Owner** – manages restaurants and dishes.
- **Super Admin** – governs the entire platform.

| Service | Responsibility | Port |
| --- | --- | --- |
| **User Service** | Authentication, Customer and Restaurant Owner identities, Super Admin management | `3001` |
| **Product Service** | Restaurant and Dish lifecycle, availability, ownership (no brand concept) | `3003` |
| **Order Service** | Orders and Order Items workflow, status tracking | `3002` |
| **Payment Service** | VNPay integration, payment callbacks, transaction logs | `3004` |
| **Frontend** | React UI for Customers, Owners, Super Admin | `3000` |

**Service Interaction Diagram**
- Customer/Owner/Super Admin → **Frontend** → API Gateway/Ingress → **User Service** for auth (`JWT`).
- Frontend fetches restaurants/dishes from **Product Service**.
- Checkout triggers **Order Service**, which emits events to **Payment Service**.
- **Payment Service** communicates with **VNPay** and emits payment status events consumed by **Order Service**.

---

## Architecture
- **Microservices**: User, Product, Order, Payment.
- **API Gateway / Ingress**: Optional gateway (Nginx/Ingress) routes client traffic to services.
- **MongoDB Atlas**: Primary database for all services (separate databases per service).
- **Message Broker**: Kafka or RabbitMQ (pluggable) transports events between Order and Payment services.
- **Docker Compose**: Local orchestration of all services.
- **Kubernetes Manifests**: `k8s/` folder contains deployment, service, and secret manifests.
- **REST APIs + JWT Auth**: Stateless authentication issued by the User Service and verified by downstream services.
- **Event-Driven Communication**: Orders publish payment events; Payment Service pushes payment confirmations back.

---

## Tech Stack
| Layer | Technology |
| --- | --- |
| Frontend | React + Vite (SPA) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT, bcrypt hashing |
| Realtime | Socket.IO (optional notification channel) |
| Payments | VNPay (official REST APIs) |
| Message Broker | Kafka or RabbitMQ (pluggable) |
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes |
| API Documentation | Swagger/OpenAPI (Payment + shared docs) |

---

## Screenshots (placeholder)
- Customer web dashboard – _coming soon_
- Restaurant Owner console – _coming soon_
- Super Admin console – _coming soon_

---

## Prerequisites
- Node.js v16+
- Docker Desktop & `docker-compose`
- Kubernetes cluster with `kubectl`
- MongoDB Atlas URI (per service or shared cluster)
- VNPay API credentials (TMN Code, Hash Secret, Return URL)

---

## Repository Layout
```
Software-Engineering/
├─ services/
│  ├─ user-service/
│  │  └─ src/
│  ├─ product-service/
│  │  └─ src/
│  ├─ order-service/
│  │  └─ src/
│  └─ payment-service/
│     └─ src/
├─ frontend/
│  └─ Users/                # React SPA source
├─ k8s/
│  ├─ deployment.yaml
│  ├─ service.yaml
│  └─ secrets.yaml
├─ docker-compose.yml
└─ README.md
```

---

## Environment Variables
```env
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/foodfast

# User Service
PORT=3001
JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=7d

# Product Service
PORT=3003

# Order Service
PORT=3002

# Payment Service
PORT=3004
VNPAY_TMN_CODE=YOUR_TMN_CODE
VNPAY_HASH_SECRET=YOUR_HASH_SECRET
VNPAY_RETURN_URL=https://your-domain.com/payment/callback

# Frontend
REACT_APP_BACKEND_URL=http://localhost:3001
```

Each service can extend this template with service-specific variables (e.g., queue endpoints, logging).

---

## Running Locally with Docker Compose
```bash
docker-compose up --build
docker-compose down
```

**Default Ports**
- User Service `3001`
- Order Service `3002`
- Product Service `3003`
- Payment Service `3004`
- Frontend `3000`

**Seed Super Admin (run once per environment)**
```bash
cd services/user-service
node src/seedAdmin.js
```

Within the containers, services connect to MongoDB using `MONGO_URI` defined in `.env` or Docker secrets.

---

## Running on Kubernetes
```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

kubectl get pods
kubectl get svc
```

- `secrets.yaml`: stores sensitive data (JWT secret, VNPay credentials, Mongo URIs).
- `deployment.yaml`: defines Deployments for all microservices and the frontend.
- `service.yaml`: exposes Deployments internally/externally (ClusterIP, NodePort, or LoadBalancer).

---

## Microservices & Endpoints

### User Service (Port 3001)
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/auth/register/customer` | POST | Register new customer | Public |
| `/api/auth/register/owner` | POST | Register restaurant owner | Public |
| `/api/auth/login/customer` | POST | Customer login | Public |
| `/api/auth/login/owner` | POST | Owner login | Public |
| `/api/auth/login/admin` | POST | Super Admin login | Public |
| `/api/auth/customers/me` | GET | Customer profile | JWT (customer) |
| `/api/auth/owners/me` | GET | Owner profile | JWT (owner) |
| `/api/users/customers` | GET | List customers | JWT (admin) |
| `/api/users/owners` | GET | List owners | JWT (admin) |

### Product Service (Port 3003)
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/restaurants` | GET | List restaurants | Public |
| `/api/restaurants/:id` | GET | Restaurant detail | Public |
| `/api/restaurants` | POST | Create restaurant (owner/admin) | JWT (owner/admin) |
| `/api/restaurants/:id` | PUT | Update restaurant | JWT (owner/admin) |
| `/api/restaurants/:id/status` | PATCH | Toggle active/blocked | JWT (admin) |
| `/api/dishes` | GET | List dishes (by restaurant, filters) | Public |
| `/api/dishes/:id` | GET | Dish detail | Public |
| `/api/dishes` | POST | Create dish | JWT (owner/admin) |
| `/api/dishes/:id` | PUT | Update dish | JWT (owner/admin) |
| `/api/dishes/:id` | DELETE | Remove dish | JWT (owner/admin) |

### Order Service (Port 3002)
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/orders` | POST | Create order with items | JWT (customer) |
| `/api/orders` | GET | List orders (by user or admin) | JWT |
| `/api/orders/:id` | GET | Order detail | JWT |
| `/api/orders/:id/status` | PATCH | Update order status | JWT (owner/admin) |

### Payment Service (Port 3004)
| Endpoint | Method | Description | Auth |
| --- | --- | --- | --- |
| `/api/payments/vnpay/create` | POST | Create VNPay transaction | JWT (customer) |
| `/api/payments/vnpay/return` | GET | VNPay return handler | Public (VNPay callback) |
| `/api/payments/:orderId` | GET | Get payment status by order | JWT |

---

## Frontend Setup
```bash
cd frontend/Users
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000) to access the SPA.

---

## Testing & Linting
**Backend**
```bash
npm test
npm run lint
```

**Frontend**
```bash
npm test
```

Run backend tests inside each service directory (e.g., `cd services/user-service && npm test`). Frontend tests run from `frontend/Users`.

---

## Troubleshooting
- **CORS Issues**: Update allowed origins in each service (`cors` middleware) and ensure the frontend URL is whitelisted.
- **MongoDB Access**: Add your IP to the MongoDB Atlas network access list or switch to a VPC peering connection for production.
- **VNPay Callbacks**: Verify the public callback URL is reachable, ensure the hash secret matches in VNPay dashboard, and validate timezone consistency.

---

## Demo & Submission
- **GitHub Repository**: _link pending_
- **Demo Video**: _link pending_
- **Team Members**: _names pending_

---

Made with ❤️ by the FoodFast Delivery engineering team.
