# FoodFast Delivery - Microservices Platform

## 🚀 Quick Start

### ✅ All services are running!

```bash
User Service:    http://localhost:3001 ✅
Product Service: http://localhost:3003 ✅
Order Service:   http://localhost:3002 ✅
Payment Service: http://localhost:3004 ✅
```

### 📦 Using Docker Manager:

```powershell
# Start all services
.\docker-manager.ps1 start

# Check status
.\docker-manager.ps1 status

# View logs
.\docker-manager.ps1 logs

# Stop all services
.\docker-manager.ps1 stop
```

### 🧪 Test API:

```powershell
# Health check
Invoke-RestMethod http://localhost:3001/health

# Test all services
.\docker-manager.ps1 status
```

---

## 📚 Documentation

- **[DOCKER_SUCCESS.md](DOCKER_SUCCESS.md)** - Complete Docker setup guide
- **[DOCKER_MONGODB_SETUP.md](DOCKER_MONGODB_SETUP.md)** - MongoDB Atlas setup
- **[MONGODB_ATLAS_QUICK_START.md](MONGODB_ATLAS_QUICK_START.md)** - Quick setup
- **[services/README.md](services/README.md)** - API documentation

---

## 🏗️ Architecture

```
Frontend (Port 5000)
    ├── User Service (3001)
    ├── Product Service (3003)
    ├── Order Service (3002)
    └── Payment Service (3004)
         └── MongoDB Atlas
```

---

## 🎯 MongoDB Atlas

- **Cluster:** `cluster0.r3lhqwd.mongodb.net`
- **Username:** `foodfast_delivery`
- **Databases:** 4 (auto-created)

Dashboard: https://cloud.mongodb.com

---

**🎉 Your microservices are ready to use!**
