import { 
  type User, 
  type InsertUser,
  type Dish,
  type InsertDish,
  type Order,
  type InsertOrder,
  type RestaurantStatus,
  type InsertRestaurantStatus,
  type RevenueSummary,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDishes(filters?: { category?: string; isAvailable?: boolean }): Promise<Dish[]>;
  getDish(id: string): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: string, dish: Partial<InsertDish>): Promise<Dish | undefined>;
  toggleDishAvailability(id: string): Promise<Dish | undefined>;
  deleteDish(id: string): Promise<boolean>;

  getOrders(filters?: { startDate?: Date; endDate?: Date }): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  getActivityLogs(filters?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  getRestaurantStatus(): Promise<RestaurantStatus>;
  updateRestaurantStatus(status: Partial<InsertRestaurantStatus>): Promise<RestaurantStatus>;

  getRevenueSummary(startDate?: Date, endDate?: Date): Promise<RevenueSummary>;
  getPopularDishes(limit?: number): Promise<RevenueSummary['popularDishes']>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private dishes: Map<string, Dish>;
  private orders: Map<string, Order>;
  private activityLogs: Map<string, ActivityLog>;
  private restaurantStatusData: RestaurantStatus;

  constructor() {
    this.users = new Map();
    this.dishes = new Map();
    this.orders = new Map();
    this.activityLogs = new Map();
    this.restaurantStatusData = {
      id: randomUUID(),
      isOpen: true,
      nextOpeningNote: null,
    };

    this.seedData();
  }

  private seedData() {
    const testUsers = [
      {
        username: "owner",
        password: "owner123",
        role: "restaurant_owner",
        email: "owner@restaurant.com",
        restaurantName: "My Restaurant",
      },
      {
        username: "admin",
        password: "admin123",
        role: "admin",
        email: "admin@foodfast.com",
        restaurantName: null,
      },
    ];

    testUsers.forEach(user => {
      const id = randomUUID();
      this.users.set(id, {
        id,
        username: user.username,
        password: user.password,
        role: user.role,
        email: user.email,
        restaurantName: user.restaurantName,
      });
    });

    // Xóa dữ liệu mẫu - sẽ dùng dữ liệu thật từ backend
    const sampleDishes: Array<Omit<Dish, 'id' | 'createdAt'>> = [];

    sampleDishes.forEach(dish => {
      const id = randomUUID();
      this.dishes.set(id, {
        ...dish,
        id,
        createdAt: new Date(),
      });
    });

    // Xóa dữ liệu orders mẫu - sẽ dùng dữ liệu thật từ backend
    const now = new Date();
    const dishIds = Array.from(this.dishes.keys());
    const sampleOrders: Array<Omit<Order, 'id' | 'orderedAt' | 'updatedAt'>> = [];

    sampleOrders.forEach((order, index) => {
      const id = randomUUID();
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - index);
      this.orders.set(id, {
        ...order,
        id,
        orderedAt: orderDate,
        updatedAt: orderDate,
      });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // @ts-ignore - InsertUser type schema works at runtime
    const user: User = {
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
      restaurantName: insertUser.restaurantName ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async getDishes(filters?: { category?: string; isAvailable?: boolean }): Promise<Dish[]> {
    let dishes = Array.from(this.dishes.values());
    
    if (filters?.category) {
      dishes = dishes.filter(dish => dish.category === filters.category);
    }
    
    if (filters?.isAvailable !== undefined) {
      dishes = dishes.filter(dish => dish.isAvailable === filters.isAvailable);
    }
    
    return dishes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDish(id: string): Promise<Dish | undefined> {
    return this.dishes.get(id);
  }

  async createDish(insertDish: InsertDish): Promise<Dish> {
    const id = randomUUID();
    const dish: Dish = {
      ...insertDish,
      id,
      createdAt: new Date(),
      isAvailable: insertDish.isAvailable ?? true,
      imageUrl: insertDish.imageUrl ?? null,
    };
    this.dishes.set(id, dish);
    return dish;
  }

  async updateDish(id: string, updates: Partial<InsertDish>): Promise<Dish | undefined> {
    const dish = this.dishes.get(id);
    if (!dish) return undefined;
    
    const updatedDish: Dish = {
      ...dish,
      ...updates,
    };
    this.dishes.set(id, updatedDish);
    return updatedDish;
  }

  async toggleDishAvailability(id: string): Promise<Dish | undefined> {
    const dish = this.dishes.get(id);
    if (!dish) return undefined;
    
    const updatedDish: Dish = {
      ...dish,
      isAvailable: !dish.isAvailable,
    };
    this.dishes.set(id, updatedDish);
    return updatedDish;
  }

  async deleteDish(id: string): Promise<boolean> {
    return this.dishes.delete(id);
  }

  async getOrders(filters?: { startDate?: Date; endDate?: Date }): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    
    if (filters?.startDate) {
      orders = orders.filter(order => order.orderedAt >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      orders = orders.filter(order => order.orderedAt <= filters.endDate!);
    }
    
    return orders.sort((a, b) => b.orderedAt.getTime() - a.orderedAt.getTime());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const now = new Date();
    const order: Order = {
      id,
      dishId: insertOrder.dishId,
      dishName: insertOrder.dishName,
      quantity: insertOrder.quantity,
      totalAmount: insertOrder.totalAmount,
      status: insertOrder.status ?? "pending",
      customerName: insertOrder.customerName ?? null,
      customerAddress: insertOrder.customerAddress ?? null,
      orderedAt: now,
      updatedAt: now,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getActivityLogs(filters?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values());
    
    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters?.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      id,
      userId: insertLog.userId,
      username: insertLog.username,
      action: insertLog.action,
      details: insertLog.details ?? null,
      timestamp: new Date(),
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getRestaurantStatus(): Promise<RestaurantStatus> {
    return this.restaurantStatusData;
  }

  async updateRestaurantStatus(status: Partial<InsertRestaurantStatus>): Promise<RestaurantStatus> {
    this.restaurantStatusData = {
      ...this.restaurantStatusData,
      ...status,
    };
    return this.restaurantStatusData;
  }

  async getRevenueSummary(startDate?: Date, endDate?: Date): Promise<RevenueSummary> {
    const orders = await this.getOrders({ startDate, endDate });
    
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAmount);
    }, 0);
    
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    const dishRevenue = new Map<string, { dishId: string; dishName: string; orderCount: number; totalRevenue: number }>();
    orders.forEach(order => {
      const existing = dishRevenue.get(order.dishId) || {
        dishId: order.dishId,
        dishName: order.dishName,
        orderCount: 0,
        totalRevenue: 0,
      };
      existing.orderCount += 1;
      existing.totalRevenue += parseFloat(order.totalAmount);
      dishRevenue.set(order.dishId, existing);
    });
    
    const popularDishes = Array.from(dishRevenue.values())
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)
      .map(dish => ({
        ...dish,
        totalRevenue: dish.totalRevenue.toFixed(2),
      }));
    
    const revenueByDateMap = new Map<string, { revenue: number; orderCount: number }>();
    orders.forEach(order => {
      const dateKey = order.orderedAt.toISOString().split('T')[0];
      const existing = revenueByDateMap.get(dateKey) || { revenue: 0, orderCount: 0 };
      existing.revenue += parseFloat(order.totalAmount);
      existing.orderCount += 1;
      revenueByDateMap.set(dateKey, existing);
    });
    
    const revenueByDate = Array.from(revenueByDateMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue.toFixed(2),
        orderCount: data.orderCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: orders.length,
      averageOrderValue: averageOrderValue.toFixed(2),
      popularDishes,
      revenueByDate,
    };
  }

  async getPopularDishes(limit: number = 5): Promise<RevenueSummary['popularDishes']> {
    const summary = await this.getRevenueSummary();
    return summary.popularDishes.slice(0, limit);
  }
}

export const storage = new MemStorage();
