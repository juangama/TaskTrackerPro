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

// Account creation schema (without userId, it will be added automatically)
const createAccountSchema = z.object({
  name: z.string().min(1, "El nombre de la cuenta es requerido"),
  type: z.string().min(1, "El tipo de cuenta es requerido"),
  balance: z.union([z.string(), z.number()]).transform(val => String(val)),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

// Transaction creation schema with proper validation
const createTransactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.string().min(1, "El monto es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  thirdParty: z.string().optional(),
  categoryId: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())),
  accountId: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1, "La fecha de transacción es requerida").transform((val) => {
    // Asegurar que la fecha esté en formato ISO
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error("Fecha inválida");
    }
    return val;
  }),
});

// Transaction update schema (all fields optional)
const updateTransactionSchema = z.object({
  type: z.enum(["expense", "income"]).optional(),
  amount: z.string().min(1, "El monto es requerido").optional(),
  description: z.string().min(1, "La descripción es requerida").optional(),
  thirdParty: z.string().optional(),
  categoryId: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())).optional(),
  accountId: z.union([z.string(), z.number()]).transform(val => parseInt(val.toString())).optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  transactionDate: z.string().min(1, "La fecha de transacción es requerida").transform((val) => {
    // Asegurar que la fecha esté en formato ISO
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error("Fecha inválida");
    }
    return val;
  }).optional(),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

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

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, fullName } = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        username,
        email,
        password, // In production, this should be hashed
        fullName,
        role: "employee", // Default role for new users
      });

      // Auto-login after registration
      req.session!.userId = newUser.id;
      
      res.status(201).json({ 
        user: { 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email, 
          fullName: newUser.fullName, 
          role: newUser.role 
        } 
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Error de validación", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      res.status(500).json({ 
        message: "Error interno del servidor. Por favor, intenta de nuevo." 
      });
    }
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
      console.log("=== CREATE ACCOUNT START ===");
      console.log("Request body:", req.body);
      console.log("User ID:", req.userId);
      
      // Validate the incoming data
      const validatedData = createAccountSchema.parse(req.body);
      console.log("Validated account data:", validatedData);
      
      // Create the account with userId
      const accountData = {
        ...validatedData,
        userId: req.userId!,
        balance: validatedData.balance, // Keep as string, storage will handle conversion
      };
      
      console.log("Final account data:", accountData);
      
      const account = await storage.createAccount(accountData);
      console.log("Account created successfully:", account);
      res.status(201).json(account);
    } catch (error: unknown) {
      console.error("=== CREATE ACCOUNT ERROR ===");
      console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Full error:", error);
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ 
          message: "Error de validación en los datos de la cuenta", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      res.status(500).json({ 
        message: "Error interno del servidor al crear la cuenta",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
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
      console.log("Received transaction data:", req.body);
      
      // Validate the incoming data with our custom schema
      const validatedData = createTransactionSchema.parse(req.body);
      console.log("Validated transaction data:", validatedData);
      
      // Transform the data for the database
      const transactionData = {
        ...validatedData,
        userId: req.userId!,
        transactionDate: new Date(validatedData.transactionDate + 'T12:00:00.000Z'), // Usar mediodía para evitar problemas de zona horaria
      };
      
      // Validar que la fecha sea válida
      if (isNaN(transactionData.transactionDate.getTime())) {
        return res.status(400).json({ 
          message: "Fecha inválida", 
          error: "La fecha proporcionada no es válida" 
        });
      }
      
      console.log("Final transaction data:", transactionData);
      console.log("Transaction date type:", typeof transactionData.transactionDate);
      console.log("Transaction date value:", transactionData.transactionDate);
      const transaction = await storage.createTransaction(transactionData);
      console.log("Created transaction:", transaction);
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Transaction creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Error de validación", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      res.status(400).json({ message: "Invalid transaction data", error: error.message });
    }
  });

  app.put("/api/transactions/:id", requireAuth, async (req, res) => {
    try {
      console.log("Received update data:", req.body);
      
      const id = parseInt(req.params.id);
      const validatedUpdates = updateTransactionSchema.parse(req.body);
      console.log("Validated update data:", validatedUpdates);
      
      // Transform the data for the database
      const updateData: any = { ...validatedUpdates };
      if (validatedUpdates.transactionDate) {
        const transactionDate = new Date(validatedUpdates.transactionDate + 'T12:00:00.000Z');
        
        // Validar que la fecha sea válida
        if (isNaN(transactionDate.getTime())) {
          return res.status(400).json({ 
            message: "Fecha inválida", 
            error: "La fecha proporcionada no es válida" 
          });
        }
        
        updateData.transactionDate = transactionDate;
      }
      
      console.log("Final update data:", updateData);
      const transaction = await storage.updateTransaction(id, updateData);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      console.log("Updated transaction:", transaction);
      res.json(transaction);
    } catch (error: any) {
      console.error("Transaction update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Error de validación", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      res.status(400).json({ message: "Invalid transaction data", error: error.message });
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
      .filter(t => t.type === "income" && t.thirdParty !== "Transferencia" && !t.description?.includes("Pago de préstamo"))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === "expense" && t.thirdParty !== "Transferencia" && !t.description?.includes("Pago de préstamo"))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Previous month calculations for comparison
    const prevMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const prevMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    
    const prevMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate!);
      return transactionDate >= prevMonthStart && transactionDate <= prevMonthEnd;
    });
    
    const prevMonthIncome = prevMonthTransactions
      .filter(t => t.type === "income" && t.thirdParty !== "Transferencia" && !t.description?.includes("Pago de préstamo"))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const prevMonthExpenses = prevMonthTransactions
      .filter(t => t.type === "expense" && t.thirdParty !== "Transferencia" && !t.description?.includes("Pago de préstamo"))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calculate percentage changes
    const incomeChange = prevMonthIncome > 0 ? ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;
    const expenseChange = prevMonthExpenses > 0 ? ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0;
    
    const pendingLoans = accounts
      .filter(a => a.type === "loan" || a.type === "credit")
      .reduce((sum, account) => sum + Math.max(0, parseFloat(account.balance)), 0);
    
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
    
    const expenses = transactions.filter(t => t.type === "expense" && t.thirdParty !== "Transferencia" && !t.description?.includes("Pago de préstamo"));
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
      if (transaction.type === "income" && transaction.thirdParty !== "Transferencia" && !transaction.description?.includes("Pago de préstamo")) {
        monthlyData[monthKey].income += amount;
      } else if (transaction.type === "expense" && transaction.thirdParty !== "Transferencia" && !transaction.description?.includes("Pago de préstamo")) {
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
