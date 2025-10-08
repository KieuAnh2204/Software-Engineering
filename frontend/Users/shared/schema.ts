// @ts-ignore - Drizzle ORM types issue with TypeScript, works fine at runtime
import { pgTable, text, varchar, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
// @ts-ignore - Drizzle ORM types issue with TypeScript, works fine at runtime
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  email: text("email"),
  restaurantName: text("restaurant_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  restaurantName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const dishes = pgTable("dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertDishSchema = createInsertSchema(dishes, {
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dishId: varchar("dish_id").notNull(),
  dishName: text("dish_name").notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  orderedAt: timestamp("ordered_at").notNull().default(sql`now()`),
  status: text("status").notNull().default("pending"),
  customerName: text("customer_name"),
  customerAddress: text("customer_address"),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertOrderSchema = createInsertSchema(orders, {
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number"),
}).omit({
  id: true,
  orderedAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const restaurantStatus = pgTable("restaurant_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isOpen: boolean("is_open").notNull().default(true),
  nextOpeningNote: text("next_opening_note"),
});

export const insertRestaurantStatusSchema = createInsertSchema(restaurantStatus).omit({
  id: true,
});

export type InsertRestaurantStatus = z.infer<typeof insertRestaurantStatusSchema>;
export type RestaurantStatus = typeof restaurantStatus.$inferSelect;

export const revenueSummarySchema = z.object({
  totalRevenue: z.string(),
  totalOrders: z.number(),
  averageOrderValue: z.string(),
  popularDishes: z.array(z.object({
    dishId: z.string(),
    dishName: z.string(),
    orderCount: z.number(),
    totalRevenue: z.string(),
  })),
  revenueByDate: z.array(z.object({
    date: z.string(),
    revenue: z.string(),
    orderCount: z.number(),
  })),
});

export type RevenueSummary = z.infer<typeof revenueSummarySchema>;

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
