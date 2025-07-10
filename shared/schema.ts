import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("employee"), // "admin" or "employee"
  telegramUserId: text("telegram_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#1976D2"),
  type: text("type").notNull(), // "expense" or "income"
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "checking", "savings", "loan"
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "expense" or "income"
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  accountId: integer("account_id").references(() => accounts.id),
  paymentMethod: text("payment_method"), // "cash", "credit_card", "debit_card", "transfer"
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  transactionDate: timestamp("transaction_date").defaultNow(),
});

export const telegramConfig = pgTable("telegram_config", {
  id: serial("id").primaryKey(),
  botToken: text("bot_token").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTelegramConfigSchema = createInsertSchema(telegramConfig).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TelegramConfig = typeof telegramConfig.$inferSelect;
export type InsertTelegramConfig = z.infer<typeof insertTelegramConfigSchema>;

// Additional schemas for auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
