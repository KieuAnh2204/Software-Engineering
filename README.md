# FoodFast Delivery – Kiến trúc Microservices
> Nền tảng microservices có khả năng mở rộng, cloud-native cho đặt đồ ăn trực tuyến.
---

# SGU2025_CNPM_NHOM11

**Học phần:** Công nghệ phần mềm  
**Giảng viên:** TS. Nguyễn Quốc Huy  
**Lớp:** DCT122C5  
**Nhóm:** 11  

---
# Tên đề tài
**Tạo 4 services (User, Product, Order, Payment) giao tiếp với nhau**

# Giới thiệu & mô tả
FoodFast Drone Delivery là hệ thống giao đồ ăn nhanh bằng drone, mang đến trải nghiệm giao hàng hiện đại và tiện lợi.  
Người dùng có thể đặt món ăn từ các cửa hàng đối tác, thanh toán trực tuyến qua QR code, và nhận đồ ăn trực tiếp từ drone tại vị trí của mình.

---

# Thành viên
| Họ và tên | Mã số sinh viên |
|-----------|------------------|
| Võ Kiều Anh | 3122411009 |
| Hồ Đăng Khoa | 3122411195 |
---
## Mục lục
- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Ảnh chụp màn hình](#ảnh-chụp-màn-hình)
- [Yêu cầu](#yêu-cầu)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Biến môi trường](#biến-môi-trường)
- [Chạy local với Docker Compose](#chạy-local-với-docker-compose)
- [Chạy trên Kubernetes](#chạy-trên-kubernetes)
- [Microservices và Endpoints](#microservices-và-endpoints)
- [Cài đặt Frontend](#cài-đặt-frontend)
- [Testing và Linting](#testing-và-linting)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Demo và Nộp bài](#demo-và-nộp-bài)

---

## Tổng quan
FoodFast Delivery là một nền tảng cloud-native, domain-driven để đặt đồ ăn trực tuyến. Hệ thống hỗ trợ ba vai trò chính:
- **Customer (Khách hàng)** – duyệt menu, đặt hàng, theo dõi trạng thái.
- **Restaurant Owner (Chủ nhà hàng)** – quản lý nhà hàng và món ăn.
- **Super Admin (Quản trị viên)** – quản lý toàn bộ nền tảng.

| Service | Chức năng | Port |
| --- | --- | --- |
| **User Service** | Xác thực, quản lý danh tính Customer và Restaurant Owner, quản lý Super Admin | `3001` |
| **Product Service** | Quản lý vòng đời Restaurant và Dish, tính khả dụng, quyền sở hữu | `3003` |
| **Order Service** | Quy trình Orders và Order Items, theo dõi trạng thái | `3002` |
| **Payment Service** | Tích hợp VNPay, xử lý payment callbacks, ghi log giao dịch | `3004` |
| **Frontend** | Giao diện React cho Customers, Owners, Super Admin | `3000` |

**Sơ đồ tương tác giữa các Service**
- Customer/Owner/Super Admin → **Frontend** → API Gateway/Ingress → **User Service** để xác thực (`JWT`).
- Frontend lấy thông tin restaurants/dishes từ **Product Service**.
- Checkout kích hoạt **Order Service**, service này phát ra events đến **Payment Service**.
- **Payment Service** giao tiếp với **VNPay** và phát ra payment status events được **Order Service** nhận.

---

## Kiến trúc
- **Microservices**: User, Product, Order, Payment.
- **API Gateway / Ingress**: Gateway tùy chọn (Nginx/Ingress) định tuyến traffic từ client đến các services.
- **MongoDB Atlas**: Cơ sở dữ liệu chính cho tất cả services (mỗi service có database riêng).
- **Message Broker**: Kafka hoặc RabbitMQ (có thể thay đổi) truyền events giữa Order và Payment services.
- **Docker Compose**: Điều phối local tất cả services.
- **Kubernetes Manifests**: Thư mục `k8s/` chứa các manifests cho deployment, service và secrets.
- **REST APIs + JWT Auth**: Xác thực stateless được cấp bởi User Service và xác minh bởi các downstream services.
- **Event-Driven Communication**: Orders phát sự kiện thanh toán; Payment Service gửi lại xác nhận thanh toán.

---

## Công nghệ sử dụng
| Lớp | Công nghệ |
| --- | --- |
| Frontend | React + Vite (SPA) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT, bcrypt hashing |
| Realtime | Socket.IO (kênh thông báo tùy chọn) |
| Payments | VNPay (REST APIs chính thức) |
| Message Broker | Kafka hoặc RabbitMQ (có thể thay đổi) |
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes |
| API Documentation | Swagger/OpenAPI (Payment + tài liệu chung) |

---

## Ảnh chụp màn hình
- Bảng điều khiển Customer – _sắp ra mắt_
- Bảng điều khiển Restaurant Owner – _sắp ra mắt_
- Bảng điều khiển Super Admin – _sắp ra mắt_

---

## Yêu cầu
- Node.js v16+
- Docker Desktop & `docker-compose`
- Kubernetes cluster với `kubectl`
- MongoDB Atlas URI (cho mỗi service hoặc shared cluster)
- Thông tin xác thực VNPay API (TMN Code, Hash Secret, Return URL)

---

## Cấu trúc thư mục
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

## Biến môi trường
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

Mỗi service có thể mở rộng template này với các biến cụ thể cho service (ví dụ: queue endpoints, logging).

---

## Chạy local với Docker Compose
```bash
docker-compose up --build
docker-compose down
```

**Ports mặc định**
- User Service `3001`
- Order Service `3002`
- Product Service `3003`
- Payment Service `3004`
- Frontend `3000`

**Khởi tạo Super Admin (chạy một lần cho mỗi môi trường)**
```bash
cd services/user-service
node src/seedAdmin.js
```

Trong các containers, các services kết nối đến MongoDB sử dụng `MONGO_URI` được định nghĩa trong `.env` hoặc Docker secrets.

---

## Chạy trên Kubernetes
```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

kubectl get pods
kubectl get svc
```

- `secrets.yaml`: lưu trữ dữ liệu nhạy cảm (JWT secret, thông tin VNPay, Mongo URIs).
- `deployment.yaml`: định nghĩa Deployments cho tất cả microservices và frontend.
- `service.yaml`: expose Deployments ra ngoài/trong (ClusterIP, NodePort, hoặc LoadBalancer).

---

## Microservices và Endpoints

### User Service (Port 3001)
| Endpoint | Method | Mô tả | Xác thực |
| --- | --- | --- | --- |
| `/api/auth/register/customer` | POST | Đăng ký customer mới | Public |
| `/api/auth/register/owner` | POST | Đăng ký restaurant owner | Public |
| `/api/auth/login/customer` | POST | Đăng nhập customer | Public |
| `/api/auth/login/owner` | POST | Đăng nhập owner | Public |
| `/api/auth/login/admin` | POST | Đăng nhập Super Admin | Public |
| `/api/auth/customers/me` | GET | Thông tin customer | JWT (customer) |
| `/api/auth/owners/me` | GET | Thông tin owner | JWT (owner) |
| `/api/users/customers` | GET | Danh sách customers | JWT (admin) |
| `/api/users/owners` | GET | Danh sách owners | JWT (admin) |

### Product Service (Port 3003)
| Endpoint | Method | Mô tả | Xác thực |
| --- | --- | --- | --- |
| `/api/restaurants` | GET | Danh sách restaurants | Public |
| `/api/restaurants/:id` | GET | Chi tiết restaurant | Public |
| `/api/restaurants` | POST | Tạo restaurant (owner/admin) | JWT (owner/admin) |
| `/api/restaurants/:id` | PUT | Cập nhật restaurant | JWT (owner/admin) |
| `/api/restaurants/:id/status` | PATCH | Bật/tắt active/blocked | JWT (admin) |
| `/api/dishes` | GET | Danh sách dishes (theo restaurant, filters) | Public |
| `/api/dishes/:id` | GET | Chi tiết dish | Public |
| `/api/dishes` | POST | Tạo dish | JWT (owner/admin) |
| `/api/dishes/:id` | PUT | Cập nhật dish | JWT (owner/admin) |
| `/api/dishes/:id` | DELETE | Xóa dish | JWT (owner/admin) |

### Order Service (Port 3002)
| Endpoint | Method | Mô tả | Xác thực |
| --- | --- | --- | --- |
| `/api/orders` | POST | Tạo order với items | JWT (customer) |
| `/api/orders` | GET | Danh sách orders (theo user hoặc admin) | JWT |
| `/api/orders/:id` | GET | Chi tiết order | JWT |
| `/api/orders/:id/status` | PATCH | Cập nhật trạng thái order | JWT (owner/admin) |

### Payment Service (Port 3004)
| Endpoint | Method | Mô tả | Xác thực |
| --- | --- | --- | --- |
| `/api/payments/vnpay/create` | POST | Tạo giao dịch VNPay | JWT (customer) |
| `/api/payments/vnpay/return` | GET | Xử lý VNPay return | Public (VNPay callback) |
| `/api/payments/:orderId` | GET | Lấy trạng thái thanh toán theo order | JWT |

---

## Cài đặt Frontend
```bash
cd frontend/Users
npm install
npm start
```
Mở [http://localhost:3000](http://localhost:3000) để truy cập SPA.

---

## Testing và Linting
**Backend**
```bash
npm test
npm run lint
```

**Frontend**
```bash
npm test
```

Chạy backend tests trong mỗi thư mục service (ví dụ: `cd services/user-service && npm test`). Frontend tests chạy từ `frontend/Users`.

---

## Xử lý sự cố
- **Vấn đề CORS**: Cập nhật allowed origins trong mỗi service (`cors` middleware) và đảm bảo frontend URL được whitelist.
- **MongoDB Access**: Thêm IP của bạn vào danh sách network access list của MongoDB Atlas hoặc chuyển sang VPC peering connection cho production.
- **VNPay Callbacks**: Xác minh public callback URL có thể truy cập được, đảm bảo hash secret khớp trong VNPay dashboard, và validate tính nhất quán của timezone.

---

## Demo và Nộp bài
- **GitHub Repository**: _link đang chờ_
- **Demo Video**: _link đang chờ_
- **Thành viên nhóm**: _đang cập nhật_

---

Được thực hiện với ❤️ bởi đội ngũ kỹ thuật FoodFast Delivery.
