import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDishSchema, insertRestaurantStatusSchema, insertOrderSchema, insertActivityLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/owner/login", async (req, res) => {
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
        role: user.role,
      });
    } catch (error) {
      console.error("Error during owner login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/admin/login", async (req, res) => {
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
        role: user.role,
      });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/admin/dishes", async (req, res) => {
    try {
      const { category, isAvailable } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
      
      const dishes = await storage.getDishes(filters);
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });

  app.get("/api/admin/dishes/:id", async (req, res) => {
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

  app.post("/api/admin/dishes", async (req, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });

  app.patch("/api/admin/dishes/:id", async (req, res) => {
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

  app.patch("/api/admin/dishes/:id/toggle-availability", async (req, res) => {
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

  app.delete("/api/admin/dishes/:id", async (req, res) => {
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

  app.get("/api/admin/restaurant/status", async (req, res) => {
    try {
      const status = await storage.getRestaurantStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching restaurant status:", error);
      res.status(500).json({ error: "Failed to fetch restaurant status" });
    }
  });

  app.patch("/api/admin/restaurant/status", async (req, res) => {
    try {
      const validatedData = insertRestaurantStatusSchema.partial().parse(req.body);
      const status = await storage.updateRestaurantStatus(validatedData);
      res.json(status);
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  });

  app.get("/api/admin/analytics/revenue", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const summary = await storage.getRevenueSummary(start, end);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching revenue summary:", error);
      res.status(500).json({ error: "Failed to fetch revenue summary" });
    }
  });

  app.get("/api/admin/analytics/popular-dishes", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const popularDishes = await storage.getPopularDishes(limit);
      res.json(popularDishes);
    } catch (error) {
      console.error("Error fetching popular dishes:", error);
      res.status(500).json({ error: "Failed to fetch popular dishes" });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/admin/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
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

  app.get("/api/owner/dishes", async (req, res) => {
    try {
      const { category, isAvailable } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
      
      const dishes = await storage.getDishes(filters);
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });

  app.post("/api/owner/dishes", async (req, res) => {
    try {
      const validatedData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(validatedData);
      
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "CREATE_DISH",
        details: `Created dish: ${dish.name}`,
      });
      
      res.status(201).json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });

  app.patch("/api/owner/dishes/:id", async (req, res) => {
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
        details: `Updated dish: ${dish.name}`,
      });
      
      res.json(dish);
    } catch (error) {
      console.error("Error updating dish:", error);
      res.status(400).json({ error: "Invalid dish data" });
    }
  });

  app.patch("/api/owner/dishes/:id/toggle-availability", async (req, res) => {
    try {
      const dish = await storage.toggleDishAvailability(req.params.id);
      if (!dish) {
        return res.status(404).json({ error: "Dish not found" });
      }
      
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "TOGGLE_DISH_AVAILABILITY",
        details: `Toggled availability for dish: ${dish.name} to ${dish.isAvailable ? 'available' : 'unavailable'}`,
      });
      
      res.json(dish);
    } catch (error) {
      console.error("Error toggling dish availability:", error);
      res.status(500).json({ error: "Failed to toggle dish availability" });
    }
  });

  app.delete("/api/owner/dishes/:id", async (req, res) => {
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
        details: `Deleted dish: ${dish?.name || req.params.id}`,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ error: "Failed to delete dish" });
    }
  });

  app.get("/api/owner/orders", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const orders = await storage.getOrders(filters);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/owner/orders/:id/status", async (req, res) => {
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
        details: `Updated order ${order.id} status to ${status}`,
      });
      
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  app.get("/api/owner/restaurant/status", async (req, res) => {
    try {
      const status = await storage.getRestaurantStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching restaurant status:", error);
      res.status(500).json({ error: "Failed to fetch restaurant status" });
    }
  });

  app.patch("/api/owner/restaurant/status", async (req, res) => {
    try {
      const validatedData = insertRestaurantStatusSchema.partial().parse(req.body);
      const status = await storage.updateRestaurantStatus(validatedData);
      
      await storage.createActivityLog({
        userId: req.body.userId || "owner-1",
        username: req.body.username || "owner",
        action: "UPDATE_RESTAURANT_STATUS",
        details: `Updated restaurant status: ${status.isOpen ? 'Open' : 'Closed'}`,
      });
      
      res.json(status);
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  });

  app.get("/api/admin/activity-logs", async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (userId) filters.userId = userId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const logs = await storage.getActivityLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
