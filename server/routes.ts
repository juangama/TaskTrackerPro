import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertAccountSchema, 
  insertTransactionSchema,
  insertTelegramConfigSchema,
  loginSchema 
} from "@shared/schema";
import { z } from "zod";

// Extend Request interface to include session and userId
declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      userId?: number;
      destroy: (callback: () => void) => void;
    };
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.userId = userId;
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session!.userId = user.id;
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          fullName: user.fullName, 
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session!.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        fullName: user.fullName, 
        role: user.role 
      } 
    });
  });

  // Categories routes
  app.get("/api/categories", requireAuth, async (req, res) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, updates);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteCategory(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json({ message: "Category deleted successfully" });
  });

  // Accounts routes
  app.get("/api/accounts", requireAuth, async (req, res) => {
    const accounts = await storage.getAccountsByUserId(req.userId!);
    res.json(accounts);
  });

  app.post("/api/accounts", requireAuth, async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse({ ...req.body, userId: req.userId! });
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });

  app.put("/api/accounts/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, updates);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });

  app.delete("/api/accounts/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteAccount(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Account not found" });
    }
    
    res.json({ message: "Account deleted successfully" });
  });

  // Transactions routes
  app.get("/api/transactions", requireAuth, async (req, res) => {
    const { startDate, endDate } = req.query;
    
    let transactions;
    if (startDate && endDate) {
      transactions = await storage.getTransactionsByDateRange(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
    } else {
      transactions = await storage.getTransactionsByUserId(req.userId!);
    }
    
    // Include category and account details
    const categories = await storage.getAllCategories();
    const accounts = await storage.getAccountsByUserId(req.userId!);
    
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    const accountsMap = new Map(accounts.map(a => [a.id, a]));
    
    const enrichedTransactions = transactions.map(t => ({
      ...t,
      category: t.categoryId ? categoriesMap.get(t.categoryId) : null,
      account: t.accountId ? accountsMap.get(t.accountId) : null,
    }));
    
    res.json(enrichedTransactions);
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse({ ...req.body, userId: req.userId! });
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, updates);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteTransaction(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json({ message: "Transaction deleted successfully" });
  });

  // Analytics routes
  app.get("/api/analytics/summary", requireAuth, async (req, res) => {
    const transactions = await storage.getTransactionsByUserId(req.userId!);
    const accounts = await storage.getAccountsByUserId(req.userId!);
    
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);
    
    // Current month calculations
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate!);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Previous month calculations for comparison
    const prevMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const prevMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    
    const prevMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate!);
      return transactionDate >= prevMonthStart && transactionDate <= prevMonthEnd;
    });
    
    const prevMonthIncome = prevMonthTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const prevMonthExpenses = prevMonthTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calculate percentage changes
    const incomeChange = prevMonthIncome > 0 ? ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;
    const expenseChange = prevMonthExpenses > 0 ? ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0;
    
    const pendingLoans = accounts
      .filter(a => a.type === "loan")
      .reduce((sum, account) => sum + Math.abs(parseFloat(account.balance)), 0);
    
    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      pendingLoans,
      netCashFlow: monthlyIncome - monthlyExpenses,
      incomeChangePercent: incomeChange,
      expenseChangePercent: expenseChange,
      prevMonthIncome,
      prevMonthExpenses
    });
  });

  app.get("/api/analytics/expenses-by-category", requireAuth, async (req, res) => {
    const transactions = await storage.getTransactionsByUserId(req.userId!);
    const categories = await storage.getAllCategories();
    
    const expenses = transactions.filter(t => t.type === "expense");
    const categoriesMap = new Map(categories.map(c => [c.id, c]));
    
    const expensesByCategory = expenses.reduce((acc, transaction) => {
      const category = transaction.categoryId ? categoriesMap.get(transaction.categoryId) : null;
      const categoryName = category?.name || "Sin categoría";
      
      acc[categoryName] = (acc[categoryName] || 0) + parseFloat(transaction.amount);
      return acc;
    }, {} as Record<string, number>);
    
    res.json(expensesByCategory);
  });

  app.get("/api/analytics/monthly-trends", requireAuth, async (req, res) => {
    const transactions = await storage.getTransactionsByUserId(req.userId!);
    
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate!);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      const amount = parseFloat(transaction.amount);
      if (transaction.type === "income") {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);
    
    const result = last6Months.map(month => ({
      month,
      income: monthlyData[month].income,
      expenses: monthlyData[month].expenses,
      net: monthlyData[month].income - monthlyData[month].expenses
    }));
    
    res.json(result);
  });

  // Telegram config routes
  app.get("/api/telegram/config", requireAuth, async (req, res) => {
    const config = await storage.getTelegramConfig();
    res.json(config || { botToken: "", isActive: false });
  });

  app.post("/api/telegram/config", requireAuth, async (req, res) => {
    try {
      const configData = insertTelegramConfigSchema.parse(req.body);
      const config = await storage.createTelegramConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid telegram config data" });
    }
  });

  app.put("/api/telegram/config/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertTelegramConfigSchema.partial().parse(req.body);
      const config = await storage.updateTelegramConfig(id, updates);
      
      if (!config) {
        return res.status(404).json({ message: "Telegram config not found" });
      }
      
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Invalid telegram config data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
