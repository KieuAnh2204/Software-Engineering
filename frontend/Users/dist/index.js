// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  dishes;
  orders;
  activityLogs;
  restaurantStatusData;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.dishes = /* @__PURE__ */ new Map();
    this.orders = /* @__PURE__ */ new Map();
    this.activityLogs = /* @__PURE__ */ new Map();
    this.restaurantStatusData = {
      id: randomUUID(),
      isOpen: true,
      nextOpeningNote: null
    };
    this.seedData();
  }
  seedData() {
    const testUsers = [
      {
        username: "owner",
        password: "owner123",
        role: "restaurant_owner",
        email: "owner@restaurant.com",
        restaurantName: "My Restaurant"
      },
      {
        username: "admin",
        password: "admin123",
        role: "admin",
        email: "admin@foodfast.com",
        restaurantName: null
      }
    ];
    testUsers.forEach((user) => {
      const id = randomUUID();
      this.users.set(id, {
        id,
        username: user.username,
        password: user.password,
        role: user.role,
        email: user.email,
        restaurantName: user.restaurantName
      });
    });
    const sampleDishes = [];
    sampleDishes.forEach((dish) => {
      const id = randomUUID();
      this.dishes.set(id, {
        ...dish,
        id,
        createdAt: /* @__PURE__ */ new Date()
      });
    });
    const now = /* @__PURE__ */ new Date();
    const dishIds = Array.from(this.dishes.keys());
    const sampleOrders = [];
    sampleOrders.forEach((order, index) => {
      const id = randomUUID();
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - index);
      this.orders.set(id, {
        ...order,
        id,
        orderedAt: orderDate,
        updatedAt: orderDate
      });
    });
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      id,
      // @ts-ignore
      username: insertUser.username,
      // @ts-ignore
      password: insertUser.password,
      // @ts-ignore
      role: insertUser.role ?? "customer",
      // @ts-ignore
      email: insertUser.email ?? null,
      // @ts-ignore
      restaurantName: insertUser.restaurantName ?? null
    };
    this.users.set(id, user);
    return user;
  }
  async getDishes(filters) {
    let dishes2 = Array.from(this.dishes.values());
    if (filters?.category) {
      dishes2 = dishes2.filter((dish) => dish.category === filters.category);
    }
    if (filters?.isAvailable !== void 0) {
      dishes2 = dishes2.filter((dish) => dish.isAvailable === filters.isAvailable);
    }
    return dishes2.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getDish(id) {
    return this.dishes.get(id);
  }
  async createDish(insertDish) {
    const id = randomUUID();
    const dish = {
      ...insertDish,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      isAvailable: insertDish.isAvailable ?? true,
      imageUrl: insertDish.imageUrl ?? null
    };
    this.dishes.set(id, dish);
    return dish;
  }
  async updateDish(id, updates) {
    const dish = this.dishes.get(id);
    if (!dish) return void 0;
    const updatedDish = {
      ...dish,
      ...updates
    };
    this.dishes.set(id, updatedDish);
    return updatedDish;
  }
  async toggleDishAvailability(id) {
    const dish = this.dishes.get(id);
    if (!dish) return void 0;
    const updatedDish = {
      ...dish,
      isAvailable: !dish.isAvailable
    };
    this.dishes.set(id, updatedDish);
    return updatedDish;
  }
  async deleteDish(id) {
    return this.dishes.delete(id);
  }
  async getOrders(filters) {
    let orders2 = Array.from(this.orders.values());
    if (filters?.startDate) {
      orders2 = orders2.filter((order) => order.orderedAt >= filters.startDate);
    }
    if (filters?.endDate) {
      orders2 = orders2.filter((order) => order.orderedAt <= filters.endDate);
    }
    return orders2.sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());
  }
  async createOrder(insertOrder) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const order = {
      id,
      dishId: insertOrder.dishId,
      dishName: insertOrder.dishName,
      quantity: insertOrder.quantity,
      totalAmount: insertOrder.totalAmount,
      status: insertOrder.status ?? "pending",
      customerName: insertOrder.customerName ?? null,
      customerAddress: insertOrder.customerAddress ?? null,
      orderedAt: now,
      updatedAt: now
    };
    this.orders.set(id, order);
    return order;
  }
  async updateOrderStatus(id, status) {
    const order = this.orders.get(id);
    if (!order) return void 0;
    const updatedOrder = {
      ...order,
      status,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  async getActivityLogs(filters) {
    let logs = Array.from(this.activityLogs.values());
    if (filters?.userId) {
      logs = logs.filter((log2) => log2.userId === filters.userId);
    }
    if (filters?.startDate) {
      logs = logs.filter((log2) => log2.timestamp >= filters.startDate);
    }
    if (filters?.endDate) {
      logs = logs.filter((log2) => log2.timestamp <= filters.endDate);
    }
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  async createActivityLog(insertLog) {
    const id = randomUUID();
    const log2 = {
      id,
      userId: insertLog.userId,
      username: insertLog.username,
      action: insertLog.action,
      details: insertLog.details ?? null,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.activityLogs.set(id, log2);
    return log2;
  }
  async getRestaurantStatus() {
    return this.restaurantStatusData;
  }
  async updateRestaurantStatus(status) {
    this.restaurantStatusData = {
      ...this.restaurantStatusData,
      ...status
    };
    return this.restaurantStatusData;
  }
  async getRevenueSummary(startDate, endDate) {
    const orders2 = await this.getOrders({ startDate, endDate });
    const completedOrders = orders2.filter((order) => (order.status || "").toLowerCase() === "completed");
    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount);
    }, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const dishRevenue = /* @__PURE__ */ new Map();
    completedOrders.forEach((order) => {
      const existing = dishRevenue.get(order.dishId) || {
        dishId: order.dishId,
        dishName: order.dishName,
        orderCount: 0,
        totalRevenue: 0
      };
      existing.orderCount += 1;
      existing.totalRevenue += parseFloat(order.totalAmount);
      dishRevenue.set(order.dishId, existing);
    });
    const popularDishes = Array.from(dishRevenue.values()).sort((a, b) => b.orderCount - a.orderCount).slice(0, 5).map((dish) => ({
      ...dish,
      totalRevenue: dish.totalRevenue.toFixed(2)
    }));
    const revenueByDateMap = /* @__PURE__ */ new Map();
    completedOrders.forEach((order) => {
      const dateKey = order.orderedAt.toISOString().split("T")[0];
      const existing = revenueByDateMap.get(dateKey) || { revenue: 0, orderCount: 0 };
      existing.revenue += parseFloat(order.totalAmount);
      existing.orderCount += 1;
      revenueByDateMap.set(dateKey, existing);
    });
    const revenueByDate = Array.from(revenueByDateMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue.toFixed(2),
      orderCount: data.orderCount
    })).sort((a, b) => a.date.localeCompare(b.date));
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: completedOrders.length,
      averageOrderValue: averageOrderValue.toFixed(2),
      popularDishes,
      revenueByDate
    };
  }
  async getPopularDishes(limit = 5) {
    const summary = await this.getRevenueSummary();
    return summary.popularDishes.slice(0, limit);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, varchar, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  email: text("email"),
  restaurantName: text("restaurant_name")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  restaurantName: true
});
var dishes = pgTable("dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var insertDishSchema = createInsertSchema(dishes, {
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number")
}).omit({
  id: true,
  createdAt: true
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dishId: varchar("dish_id").notNull(),
  dishName: text("dish_name").notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  orderedAt: timestamp("ordered_at").notNull().default(sql`now()`),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name"),
  customerAddress: text("customer_address"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var insertOrderSchema = createInsertSchema(orders, {
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number")
}).omit({
  id: true,
  orderedAt: true,
  updatedAt: true
});
var restaurantStatus = pgTable("restaurant_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isOpen: boolean("is_open").notNull().default(true),
  nextOpeningNote: text("next_opening_note")
});
var insertRestaurantStatusSchema = createInsertSchema(restaurantStatus).omit({
  id: true
});
var revenueSummarySchema = z.object({
  totalRevenue: z.string(),
  totalOrders: z.number(),
  averageOrderValue: z.string(),
  popularDishes: z.array(z.object({
    dishId: z.string(),
    dishName: z.string(),
    orderCount: z.number(),
    totalRevenue: z.string()
  })),
  revenueByDate: z.array(z.object({
    date: z.string(),
    revenue: z.string(),
    orderCount: z.number()
  }))
});
var activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`)
});
var insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/auth/owner/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (user.role !== "restaurant_owner") {
        return res.status(403).json({ error: "Access denied. Restaurant owner role required." });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        restaurantName: user.restaurantName,
        role: user.role
      });
    } catch (error) {
      console.error("Error during owner login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/admin/users/customers", async (req, res) => {
    try {
      const base = process.env.VITE_USER_API_CUSTOMERS || process.env.USER_SERVICE_URL || "http://user-service:3001/api/users";
      const params = new URLSearchParams();
      if (req.query.page) params.set("page", req.query.page);
      if (req.query.limit) params.set("limit", req.query.limit);
      const url = `${base.replace(/\/$/, "")}/customers${params.toString() ? `?${params.toString()}` : ""}`;
      const headers = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      const response = await fetch(url, { method: "GET", headers });
      if (!response.ok) {
        const text2 = await response.text();
        return res.status(response.status).json({
          error: "Failed to fetch customers",
          upstreamStatus: response.status,
          upstreamBody: text2,
          upstreamUrl: url
        });
      }
      const body = await response.json();
      res.json(body);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({
        error: "Failed to fetch customers",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/admin/restaurants", async (req, res) => {
    try {
      const base = process.env.PRODUCT_SERVICE_URL || process.env.VITE_PRODUCT_API || "http://product-service:3003/api";
      const params = new URLSearchParams();
      if (req.query.owner_id) params.set("owner_id", req.query.owner_id);
      if (req.query.is_active) params.set("is_active", req.query.is_active);
      if (req.query.is_blocked) params.set("is_blocked", req.query.is_blocked);
      const url = `${base.replace(/\/$/, "")}/restaurants${params.toString() ? `?${params.toString()}` : ""}`;
      const headers = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      const response = await fetch(url, { method: "GET", headers });
      if (!response.ok) {
        const text2 = await response.text();
        return res.status(response.status).json({
          error: "Failed to fetch restaurants",
          upstreamStatus: response.status,
          upstreamBody: text2,
          upstreamUrl: url
        });
      }
      const body = await response.json();
      res.json(body);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({
        error: "Failed to fetch restaurants",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/admin/restaurants/:id/dishes", async (req, res) => {
    try {
      const base = process.env.PRODUCT_SERVICE_URL || process.env.VITE_PRODUCT_API || "http://product-service:3003/api";
      const url = `${base.replace(/\/$/, "")}/dishes?restaurant_id=${req.params.id}`;
      const headers = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      const response = await fetch(url, { method: "GET", headers });
      if (!response.ok) {
        const text2 = await response.text();
        return res.status(response.status).json({
          error: "Failed to fetch dishes",
          upstreamStatus: response.status,
          upstreamBody: text2,
          upstreamUrl: url
        });
      }
      const body = await response.json();
      res.json(body);
    } catch (error) {
      console.error("Error fetching dishes by restaurant:", error);
      res.status(500).json({
        error: "Failed to fetch dishes",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.patch("/api/admin/users/:id/active", async (req, res) => {
    try {
      const base = process.env.VITE_USER_API_CUSTOMERS || process.env.USER_SERVICE_URL || "http://user-service:3001/api/users";
      const url = `${base.replace(/\/$/, "")}/${req.params.id}/active`;
      const headers = { "Content-Type": "application/json" };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: req.body?.isActive })
      });
      if (!response.ok) {
        const text2 = await response.text();
        return res.status(response.status).json({
          error: "Failed to update user status",
          upstreamStatus: response.status,
          upstreamBody: text2,
          upstreamUrl: url
        });
      }
      const body = await response.json();
      res.json(body);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({
        error: "Failed to update user status",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/auth/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      if (user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ error: "Access denied. Admin role required." });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.get("/api/admin/dishes", async (req, res) => {
    try {
      const { category, isAvailable } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (isAvailable !== void 0) filters.isAvailable = isAvailable === "true";
      const dishes2 = await storage.getDishes(filters);
      res.json(dishes2);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });
  app2.get("/api/admin/dishes/:id", async (req, res) => {
    try {
      const dish = await storage.getDish(req.params.id);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      console.error("Error fetching dish:", error);
      res.status(500).json({ error: "Failed to fetch dish" });
    }
  });
  app2.post("/api/admin/dishes", async (req, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });
  app2.patch("/api/admin/dishes/:id", async (req, res) => {
    try {
      const validatedData = insertDishSchema.partial().parse(req.body);
      const dish = await storage.updateDish(req.params.id, validatedData);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      console.error("Error updating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });
  app2.patch("/api/admin/dishes/:id/toggle-availability", async (req, res) => {
    try {
      const dish = await storage.toggleDishAvailability(req.params.id);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json(dish);
    } catch (error) {
      console.error("Error toggling dish availability:", error);
      res.status(500).json({ error: "Failed to toggle dish availability" });
    }
  });
  app2.delete("/api/admin/dishes/:id", async (req, res) => {
    try {
      const success = await storage.deleteDish(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ error: "Failed to delete dish" });
    }
  });
  app2.get("/api/admin/restaurant/status", async (req, res) => {
    try {
      const status = await storage.getRestaurantStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching restaurant status:", error);
      res.status(500).json({ error: "Failed to fetch restaurant status" });
    }
  });
  app2.patch("/api/admin/restaurant/status", async (req, res) => {
    try {
      const validatedData = insertRestaurantStatusSchema.partial().parse(req.body);
      const status = await storage.updateRestaurantStatus(validatedData);
      res.json(status);
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  });
  app2.get("/api/admin/analytics/revenue", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const base = process.env.ORDER_SERVICE_URL || process.env.VITE_ORDER_API || "http://order-service:3002/api/orders";
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const url = `${base.replace(/\/$/, "")}/admin/analytics/revenue${params.toString() ? `?${params.toString()}` : ""}`;
      const headers = {
        "Content-Type": "application/json"
      };
      if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
      }
      const response = await fetch(url, {
        method: "GET",
        headers
      });
      if (!response.ok) {
        const text2 = await response.text();
        return res.status(response.status).json({
          error: "Failed to fetch revenue summary",
          upstreamStatus: response.status,
          upstreamBody: text2,
          upstreamUrl: url
        });
      }
      const summary = await response.json();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching revenue summary:", error);
      res.status(500).json({
        error: "Failed to fetch revenue summary",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.get("/api/admin/analytics/popular-dishes", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 5;
      const popularDishes = await storage.getPopularDishes(limit);
      res.json(popularDishes);
    } catch (error) {
      console.error("Error fetching popular dishes:", error);
      res.status(500).json({ error: "Failed to fetch popular dishes" });
    }
  });
  app2.get("/api/admin/orders", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      const orders2 = await storage.getOrders(filters);
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.post("/api/admin/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });
  app2.patch("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });
  app2.get("/api/owner/dishes", async (req, res) => {
    try {
      const { category, isAvailable } = req.query;
      const filters = {};
      if (category) filters.category = category;
      if (isAvailable !== void 0) filters.isAvailable = isAvailable === "true";
      const dishes2 = await storage.getDishes(filters);
      res.json(dishes2);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });
  app2.post("/api/owner/dishes", async (req, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "CREATE_DISH",
        details: `Created dish: ${dish.name}`
      });
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });
  app2.patch("/api/owner/dishes/:id", async (req, res) => {
    try {
      const validatedData = insertDishSchema.partial().parse(req.body);
      const dish = await storage.updateDish(req.params.id, validatedData);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "UPDATE_DISH",
        details: `Updated dish: ${dish.name}`
      });
      res.json(dish);
    } catch (error) {
      console.error("Error updating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });
  app2.patch("/api/owner/dishes/:id/toggle-availability", async (req, res) => {
    try {
      const dish = await storage.toggleDishAvailability(req.params.id);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "TOGGLE_DISH_AVAILABILITY",
        details: `Toggled availability for dish: ${dish.name} to ${dish.isAvailable ? "available" : "unavailable"}`
      });
      res.json(dish);
    } catch (error) {
      console.error("Error toggling dish availability:", error);
      res.status(500).json({ error: "Failed to toggle dish availability" });
    }
  });
  app2.delete("/api/owner/dishes/:id", async (req, res) => {
    try {
      const dish = await storage.getDish(req.params.id);
      const success = await storage.deleteDish(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Dish not found" });
      }
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "DELETE_DISH",
        details: `Deleted dish: ${dish?.name || req.params.id}`
      });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ error: "Failed to delete dish" });
    }
  });
  app2.get("/api/owner/orders", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters = {};
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      const orders2 = await storage.getOrders(filters);
      res.json(orders2);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.patch("/api/owner/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "UPDATE_ORDER_STATUS",
        details: `Updated order ${order.id} status to ${status}`
      });
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });
  app2.get("/api/owner/restaurant/status", async (req, res) => {
    try {
      const status = await storage.getRestaurantStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching restaurant status:", error);
      res.status(500).json({ error: "Failed to fetch restaurant status" });
    }
  });
  app2.patch("/api/owner/restaurant/status", async (req, res) => {
    try {
      const validatedData = insertRestaurantStatusSchema.partial().parse(req.body);
      const status = await storage.updateRestaurantStatus(validatedData);
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "UPDATE_RESTAURANT_STATUS",
        details: `Updated restaurant status: ${status.isOpen ? "Open" : "Closed"}`
      });
      res.json(status);
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  });
  app2.get("/api/admin/activity-logs", async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const filters = {};
      if (userId) filters.userId = userId;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      const logs = await storage.getActivityLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "../attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname, ".."),
  root: import.meta.dirname,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
