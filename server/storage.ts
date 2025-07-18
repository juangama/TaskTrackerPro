import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  accounts, type Account, type InsertAccount,
  transactions, type Transaction, type InsertTransaction,
  telegramConfig, type TelegramConfig, type InsertTelegramConfig
} from "@shared/schema";
import { db, testConnection } from "./db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Accounts
  getAllAccounts(): Promise<Account[]>;
  getAccountById(id: number): Promise<Account | undefined>;
  getAccountsByUserId(userId: number): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Transactions
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;

  // Telegram Config
  getTelegramConfig(): Promise<TelegramConfig | undefined>;
  createTelegramConfig(config: InsertTelegramConfig): Promise<TelegramConfig>;
  updateTelegramConfig(id: number, config: Partial<InsertTelegramConfig>): Promise<TelegramConfig | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private accounts: Map<number, Account>;
  private transactions: Map<number, Transaction>;
  private telegramConfigs: Map<number, TelegramConfig>;
  private currentUserId: number;
  private currentCategoryId: number;
  private currentAccountId: number;
  private currentTransactionId: number;
  private currentConfigId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.accounts = new Map();
    this.transactions = new Map();
    this.telegramConfigs = new Map();
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentAccountId = 1;
    this.currentTransactionId = 1;
    this.currentConfigId = 1;

    // Initialize with default data
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Create admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "admin@empresa.com",
      password: "demo123", // In real app, this should be hashed
      fullName: "Admin Usuario",
      role: "admin",
      telegramUserId: null,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create default categories
    const defaultCategories = [
      { name: "Suministros", color: "#1976D2", type: "expense" },
      { name: "Transporte", color: "#388E3C", type: "expense" },
      { name: "Servicios", color: "#F57C00", type: "expense" },
      { name: "Marketing", color: "#D32F2F", type: "expense" },
      { name: "Alimentación", color: "#7B1FA2", type: "expense" },
      { name: "Ventas", color: "#388E3C", type: "income" },
      { name: "Consultoría", color: "#1976D2", type: "income" },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        color: cat.color,
        type: cat.type,
        createdAt: new Date(),
      };
      this.categories.set(category.id, category);
    });

    // Create default accounts
    const checkingAccount: Account = {
      id: this.currentAccountId++,
      name: "Cuenta Corriente Principal",
      type: "checking",
      balance: "87450.30",
      bankName: "Banco Nacional",
      accountNumber: "****1234",
      userId: adminUser.id,
      createdAt: new Date(),
    };
    this.accounts.set(checkingAccount.id, checkingAccount);

    const savingsAccount: Account = {
      id: this.currentAccountId++,
      name: "Cuenta de Ahorros",
      type: "savings",
      balance: "25680.75",
      bankName: "Banco Regional",
      accountNumber: "****5678",
      userId: adminUser.id,
      createdAt: new Date(),
    };
    this.accounts.set(savingsAccount.id, savingsAccount);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "employee",
      telegramUserId: insertUser.telegramUserId || null,
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = { 
      ...insertCategory,
      color: insertCategory.color || "#1976D2",
      id, 
      createdAt: new Date() 
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Accounts
  async getAllAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(account => account.userId === userId);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const account: Account = { 
      ...insertAccount,
      userId: insertAccount.userId || null,
      balance: insertAccount.balance || "0.00",
      bankName: insertAccount.bankName || null,
      accountNumber: insertAccount.accountNumber || null,
      id, 
      createdAt: new Date() 
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...updates };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate!);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction,
      userId: insertTransaction.userId || null,
      categoryId: insertTransaction.categoryId || null,
      accountId: insertTransaction.accountId || null,
      paymentMethod: insertTransaction.paymentMethod || null,
      receiptUrl: insertTransaction.receiptUrl || null,
      notes: insertTransaction.notes || null,
      thirdParty: insertTransaction.thirdParty || null,
      id, 
      createdAt: new Date(),
      transactionDate: insertTransaction.transactionDate || new Date()
    };
    this.transactions.set(id, transaction);
    
    // Update account balance
    if (transaction.accountId) {
      const account = this.accounts.get(transaction.accountId);
      if (account) {
        const currentBalance = parseFloat(account.balance);
        const transactionAmount = parseFloat(transaction.amount);
        const newBalance = transaction.type === "income" 
          ? currentBalance + transactionAmount 
          : currentBalance - transactionAmount;
        
        this.accounts.set(transaction.accountId, {
          ...account,
          balance: newBalance.toFixed(2)
        });
      }
    }
    
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    
    // Reverse account balance change
    if (transaction.accountId) {
      const account = this.accounts.get(transaction.accountId);
      if (account) {
        const currentBalance = parseFloat(account.balance);
        const transactionAmount = parseFloat(transaction.amount);
        const newBalance = transaction.type === "income" 
          ? currentBalance - transactionAmount 
          : currentBalance + transactionAmount;
        
        this.accounts.set(transaction.accountId, {
          ...account,
          balance: newBalance.toFixed(2)
        });
      }
    }
    
    return this.transactions.delete(id);
  }

  // Telegram Config
  async getTelegramConfig(): Promise<TelegramConfig | undefined> {
    return Array.from(this.telegramConfigs.values())[0];
  }

  async createTelegramConfig(insertConfig: InsertTelegramConfig): Promise<TelegramConfig> {
    const id = this.currentConfigId++;
    const config: TelegramConfig = { 
      ...insertConfig,
      isActive: insertConfig.isActive || null,
      id, 
      createdAt: new Date() 
    };
    this.telegramConfigs.set(id, config);
    return config;
  }

  async updateTelegramConfig(id: number, updates: Partial<InsertTelegramConfig>): Promise<TelegramConfig | undefined> {
    const config = this.telegramConfigs.get(id);
    if (!config) return undefined;
    
    const updatedConfig = { ...config, ...updates };
    this.telegramConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUser:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error('Database error in updateUser:', error);
      throw error;
    }
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories);
    } catch (error) {
      console.error('Database error in getAllCategories:', error);
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category || undefined;
    } catch (error) {
      console.error('Database error in getCategoryById:', error);
      throw error;
    }
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    try {
      console.log("Storage: Creating category with data:", insertCategory);
      
      const [category] = await db
        .insert(categories)
        .values(insertCategory)
        .returning();
      
      console.log("Storage: Category created successfully:", category);
      return category;
    } catch (error) {
      console.error("Storage: Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      const [category] = await db
        .update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .returning();
      return category || undefined;
    } catch (error) {
      console.error('Database error in updateCategory:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(categories).where(eq(categories.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Database error in deleteCategory:', error);
      throw error;
    }
  }

  // Accounts
  async getAllAccounts(): Promise<Account[]> {
    try {
      return await db.select().from(accounts);
    } catch (error) {
      console.error('Database error in getAllAccounts:', error);
      throw error;
    }
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    try {
      const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
      return account || undefined;
    } catch (error) {
      console.error('Database error in getAccountById:', error);
      throw error;
    }
  }

  async getAccountsByUserId(userId: number): Promise<Account[]> {
    try {
      return await db.select().from(accounts).where(eq(accounts.userId, userId));
    } catch (error) {
      console.error('Database error in getAccountsByUserId:', error);
      throw error;
    }
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    console.log("Storage: Creating account with data:", insertAccount);
    
    try {
      const [account] = await db
        .insert(accounts)
        .values(insertAccount)
        .returning();
      
      console.log("Storage: Account created successfully:", account);
      return account;
    } catch (error) {
      console.error("Storage: Error creating account:", error);
      throw error;
    }
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    try {
      const [account] = await db
        .update(accounts)
        .set(updates)
        .where(eq(accounts.id, id))
        .returning();
      return account || undefined;
    } catch (error) {
      console.error('Database error in updateAccount:', error);
      throw error;
    }
  }

  async deleteAccount(id: number): Promise<boolean> {
    try {
      const result = await db.delete(accounts).where(eq(accounts.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Database error in deleteAccount:', error);
      throw error;
    }
  }

  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions).orderBy(sql`${transactions.createdAt} DESC`);
    } catch (error) {
      console.error('Database error in getAllTransactions:', error);
      throw error;
    }
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    try {
      const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
      return transaction || undefined;
    } catch (error) {
      console.error('Database error in getTransactionById:', error);
      throw error;
    }
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(sql`${transactions.createdAt} DESC`);
    } catch (error) {
      console.error('Database error in getTransactionsByUserId:', error);
      throw error;
    }
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions)
        .where(and(
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate)
        ));
    } catch (error) {
      console.error('Database error in getTransactionsByDateRange:', error);
      throw error;
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    try {
      console.log("Storage: Creating transaction with data:", insertTransaction);
      
      // Validar que la fecha sea válida antes de insertar
      if (insertTransaction.transactionDate) {
        const date = new Date(insertTransaction.transactionDate);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid transaction date");
        }
      }
      
      const [transaction] = await db
        .insert(transactions)
        .values(insertTransaction)
        .returning();
      
      console.log("Storage: Transaction created successfully:", transaction);
      
      // Update account balance
      if (transaction.accountId) {
        const account = await this.getAccountById(transaction.accountId);
        if (account) {
          const currentBalance = parseFloat(account.balance);
          const transactionAmount = parseFloat(transaction.amount);
          const newBalance = transaction.type === "income" 
            ? currentBalance + transactionAmount 
            : currentBalance - transactionAmount;
          
          await this.updateAccount(transaction.accountId, {
            balance: newBalance.toFixed(2)
          });
        }
      }
      
      return transaction;
    } catch (error) {
      console.error('Database error in createTransaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      console.log("Storage: Updating transaction with data:", updates);
      
      // Validar que la fecha sea válida antes de actualizar
      if (updates.transactionDate) {
        const date = new Date(updates.transactionDate);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid transaction date");
        }
      }
      
      const [transaction] = await db
        .update(transactions)
        .set(updates)
        .where(eq(transactions.id, id))
        .returning();
      
      console.log("Storage: Transaction updated successfully:", transaction);
      return transaction || undefined;
    } catch (error) {
      console.error('Database error in updateTransaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const transaction = await this.getTransactionById(id);
      if (!transaction) return false;
      
      // Reverse account balance change
      if (transaction.accountId) {
        const account = await this.getAccountById(transaction.accountId);
        if (account) {
          const currentBalance = parseFloat(account.balance);
          const transactionAmount = parseFloat(transaction.amount);
          const newBalance = transaction.type === "income" 
            ? currentBalance - transactionAmount 
            : currentBalance + transactionAmount;
          
          await this.updateAccount(transaction.accountId, {
            balance: newBalance.toFixed(2)
          });
        }
      }
      
      const result = await db.delete(transactions).where(eq(transactions.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Database error in deleteTransaction:', error);
      throw error;
    }
  }

  // Telegram Config
  async getTelegramConfig(): Promise<TelegramConfig | undefined> {
    try {
      const [config] = await db.select().from(telegramConfig).limit(1);
      return config || undefined;
    } catch (error) {
      console.error('Database error in getTelegramConfig:', error);
      throw error;
    }
  }

  async createTelegramConfig(insertConfig: InsertTelegramConfig): Promise<TelegramConfig> {
    try {
      const [config] = await db
        .insert(telegramConfig)
        .values(insertConfig)
        .returning();
      return config;
    } catch (error) {
      console.error('Database error in createTelegramConfig:', error);
      throw error;
    }
  }

  async updateTelegramConfig(id: number, updates: Partial<InsertTelegramConfig>): Promise<TelegramConfig | undefined> {
    try {
      const [config] = await db
        .update(telegramConfig)
        .set(updates)
        .where(eq(telegramConfig.id, id))
        .returning();
      return config || undefined;
    } catch (error) {
      console.error('Database error in updateTelegramConfig:', error);
      throw error;
    }
  }
}

// Create a storage instance with fallback
let storageInstance: IStorage = new MemStorage(); // Default to in-memory storage

const initializeStorage = async () => {
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (isConnected) {
      storageInstance = new DatabaseStorage();
      console.log('Using database storage');
    } else {
      throw new Error('Database connection test failed');
    }
  } catch (error) {
    console.warn('Database connection failed, falling back to in-memory storage:', error);
    storageInstance = new MemStorage();
  }
};

// Initialize storage immediately
initializeStorage();

export const storage = storageInstance;
