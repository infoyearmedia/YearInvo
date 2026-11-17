import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUniqueSku, generateUniqueBarcode } from '../utils/scanner';
import { compressImage } from '../utils/imageCompressor';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import {
  getSupabaseSubscriptionRequests,
  createSupabaseSubscriptionRequest,
  updateSupabaseSubscriptionRequestStatus,
  updateSupabaseUserPlan,
  getSupabaseUser,
  getSupabaseUserByEmail,
  getSupabaseAllUsers,
  updateSupabaseUserStatus,
  deleteSupabaseUserRow,
  upsertSupabaseUser,
} from '../services/supabaseDbService';
import {
  doc,
  setDoc,
  addDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import {
  UserProfile,
  Product,
  Category,
  Brand,
  Customer,
  Supplier,
  Expense,
  Sale,
  Purchase,
  AppNotification,
  ActivityLog,
  BusinessSettings,
  Language,
  ThemeMode,
  StockAdjustment,
  DueCollection,
  CartItem,
  SubscriptionRequest,
  SubscriptionPlan,
  BillingCycle,
  UserRole,
  OwnerPaymentSettings,
  BangladeshPaymentConfig,
  DashboardPreferences,
  defaultDashboardPreferences,
  TeamMember,
  Employee,
  PayrollPayment,
  SalaryAdjustment,
  AuditLogEntry,
  CustomerLoyaltySettings,
  EmployeeDevice,
  Investment,
  CapitalWithdrawal,
  OnlineOrder,
  OnlineOrderItem,
  OnlineCustomer,
  OnlineBusinessSettings,
  OnlineOrderStatus,
  DeliveryPayer,
  defaultOnlineBusinessSettings,
  isOnlineBusinessEligible,
  OnlineProduct,
  PersonalContact,
  PersonalTransaction,
  PersonalTransactionType,
} from '../types';
import {
  getCurrentDeviceInfo,
  getOrCreateDeviceId,
  setLocalDeviceName,
} from '../utils/deviceSecurity';
import {
  saveUserCloudCollection,
  saveUserCloudCollectionsBatch,
  subscribeToUserBusinessData,
} from '../services/cloudSyncService';
import { offlineDb } from '../services/offlineDb';
import { syncQueueService } from '../services/syncQueueService';
import {
  initialCategories,
  initialBrands,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialExpenses,
  initialSales,
  initialPurchases,
  initialNotifications,
  initialActivityLogs,
  initialInvestments,
  initialCapitalWithdrawals,
} from '../data/mockData';
import {
  demoCategories,
  demoBrands,
  demoProducts,
  demoCustomers,
  demoSuppliers,
  demoSales,
  demoPurchases,
  demoExpenses,
} from '../data/demoData';
import { translations } from '../i18n/translations';
import { isRtlLanguage, getDefaultLanguageForCountry, SUPPORTED_LANGUAGES } from '../i18n/languages';
import {
  formatNumber as formatNumberHelper,
  formatCurrency as formatCurrencyHelper,
  formatDate as formatDateHelper,
  formatMoney as formatMoneyHelper,
} from '../utils/format';
import {
  useExchangeRates,
  convertCurrency as convertCurrencyHelper,
  getExchangeRate as getExchangeRateHelper,
  normalizeCurrencyCode,
  getCurrencySymbol,
  FormatMoneyOptions,
} from '../services/currencyService';
import { isBangladeshCountry, getPlanLimits, PLAN_LIMITS } from '../config/pricing';
import { generateSystemNotifications } from '../services/notificationService';

export const normalizePlan = (rawPlan: any): SubscriptionPlan => {
  if (!rawPlan) return 'Free';
  const str = String(rawPlan).trim();
  if (/^lifetime$/i.test(str)) return 'Lifetime';
  if (/^pro$/i.test(str)) return 'Pro';
  if (/^premium$/i.test(str)) return 'Premium';
  if (/^business$/i.test(str)) return 'Business';
  if (/^tier2$/i.test(str)) return 'Tier2';
  if (/^starter$/i.test(str)) return 'Starter';
  if (/^free$/i.test(str)) return 'Free';
  return (str as SubscriptionPlan) || 'Free';
};

export const calculateSubscriptionExpiry = (startDate: Date | string, billingPeriod: BillingCycle | string): string => {
  const start = new Date(startDate);
  const expiry = new Date(start);
  if (billingPeriod === 'five_year') {
    expiry.setFullYear(expiry.getFullYear() + 5);
  } else if (billingPeriod === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else if (billingPeriod === 'six_months' || billingPeriod === 'six_month') {
    expiry.setMonth(expiry.getMonth() + 6);
  } else {
    // monthly
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry.toISOString();
};

interface AppContextType {
  // Auth & Profile
  user: UserProfile | null;
  isEmailVerified: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }>;
  signup: (data: Partial<UserProfile> & { password?: string }) => Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }>;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  sendLoginCode: (email: string) => Promise<{ success: boolean; message?: string }>;
  verifyLoginCode: (email: string, token: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  // Demo Mode (guest preview with sample data, no account, no cloud writes)
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  updateUser: (data: Partial<UserProfile>) => void;
  uploadProfilePhoto: (photoDataUrl: string) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;

  // Platform Owner & User Management
  allUsers: UserProfile[];
  // Set when a suspended/blocked account tries to sign in; App.tsx
  // renders a blocked notice instead of the app while this is set.
  // Never set for the super-admin or the demo user.
  accountBlocked: { email: string; status: 'suspended' | 'blocked' } | null;
  clearAccountBlocked: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  sendSupabasePasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  suspendUser: (userId: string) => void;
  activateUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  deleteUser: (userId: string) => void;
  resetUserPassword: (userId: string, newPass: string) => void;
  updateUserPlan: (userId: string, newPlan: SubscriptionPlan, billingPeriod?: BillingCycle) => void;
  updateUserData: (userId: string, data: Partial<UserProfile>) => void;
  refreshUsers: () => Promise<void>;

  // Subscription Approval & Activation System
  subscriptionRequests: SubscriptionRequest[];
  requestSubscription: (data: {
    requestedPlan: SubscriptionPlan;
    billingCycle: BillingCycle;
    paymentMethod: string;
    paymentRegion?: 'international' | 'bangladesh';
    paymentProvider?: string;
    currency?: string;
    transactionId?: string;
    amount: number;
  }) => Promise<boolean>;
  activateUserSubscription: (params: {
    userId: string;
    plan: SubscriptionPlan;
    billingPeriod: BillingCycle;
    paymentMethod?: string;
    paymentProvider?: string;
    paymentRegion?: 'international' | 'bangladesh';
    transactionId?: string;
    amount?: number;
    currency?: string;
  }) => Promise<void>;
  calculateSubscriptionExpiry: (startDate: Date | string, billingPeriod: BillingCycle | string) => string;
  approveSubscriptionRequest: (requestId: string) => Promise<void>;
  rejectSubscriptionRequest: (requestId: string, notes?: string) => Promise<void>;
  cancelSubscriptionRequest: (requestId: string, notes?: string) => Promise<void>;
  cancelUserSubscription: (userId: string, notes?: string) => Promise<void>;
  switchActivePlan: (targetPlan: SubscriptionPlan) => Promise<boolean>;
  cancelActivePendingRequest: () => Promise<boolean>;

  // Settings & Theme
  settings: BusinessSettings;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  t: (key: string) => string;
  formatNumber: (val: number | string | undefined | null, options?: { decimals?: number; useGrouping?: boolean }) => string;
  formatCurrency: (
    amount: number | string | undefined | null,
    options?: FormatMoneyOptions & { sourceCurrency?: string; displayCurrency?: string }
  ) => string;
  formatMoney: (
    amount: number | string | undefined | null,
    sourceCurrency?: string,
    displayCurrency?: string,
    locale?: Language | string,
    options?: FormatMoneyOptions
  ) => string;
  convertMoney: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  getExchangeRate: (fromCurrency: string, toCurrency?: string) => Promise<number>;
  storeBaseCurrency: string;
  displayCurrency: string;
  displayCurrencySymbol: string;
  exchangeRates: Record<string, number>;
  isExchangeRatesLoading: boolean;
  formatDate: (dateStr: string | Date | undefined | null) => string;

  // Dashboard Customization Preferences
  dashboardPreferences: DashboardPreferences;
  updateDashboardPreferences: (newPrefs: Partial<DashboardPreferences>) => Promise<void>;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Entities Data
  products: Product[];
  categories: Category[];
  brands: Brand[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  sales: Sale[];
  purchases: Purchase[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  adjustments: StockAdjustment[];
  dueCollections: DueCollection[];

  // POS State
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  checkoutPOS: (saleData: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    discount: number;
    tax: number;
    paymentMethod: 'Cash' | 'Card' | 'bKash/Mobile' | 'Due/Credit' | 'Split';
    cashReceived: number;
    note?: string;
  }, options?: {
    // Quick Sale is free for all plans: pass { skipPosGate: true } so the
    // Premium POS gate does not block Quick Sale checkout. POS Register
    // (PosSystem) never passes this, so it stays Premium-only.
    skipPosGate?: boolean;
  }) => Promise<Sale>;

  // Categories & Brands CRUD
  addCategory: (name: string, description?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addBrand: (name: string, description?: string) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;

  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'status'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  clearAllProducts: () => Promise<void>;

  // POS / QR Code Limit Helpers
  generatedProductCodes: string[];
  recordGeneratedCode: (productId: string) => boolean;
  isCodeGenerated: (productId: string) => boolean;
  removeGeneratedCode: (productId: string) => void;
  getGeneratedQRCount: (productId: string) => number;
  recordGeneratedQRCodes: (productId: string, requestedCount: number) => { success: boolean; message?: string };

  // Stock Actions
  adjustStock: (productId: string, quantityDelta: number, reason: string, type: 'addition' | 'reduction' | 'damage_writeoff' | 'audit_correction') => Promise<void>;

  // Customers & Suppliers CRUD
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt' | 'dueAmount' | 'totalSpent' | 'lifetimePurchasesCount'>) => Promise<Customer>;
  updateCustomer: (id: string, cust: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supp: Omit<Supplier, 'id' | 'createdAt' | 'dueAmount' | 'totalPurchasesCount'>) => Promise<Supplier>;
  updateSupplier: (id: string, supp: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  resetAllDataToZero: () => Promise<void>;
  loadSampleDemoData: () => Promise<void>;

  // Expenses & Purchases
  addExpense: (exp: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (id: string, exp: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNo'>) => Promise<Purchase>;

  // Capital & Investment
  investments: Investment[];
  capitalWithdrawals: CapitalWithdrawal[];
  addInvestment: (inv: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Investment>;
  updateInvestment: (id: string, inv: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addCapitalWithdrawal: (w: Omit<CapitalWithdrawal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CapitalWithdrawal>;
  updateCapitalWithdrawal: (id: string, w: Partial<CapitalWithdrawal>) => Promise<void>;
  deleteCapitalWithdrawal: (id: string) => Promise<void>;

  // Due Collection
  collectDue: (data: { type: 'customer' | 'supplier'; entityId: string; amountPaid: number; paymentMethod: string; note?: string }) => Promise<DueCollection | undefined>;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Backup
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;

  // Team, Payroll, Audit & Loyalty
  teamMembers: TeamMember[];
  saveTeamMembers: (updated: TeamMember[]) => void;
  devices: EmployeeDevice[];
  saveDevices: (updated: EmployeeDevice[]) => void;
  requestDeviceAuthorization: (params?: { deviceName?: string; notes?: string }) => Promise<EmployeeDevice>;
  approveDevice: (deviceId: string) => Promise<void>;
  revokeDevice: (deviceId: string, reason?: string) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  renameDevice: (deviceId: string, newName: string) => Promise<void>;
  currentDeviceId: string;
  currentDevice: EmployeeDevice | null;
  isCurrentDeviceAuthorized: boolean;
  employees: Employee[];
  saveEmployees: (updated: Employee[]) => void;
  payrollPayments: PayrollPayment[];
  savePayrollPayments: (updated: PayrollPayment[]) => void;
  salaryAdjustments: SalaryAdjustment[];
  saveSalaryAdjustments: (updated: SalaryAdjustment[]) => void;
  auditLogs: AuditLogEntry[];
  saveAuditLogs: (updated: AuditLogEntry[]) => void;
  loyaltySettings: CustomerLoyaltySettings;
  saveLoyaltySettings: (updated: CustomerLoyaltySettings) => void;
  isCloudSynced: boolean;

  // Online Business Mode
  onlineProducts: OnlineProduct[];
  onlineOrders: OnlineOrder[];
  onlineCustomers: OnlineCustomer[];
  onlineSettings: OnlineBusinessSettings;
  isOnlineBusinessActive: boolean;
  toggleOnlineBusinessMode: (enabled: boolean) => Promise<{ success: boolean; error?: string; reason?: 'free' | 'expired' | 'unauthorized' }>;
  updateOnlineSettings: (newSettings: Partial<OnlineBusinessSettings>) => Promise<void>;
  createOnlineProduct: (productData: Partial<OnlineProduct> & { name: string; sellingPrice: number }) => Promise<OnlineProduct>;
  updateOnlineProduct: (productIdOrData: string | OnlineProduct, updates?: Partial<OnlineProduct>) => Promise<void>;
  deleteOnlineProduct: (productId: string) => Promise<void>;
  createOnlineOrder: (orderData: Partial<OnlineOrder>) => Promise<OnlineOrder>;
  updateOnlineOrder: (orderId: string, updates: Partial<OnlineOrder>) => Promise<void>;
  updateOnlineOrderStatus: (
    orderId: string,
    status: OnlineOrderStatus,
    optionsOrReason?: string | {
      reason?: string;
      cancellationReason?: string;
      courierCost?: number;
      cancellationCost?: number;
      totalLoss?: number;
      cancelledBy?: string;
      cancellationStage?: string;
      returnReason?: string;
      returnedBy?: string;
      returnCourierCost?: number;
      totalReturnLoss?: number;
      notes?: string;
    }
  ) => Promise<void>;
  deleteOnlineOrder: (orderId: string) => Promise<void>;
  recordCodCollection: (orderId: string, amount: number, courierNote?: string) => Promise<void>;
  createOnlineCustomer: (customerData: Partial<OnlineCustomer>) => Promise<OnlineCustomer>;
  updateOnlineCustomer: (customerId: string, updates: Partial<OnlineCustomer>) => Promise<void>;

  // Personal Ledger ("ব্যক্তিগত খাতা" - Completely Isolated from Business Metrics)
  personalContacts: PersonalContact[];
  personalTransactions: PersonalTransaction[];
  addPersonalContact: (contact: Omit<PersonalContact, 'id' | 'createdAt'>) => Promise<PersonalContact>;
  updatePersonalContact: (id: string, updates: Partial<PersonalContact>) => Promise<void>;
  deletePersonalContact: (id: string) => Promise<void>;
  addPersonalTransaction: (tx: Omit<PersonalTransaction, 'id' | 'createdAt'>) => Promise<PersonalTransaction>;
  updatePersonalTransaction: (id: string, updates: Partial<PersonalTransaction>) => Promise<void>;
  deletePersonalTransaction: (id: string) => Promise<void>;
  settlePersonalBalance: (params: {
    contactId: string;
    amount: number;
    settlementType: 'RECEIVE_FROM_CONTACT' | 'PAY_TO_CONTACT';
    paymentMethod?: string;
    notes?: string;
    date?: string;
  }) => Promise<PersonalTransaction>;

  // Calculated Business Metrics
  metrics: {
    todaySales: number;
    todayExpense: number;
    todayBuyingCost: number;
    todayGrossProfit: number;
    todayProfit: number;
    todayLoss: number;
    todayDue: number;
    todayDueSuppliers: number;
    totalBalance: number;
    totalStockQty: number;
    totalInventoryCostValue: number;
    totalInventorySellingValue: number;
    totalDueCustomers: number;
    totalDueSuppliers: number;
    monthlySales: number;
    monthlyExpense: number;
    monthBuyingCost: number;
    monthGrossProfit: number;
    monthlyProfit: number;
    monthlyLoss: number;
    lowStockCount: number;
    expiredCount: number;
    totalInvestedCapital: number;
    totalWithdrawnCapital: number;
    currentCapital: number;
    investmentCount: number;
    withdrawalCount: number;
  };
}

function parseOwnerPaymentSettings(pData: any): OwnerPaymentSettings {
  const bdData = pData?.bangladesh || {};
  const bdMethods = bdData?.methods || {};

  const defaultBkashNum = bdMethods?.bkash?.number ?? pData?.paymentNumber ?? pData?.accountNumber ?? '01700000000';
  const defaultNagadNum = bdMethods?.nagad?.number ?? pData?.paymentNumber ?? pData?.accountNumber ?? '01700000000';
  const defaultRocketNum = bdMethods?.rocket?.number ?? pData?.paymentNumber ?? pData?.accountNumber ?? '01700000000';
  const defaultBankNum = bdMethods?.bank?.number ?? bdMethods?.bank?.accountNumber ?? '1501203948501001';

  const bangladeshConfig: BangladeshPaymentConfig = {
    enabled: bdData?.enabled ?? pData?.localPaymentEnabled ?? true,
    methods: {
      bkash: {
        enabled: bdMethods?.bkash?.enabled ?? true,
        number: defaultBkashNum,
        type: bdMethods?.bkash?.type || 'Personal',
        instructions: bdMethods?.bkash?.instructions || '1. Open bKash App or dial *247#\n2. Select "Send Money"\n3. Enter the Number & Amount\n4. Add Store Name as Reference\n5. Copy TrxID and submit below',
      },
      nagad: {
        enabled: bdMethods?.nagad?.enabled ?? true,
        number: defaultNagadNum,
        type: bdMethods?.nagad?.type || 'Personal',
        instructions: bdMethods?.nagad?.instructions || '1. Open Nagad App or dial *167#\n2. Select "Send Money"\n3. Enter the Number & Amount\n4. Add Store Name as Reference\n5. Copy TrxID and submit below',
      },
      rocket: {
        enabled: bdMethods?.rocket?.enabled ?? true,
        number: defaultRocketNum,
        type: bdMethods?.rocket?.type || 'Personal',
        instructions: bdMethods?.rocket?.instructions || '1. Open Rocket App or dial *322#\n2. Select "Send Money"\n3. Enter the Rocket Account & Amount\n4. Add Store Name as Reference\n5. Copy TrxID and submit below',
      },
      bank: {
        enabled: bdMethods?.bank?.enabled ?? true,
        number: defaultBankNum,
        type: bdMethods?.bank?.type || 'Bank Account',
        bankName: bdMethods?.bank?.bankName || 'BRAC Bank PLC',
        branchName: bdMethods?.bank?.branchName || 'Gulshan Branch',
        accountName: bdMethods?.bank?.accountName || 'YearInvo Software Solution',
        routingNumber: bdMethods?.bank?.routingNumber || '060261325',
        instructions: bdMethods?.bank?.instructions || '1. Transfer via BEFTN / NPSB / EFT to the company bank account\n2. Mention your Store Name or Email in the transfer note\n3. Enter the transaction reference / slip number below',
      },
    },
    receiverName: bdData?.receiverName || pData?.receiverName || pData?.accountName || 'YearInvo Store',
    storeName: bdData?.storeName || pData?.storeName || 'YearInvo Store',
    transactionIdInstruction: bdData?.transactionIdInstruction || pData?.transactionIdInstruction || 'Copy your transaction ID (TrxID) or Bank Reference Number and enter it below.',
    defaultInstructions: bdData?.defaultInstructions || '',
  };

  return {
    localPaymentEnabled: bangladeshConfig.enabled,
    paymentMethod: pData?.paymentMethod || 'bKash / Nagad / Rocket / Bank',
    paymentNumber: defaultBkashNum,
    receiverName: bangladeshConfig.receiverName,
    storeName: bangladeshConfig.storeName,
    transactionIdInstruction: bangladeshConfig.transactionIdInstruction,
    bangladesh: bangladeshConfig,
    qrEnabled: pData?.qrEnabled ?? true,
    qrProvider: pData?.qrProvider || 'bKash',
    qrImageUrl: pData?.qrImageUrl || '',
    accountName: bangladeshConfig.receiverName,
    accountNumber: defaultBkashNum,
    updatedAt: pData?.updatedAt,
  };
}

const defaultSettings: BusinessSettings = {
  logoUrl: '',
  brandName: 'Your Store Name',
  siteLogoUrl: '',
  siteBrandName: 'YearInvo',
  siteSubBrandName: 'by Year Media',
  currency: '৳',
  currencyPosition: 'prefix',
  timeZone: 'Asia/Dhaka',
  taxRatePercent: 0,
  receiptHeader: 'Thank you for choosing YearInvo by Year Media!',
  receiptFooter: 'Please visit again. For support: +880 1700 000000',
  language: 'en',
  theme: 'light',
  autoBackup: true,
  paymentSettings: {
    localPaymentEnabled: true,
    paymentMethod: 'bKash',
    paymentNumber: '01700000000',
    receiverName: 'YearInvo Store',
    storeName: 'YearInvo Store',
    transactionIdInstruction: 'Copy your transaction ID (TrxID) or Bank Reference Number and enter it below.',
    bangladesh: {
      enabled: true,
      methods: {
        bkash: {
          enabled: true,
          number: '01700000000',
          type: 'Personal',
          instructions: '1. Open bKash App or dial *247#\n2. Select "Send Money"\n3. Enter the Number & Amount\n4. Add Store Name as Reference\n5. Copy TrxID and submit below',
        },
        nagad: {
          enabled: true,
          number: '01800000000',
          type: 'Personal',
          instructions: '1. Open Nagad App or dial *167#\n2. Select "Send Money"\n3. Enter the Number & Amount\n4. Add Store Name as Reference\n5. Copy TrxID and submit below',
        },
        rocket: {
          enabled: true,
          number: '01900000000-1',
          type: 'Personal',
          instructions: '1. Open Rocket App or dial *322#\n2. Select "Send Money"\n3. Enter the Rocket Account & Amount\n4. Add Store Name as Reference\n5. Copy TrxID and submit below',
        },
        bank: {
          enabled: true,
          number: '1501203948501001',
          type: 'Bank Account',
          bankName: 'BRAC Bank PLC',
          branchName: 'Gulshan Branch',
          accountName: 'YearInvo Software Solution',
          routingNumber: '060261325',
          instructions: '1. Transfer via BEFTN / NPSB / EFT to the company bank account\n2. Mention your Store Name or Email in the transfer note\n3. Enter the transaction reference / slip number below',
        },
      },
      receiverName: 'YearInvo Store',
      storeName: 'YearInvo Store',
      transactionIdInstruction: 'Copy your transaction ID (TrxID) or Bank Reference Number and enter it below.',
    },
    qrEnabled: true,
    qrProvider: 'bKash',
    qrImageUrl: '',
    accountName: 'YearInvo Store',
    accountNumber: '01700000000',
  },
  onlineBusiness: defaultOnlineBusinessSettings,
};

const initialRegisteredUsers: UserProfile[] = [
  {
    id: 'usr-demo-merchant-01',
    brandName: 'Demo Retail Shop',
    ownerName: 'Ariful Islam',
    mobile: '+880 1712 345678',
    email: 'owner@omnibiz.com',
    password: '123456',
    businessType: 'General Retail & Grocery',
    country: 'Bangladesh',
    currency: '৳',
    timeZone: 'Asia/Dhaka',
    role: 'Manager',
    subscriptionPlan: 'Business',
    subscriptionStatus: 'active',
    status: 'active',
    verifiedEmail: true,
    verifiedPhone: true,
    createdAt: '2026-01-01',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use centralized exchange rates hook
  const {
    rates: exchangeRates,
    isLoading: isExchangeRatesLoading,
    convert: convertCurrencyWithRates,
    format: formatMoneyWithRates,
  } = useExchangeRates();

  // Saved language & theme
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('biz_language');
    return (saved as Language) || 'en';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('biz_theme');
    return (saved as ThemeMode) || 'light';
  });

  // Dashboard Preferences
  const [dashboardPreferences, setDashboardPreferences] = useState<DashboardPreferences>(() => {
    try {
      const saved = localStorage.getItem('biz_dashboard_preferences');
      if (saved) {
        return { ...defaultDashboardPreferences, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return defaultDashboardPreferences;
  });

  // Demo Mode: guest preview session with clearly-labelled sample data.
  // While true, no data is written to the cloud and the demo user is
  // never persisted to localStorage, so a page reload ends the demo.
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Strictly default user to NULL for unauthenticated landing view
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('biz_user');
    if (!saved || saved === 'null') return null;
    try {
      const parsed = JSON.parse(saved);
      return parsed && parsed.email ? parsed : null;
    } catch (e) {
      return null;
    }
  });

  // Track Auth emailVerified status
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);

  // Blocked-account notice: set when a suspended/blocked user signs in.
  const [accountBlocked, setAccountBlocked] = useState<{ email: string; status: 'suspended' | 'blocked' } | null>(null);
  const clearAccountBlocked = () => setAccountBlocked(null);

  useEffect(() => {
    // Never persist the demo guest user: a reload must end the demo
    // instead of restoring it as if it were a real signed-in account.
    if (isDemoMode) return;
    try {
      if (user) {
        localStorage.setItem('biz_user', JSON.stringify(user));
        if (user.id) {
          localStorage.setItem(`biz_user_${user.id}`, JSON.stringify(user));
        }
      } else {
        localStorage.setItem('biz_user', 'null');
      }
    } catch (e) {
      console.warn('Notice persisting user to storage:', e);
    }
  }, [user]);

  // Helper to check if user is Platform Admin (yearinvo@gmail.com)
  const isTeamStockAdmin = (emailStr?: string | null) => {
    if (!emailStr) return false;
    return emailStr.trim().toLowerCase() === 'yearinvo@gmail.com';
  };

  // Helper to load and sync authenticated user profile from Supabase
  const syncSupabaseProfile = async (sbUser: any) => {
    try {
      const userEmail = (sbUser.email || '').toLowerCase();
      const isAdmin = isTeamStockAdmin(userEmail);

      console.log(`[Supabase Auth] Syncing user profile: ${userEmail || sbUser.id}`);

      // 1. Fetch user data from Supabase PostgreSQL users table
      let uData = await getSupabaseUser(sbUser.id);
      if (!uData && userEmail) {
        uData = await getSupabaseUserByEmail(userEmail);
      }

      // Fallback check Firestore if migrating from older account
      if (!uData) {
        try {
          const userRef = doc(db, 'users', sbUser.id);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            uData = docSnap.data();
          }
        } catch (e) {
          // ignore
        }
      }

      const meta = sbUser.user_metadata || {};
      const roleRaw = uData?.role || meta.role || 'Owner';
      const normalizedRole: UserRole =
        isAdmin ||
        !roleRaw ||
        roleRaw.toString().toLowerCase() === 'owner' ||
        roleRaw.toString().toLowerCase() === 'admin' ||
        roleRaw.toString().toLowerCase() === 'platformowner'
          ? 'Owner'
          : 'Manager';

      // Suspended/blocked accounts cannot use the app. Never blocks the
      // super-admin (yearinvo@gmail.com) or the demo user, which never
      // reaches this sync with a Supabase row anyway.
      const accountStatus = (uData?.status || '').toString().toLowerCase();
      if (
        (accountStatus === 'suspended' || accountStatus === 'blocked') &&
        !isAdmin &&
        sbUser.id !== 'usr-demo-merchant-01'
      ) {
        setAccountBlocked({ email: userEmail, status: accountStatus as 'suspended' | 'blocked' });
        await supabase.auth.signOut();
        setUser(null);
        return;
      }

      let savedBrand = '';
      try {
        const savedSet = localStorage.getItem('biz_settings');
        if (savedSet) {
          const pSet = JSON.parse(savedSet);
          if (pSet && pSet.brandName && pSet.brandName !== 'My Store') {
            savedBrand = pSet.brandName;
          }
        }
        if (!savedBrand) {
          const savedU = localStorage.getItem('biz_user');
          if (savedU && savedU !== 'null') {
            const pU = JSON.parse(savedU);
            if (pU && pU.brandName && pU.brandName !== 'My Store') {
              savedBrand = pU.brandName;
            }
          }
        }
      } catch (e) {}

      const effectiveBrandName =
        uData?.brand_name ||
        uData?.brandName ||
        uData?.storeName ||
        meta.brand_name ||
        savedBrand ||
        'My Store';

      const userPreferredLang = uData?.preferredLanguage || uData?.language || meta.preferredLanguage;
      const rawPlan = (uData?.plan || uData?.subscriptionPlan || meta.plan || 'Free').toString();
      const subPlan: SubscriptionPlan = isAdmin
        ? 'Lifetime'
        : rawPlan.toLowerCase() === 'lifetime'
        ? 'Lifetime'
        : rawPlan.toLowerCase() === 'premium'
        ? 'Premium'
        : rawPlan.toLowerCase() === 'pro'
        ? 'Pro'
        : 'Free';

      const subStatus = (uData?.subscription_status || uData?.subscriptionStatus || 'active') as any;
      const subPending = uData?.pendingPlan || undefined;
      const subStartDate = uData?.startDate || uData?.created_at || undefined;
      const subExpiryDate = uData?.subscription_expires_at || uData?.expiryDate || uData?.currentPeriodEnd || undefined;
      const subBillingPeriod = (uData?.billing_duration || uData?.billingPeriod || 'monthly') as BillingCycle;

      const fullName =
        uData?.full_name ||
        uData?.fullName ||
        uData?.ownerName ||
        meta.full_name ||
        (isAdmin ? 'Admin Owner' : 'Store Owner');

      const profile: UserProfile = {
        id: sbUser.id,
        brandName: effectiveBrandName,
        ownerName: fullName,
        fullName: fullName,
        name: fullName,
        mobile: uData?.phone || uData?.mobile || meta.phone || '',
        email: userEmail,
        businessType: uData?.business_type || uData?.businessType || meta.business_type || 'General Retail & Grocery',
        country: uData?.country || meta.country || 'Bangladesh',
        preferredLanguage:
          userPreferredLang && SUPPORTED_LANGUAGES.some((l) => l.code === userPreferredLang)
            ? (userPreferredLang as Language)
            : undefined,
        currency: uData?.currency || '৳',
        timeZone: uData?.timeZone || 'Asia/Dhaka',
        role: normalizedRole,
        subscriptionPlan: subPlan,
        subscriptionStatus: subStatus,
        pendingPlan: subPending,
        startDate: subStartDate,
        expiryDate: subExpiryDate,
        subscriptionExpiresAt: subExpiryDate,
        billingPeriod: subBillingPeriod,
        status: uData?.status || 'active',
        storeAddress: uData?.storeAddress || uData?.address || '',
        affiliateCode: uData?.affiliateCode || '',
        affiliateProgram: uData?.affiliateProgram || '',
        verifiedEmail: true,
        verifiedPhone: true,
        createdAt: uData?.created_at
          ? new Date(uData.created_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        dashboardPreferences: uData?.dashboardPreferences
          ? { ...defaultDashboardPreferences, ...uData.dashboardPreferences }
          : defaultDashboardPreferences,
      };

      setIsEmailVerified(true);

      // If missing in Supabase users table, sync now
      if (!uData) {
        upsertSupabaseUser({
          id: sbUser.id,
          email: userEmail,
          ownerName: fullName,
          brandName: effectiveBrandName,
          businessType: profile.businessType,
          mobile: profile.mobile,
          role: normalizedRole,
          subscriptionPlan: subPlan,
          subscriptionStatus: subStatus,
          currency: profile.currency,
        }).catch((err) => console.warn('[Supabase Sync User Notice]:', err));
      }

      setAccountBlocked(null);
      setUser(profile);

      if (userPreferredLang && SUPPORTED_LANGUAGES.some((l) => l.code === userPreferredLang)) {
        setLanguageState(userPreferredLang as Language);
        localStorage.setItem('biz_language', userPreferredLang);
      }
      if (profile.brandName) {
        setSettings((prev) => ({ ...prev, brandName: profile.brandName }));
      }
      if (normalizedRole === 'Owner') {
        setActiveTabState('owner');
      }
    } catch (err) {
      console.warn('Error syncing Supabase user profile:', err);
    }
  };

  // Listen to Supabase Auth state changes & sync session
  useEffect(() => {
    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncSupabaseProfile(session.user);
      }
    }).catch((err) => {
      console.warn('[Supabase Auth] Session fetch notice:', err);
    });

    // 2. Real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Supabase Auth Event] ${event}`, session?.user?.email);
      if (session?.user) {
        syncSupabaseProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Realtime global owner payment settings listener from Firestore doc(db, 'settings', 'payment')
  useEffect(() => {
    try {
      const unsubPaymentSettings = onSnapshot(
        doc(db, 'settings', 'payment'),
        (docSnap) => {
          if (docSnap.exists()) {
            const pData = docSnap.data();
            setSettings((prev) => ({
              ...prev,
              paymentSettings: parseOwnerPaymentSettings(pData),
            }));
          }
        },
        (err) => {
          console.warn('Realtime listener error for settings/payment:', err);
        }
      );
      return () => unsubPaymentSettings();
    } catch (err) {
      console.warn('Failed to attach listener for settings/payment:', err);
    }
  }, []);

  // Registered Users Directory (Realtime Firestore Collection)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Registered Users Directory (Supabase public.users, realtime + polling).
  // Previously Firestore-only, so real Supabase signups never appeared
  // here and the Owner Dashboard showed 0 users.
  useEffect(() => {
    let isMounted = true;

    const loadSupabaseUsers = async () => {
      try {
        const list = await getSupabaseAllUsers();
        if (!isMounted) return;
        setAllUsers(list);

        if (auth.currentUser) {
          const currentUid = auth.currentUser.uid;
          const currentInList = list.find((u) => u.id === currentUid);
          if (currentInList) {
            setUser((prev) => {
              if (!prev) return currentInList;
              const hasChanged =
                prev.role !== currentInList.role ||
                prev.status !== currentInList.status ||
                prev.subscriptionPlan !== currentInList.subscriptionPlan ||
                prev.subscriptionStatus !== currentInList.subscriptionStatus ||
                prev.pendingPlan !== currentInList.pendingPlan ||
                prev.expiryDate !== currentInList.expiryDate ||
                prev.billingPeriod !== currentInList.billingPeriod ||
                prev.brandName !== currentInList.brandName;

              if (hasChanged) {
                if (currentInList.role === 'Owner' && prev.role !== 'Owner') {
                  setActiveTabState('owner');
                }
                return {
                  ...prev,
                  ...currentInList,
                };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Notice loading users from Supabase:', err);
      }
    };

    loadSupabaseUsers();
    const pollInterval = setInterval(loadSupabaseUsers, 15000);
    const channel = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          loadSupabaseUsers();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Update Offline Sync Queue Service with current user ID & network lifecycle
  useEffect(() => {
    const currentUid = user?.id || auth.currentUser?.uid || null;
    syncQueueService.setUserId(currentUid);
  }, [user?.id]);

  // Subscription Approval Requests Directory (Supabase & Realtime Synchronization)
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadSubRequests = async () => {
      try {
        const sbReqs = await getSupabaseSubscriptionRequests();
        if (isMounted && sbReqs) {
          setSubscriptionRequests(sbReqs);
        }
      } catch (err) {
        console.warn('Notice loading subscription requests from Supabase:', err);
      }
    };

    // Initial load
    loadSubRequests();

    // Polling interval
    const pollInterval = setInterval(loadSubRequests, 12000);

    // Supabase Realtime channel
    const channel = supabase
      .channel('subscription_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscription_requests' },
        () => {
          loadSubRequests();
        }
      )
      .subscribe();

    // Firestore fallback (non-blocking)
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(
        collection(db, 'subscriptionRequests'),
        (snapshot) => {
          const list: SubscriptionRequest[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              userId: d.uid || d.userId || '',
              userName: d.userName || d.ownerName || 'User',
              userEmail: d.email || d.userEmail || '',
              brandName: d.storeName || d.brandName || '',
              currentPlan: d.currentPlan || 'Free',
              requestedPlan: d.requestedPlan || 'Pro',
              billingCycle: d.billingCycle || 'monthly',
              paymentMethod: d.paymentMethod || 'bKash',
              paymentProvider: d.paymentProvider || d.paymentMethod || 'bKash',
              paymentRegion: d.paymentRegion || 'bangladesh',
              currency: d.currency || 'BDT',
              transactionId: d.transactionId || '',
              amount: typeof d.amount === 'number' ? d.amount : 0,
              status: d.status || 'pending',
              requestDate: d.createdAt || d.requestDate || new Date().toISOString(),
              reviewedDate: d.reviewedDate || '',
              approvedBy: d.approvedBy || '',
              notes: d.notes || '',
            });
          });
          if (isMounted && list.length > 0) {
            setSubscriptionRequests((prev) => {
              const map = new Map<string, SubscriptionRequest>();
              list.forEach((r) => map.set(r.id, r));
              prev.forEach((r) => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              const merged = Array.from(map.values());
              merged.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
              return merged;
            });
          }
        },
        () => {}
      );
    } catch (e) {}

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
      if (unsubFirestore) unsubFirestore();
    };
  }, []);
  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('biz_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultSettings, ...parsed };
        }
      } catch (e) {
        console.error(e);
      }
    }
    const savedUser = localStorage.getItem('biz_user');
    if (savedUser && savedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.brandName) {
          return { ...defaultSettings, brandName: parsedUser.brandName };
        }
      } catch (e) {}
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('biz_settings', JSON.stringify(settings));
  }, [settings]);
  const [activeTab, setActiveTabState] = useState<string>('dashboard');

  const setActiveTab = (tab: string) => {
    if (tab === 'owner' && user?.role !== 'Owner') {
      setActiveTabState('dashboard');
      return;
    }
    setActiveTabState(tab);
  };
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Main Data Repositories - Safe load with user-scoped storage fallback
  const getStoredData = <T,>(key: string, fallback: T): T => {
    try {
      const savedUser = localStorage.getItem('biz_user');
      const uid = savedUser && savedUser !== 'null' ? JSON.parse(savedUser)?.id : '';
      const userScoped = uid ? localStorage.getItem(`${key}_${uid}`) : null;
      const globalScoped = localStorage.getItem(key);
      const saved = userScoped || globalScoped;
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => getStoredData('biz_products', []));
  const [categories, setCategories] = useState<Category[]>(() => getStoredData('biz_categories', []));
  const [brands, setBrands] = useState<Brand[]>(() => getStoredData('biz_brands', []));
  const [customers, setCustomers] = useState<Customer[]>(() => getStoredData('biz_customers', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredData('biz_suppliers', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredData('biz_expenses', []));
  const [sales, setSales] = useState<Sale[]>(() => getStoredData('biz_sales', []));
  const [purchases, setPurchases] = useState<Purchase[]>(() => getStoredData('biz_purchases', []));

  // Notifications state: Manual/system notifications + Read status map
  const [manualNotifications, setManualNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('biz_manual_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [readNotificationIds, setReadNotificationIds] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('biz_read_notifs_' + (user?.id || 'default'));
    return saved ? JSON.parse(saved) : {};
  });

  // Re-sync read map when user profile ID changes
  useEffect(() => {
    const storageKey = 'biz_read_notifs_' + (user?.id || 'default');
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setReadNotificationIds(JSON.parse(saved));
      } catch (e) {}
    }
  }, [user?.id]);

  const addManualNotification = (notif: AppNotification) => {
    setManualNotifications((prev) => {
      const updated = [notif, ...prev.filter((m) => m.id !== notif.id)];
      localStorage.setItem('biz_manual_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [dueCollections, setDueCollections] = useState<DueCollection[]>([]);
  const [investments, setInvestments] = useState<Investment[]>(() => getStoredData('biz_investments', []));
  const [capitalWithdrawals, setCapitalWithdrawals] = useState<CapitalWithdrawal[]>(() => getStoredData('biz_capital_withdrawals', []));

  // Cloud Synchronized State Repositories
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_team_members_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [devices, setDevices] = useState<EmployeeDevice[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_devices_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_employees_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [payrollPayments, setPayrollPayments] = useState<PayrollPayment[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_payroll_payments_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [salaryAdjustments, setSalaryAdjustments] = useState<SalaryAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_salary_adjustments_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_audit_logs_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [loyaltySettings, setLoyaltySettings] = useState<CustomerLoyaltySettings>(() => {
    try {
      const saved = localStorage.getItem(`biz_loyalty_settings_${user?.id || 'default'}`);
      return saved
        ? JSON.parse(saved)
        : {
            enabled: true,
            pointsPerAmount: 1,
            spendingAmountUnit: 100,
            pointRedemptionValue: 1,
            minPointsToRedeem: 50,
          };
    } catch (e) {
      return {
        enabled: true,
        pointsPerAmount: 1,
        spendingAmountUnit: 100,
        pointRedemptionValue: 1,
        minPointsToRedeem: 50,
      };
    }
  });

  // Online Business Mode State
  const [onlineProducts, setOnlineProducts] = useState<OnlineProduct[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_online_products_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_online_orders_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [onlineCustomers, setOnlineCustomers] = useState<OnlineCustomer[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_online_customers_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Personal Ledger State ("ব্যক্তিগত খাতা" - Completely Isolated from Business Metrics)
  const [personalContacts, setPersonalContacts] = useState<PersonalContact[]>(() => {
    try {
      const currentUserId = user?.id || 'default';
      const saved = localStorage.getItem(`biz_personal_contacts_${currentUserId}`) || localStorage.getItem('biz_personal_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [personalTransactions, setPersonalTransactions] = useState<PersonalTransaction[]>(() => {
    try {
      const currentUserId = user?.id || 'default';
      const saved = localStorage.getItem(`biz_personal_transactions_${currentUserId}`) || localStorage.getItem('biz_personal_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Real-time Cloud Synchronization (Single Account = Single Cloud Data across all PC & Mobile devices)
  useEffect(() => {
    const currentUserId = user?.id || auth.currentUser?.uid;
    if (!currentUserId) {
      setIsCloudSynced(false);
      setProducts([]);
      setCategories([]);
      setBrands([]);
      setCustomers([]);
      setSuppliers([]);
      setExpenses([]);
      setSales([]);
      setPurchases([]);
      setAdjustments([]);
      setDueCollections([]);
      setTeamMembers([]);
      setDevices([]);
      setEmployees([]);
      setPayrollPayments([]);
      setSalaryAdjustments([]);
      setAuditLogs([]);
      setOnlineProducts([]);
      setOnlineOrders([]);
      setOnlineCustomers([]);
      setPersonalContacts([]);
      setPersonalTransactions([]);
      return;
    }

    if (isDemoMode) {
      // Demo session: local sample data only. Never subscribe to the
      // cloud and never write demo data to any real account.
      setIsCloudSynced(false);
      setProducts(demoProducts);
      setCategories(demoCategories);
      setBrands(demoBrands);
      setCustomers(demoCustomers);
      setSuppliers(demoSuppliers);
      setExpenses(demoExpenses);
      setSales(demoSales);
      setPurchases(demoPurchases);
      setAdjustments([]);
      setDueCollections([]);
      setTeamMembers([]);
      setDevices([]);
      setEmployees([]);
      setPayrollPayments([]);
      setSalaryAdjustments([]);
      setAuditLogs([]);
      setOnlineProducts([]);
      setOnlineOrders([]);
      setOnlineCustomers([]);
      setPersonalContacts([]);
      setPersonalTransactions([]);
      return;
    }

    const unsubscribe = subscribeToUserBusinessData(currentUserId, {
      onProductsLoaded: (cloudProducts, fromCloud) => {
        if (fromCloud) {
          setProducts(cloudProducts);
          try {
            localStorage.setItem('biz_products', JSON.stringify(cloudProducts));
            localStorage.setItem(`biz_products_${currentUserId}`, JSON.stringify(cloudProducts));
          } catch (e) {}
        } else {
          // Cloud empty for this user: only migrate local items if they exist specifically for this user
          try {
            const localSaved = localStorage.getItem(`biz_products_${currentUserId}`);
            const localItems: Product[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setProducts(localItems);
              saveUserCloudCollection(currentUserId, 'products', { items: localItems });
            } else {
              setProducts([]);
            }
          } catch (e) {
            setProducts([]);
          }
        }
      },

      onCategoriesLoaded: (cloudCategories, fromCloud) => {
        if (fromCloud) {
          setCategories(cloudCategories);
          try {
            localStorage.setItem('biz_categories', JSON.stringify(cloudCategories));
            localStorage.setItem(`biz_categories_${currentUserId}`, JSON.stringify(cloudCategories));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_categories_${currentUserId}`);
            const localItems: Category[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setCategories(localItems);
              saveUserCloudCollection(currentUserId, 'categories', { items: localItems });
            } else {
              setCategories([]);
            }
          } catch (e) {
            setCategories([]);
          }
        }
      },

      onBrandsLoaded: (cloudBrands, fromCloud) => {
        if (fromCloud) {
          setBrands(cloudBrands);
          try {
            localStorage.setItem('biz_brands', JSON.stringify(cloudBrands));
            localStorage.setItem(`biz_brands_${currentUserId}`, JSON.stringify(cloudBrands));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_brands_${currentUserId}`);
            const localItems: Brand[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setBrands(localItems);
              saveUserCloudCollection(currentUserId, 'brands', { items: localItems });
            } else {
              setBrands([]);
            }
          } catch (e) {
            setBrands([]);
          }
        }
      },

      onCustomersLoaded: (cloudCustomers, fromCloud) => {
        if (fromCloud) {
          setCustomers(cloudCustomers);
          try {
            localStorage.setItem('biz_customers', JSON.stringify(cloudCustomers));
            localStorage.setItem(`biz_customers_${currentUserId}`, JSON.stringify(cloudCustomers));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_customers_${currentUserId}`);
            const localItems: Customer[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setCustomers(localItems);
              saveUserCloudCollection(currentUserId, 'customers', { items: localItems });
            } else {
              setCustomers([]);
            }
          } catch (e) {
            setCustomers([]);
          }
        }
      },

      onSuppliersLoaded: (cloudSuppliers, fromCloud) => {
        if (fromCloud) {
          setSuppliers(cloudSuppliers);
          try {
            localStorage.setItem('biz_suppliers', JSON.stringify(cloudSuppliers));
            localStorage.setItem(`biz_suppliers_${currentUserId}`, JSON.stringify(cloudSuppliers));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_suppliers_${currentUserId}`);
            const localItems: Supplier[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setSuppliers(localItems);
              saveUserCloudCollection(currentUserId, 'suppliers', { items: localItems });
            } else {
              setSuppliers([]);
            }
          } catch (e) {
            setSuppliers([]);
          }
        }
      },

      onExpensesLoaded: (cloudExpenses, fromCloud) => {
        if (fromCloud) {
          setExpenses(cloudExpenses);
          try {
            localStorage.setItem('biz_expenses', JSON.stringify(cloudExpenses));
            localStorage.setItem(`biz_expenses_${currentUserId}`, JSON.stringify(cloudExpenses));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_expenses_${currentUserId}`);
            const localItems: Expense[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setExpenses(localItems);
              saveUserCloudCollection(currentUserId, 'expenses', { items: localItems });
            } else {
              setExpenses([]);
            }
          } catch (e) {
            setExpenses([]);
          }
        }
      },

      onSalesLoaded: (cloudSales, fromCloud) => {
        if (fromCloud) {
          setSales(cloudSales);
          try {
            localStorage.setItem('biz_sales', JSON.stringify(cloudSales));
            localStorage.setItem(`biz_sales_${currentUserId}`, JSON.stringify(cloudSales));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_sales_${currentUserId}`);
            const localItems: Sale[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setSales(localItems);
              saveUserCloudCollection(currentUserId, 'sales', { items: localItems });
            } else {
              setSales([]);
            }
          } catch (e) {
            setSales([]);
          }
        }
      },

      onPurchasesLoaded: (cloudPurchases, fromCloud) => {
        if (fromCloud) {
          setPurchases(cloudPurchases);
          try {
            localStorage.setItem('biz_purchases', JSON.stringify(cloudPurchases));
            localStorage.setItem(`biz_purchases_${currentUserId}`, JSON.stringify(cloudPurchases));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_purchases_${currentUserId}`);
            const localItems: Purchase[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setPurchases(localItems);
              saveUserCloudCollection(currentUserId, 'purchases', { items: localItems });
            } else {
              setPurchases([]);
            }
          } catch (e) {
            setPurchases([]);
          }
        }
      },

      onAdjustmentsLoaded: (cloudAdjustments, fromCloud) => {
        if (fromCloud) {
          setAdjustments(cloudAdjustments);
        }
      },

      onDueCollectionsLoaded: (cloudDue, fromCloud) => {
        if (fromCloud) {
          setDueCollections(cloudDue);
        }
      },

      onInvestmentsLoaded: (cloudInvestments, fromCloud) => {
        if (fromCloud) {
          setInvestments(cloudInvestments);
          try {
            localStorage.setItem('biz_investments', JSON.stringify(cloudInvestments));
            localStorage.setItem(`biz_investments_${currentUserId}`, JSON.stringify(cloudInvestments));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_investments_${currentUserId}`);
            const localItems: Investment[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setInvestments(localItems);
              saveUserCloudCollection(currentUserId, 'investments', { items: localItems });
            } else {
              setInvestments([]);
            }
          } catch (e) {
            setInvestments([]);
          }
        }
      },

      onCapitalWithdrawalsLoaded: (cloudWithdrawals, fromCloud) => {
        if (fromCloud) {
          setCapitalWithdrawals(cloudWithdrawals);
          try {
            localStorage.setItem('biz_capital_withdrawals', JSON.stringify(cloudWithdrawals));
            localStorage.setItem(`biz_capital_withdrawals_${currentUserId}`, JSON.stringify(cloudWithdrawals));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_capital_withdrawals_${currentUserId}`);
            const localItems: CapitalWithdrawal[] = localSaved ? JSON.parse(localSaved) : [];
            if (localItems.length > 0) {
              setCapitalWithdrawals(localItems);
              saveUserCloudCollection(currentUserId, 'capitalWithdrawals', { items: localItems });
            } else {
              setCapitalWithdrawals([]);
            }
          } catch (e) {
            setCapitalWithdrawals([]);
          }
        }
      },

      onTeamLoaded: (cloudTeam, fromCloud) => {
        if (fromCloud) {
          setTeamMembers(cloudTeam);
          try {
            localStorage.setItem(`biz_team_members_${currentUserId}`, JSON.stringify(cloudTeam));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_team_members_${currentUserId}`);
            if (localSaved) {
              const localItems = JSON.parse(localSaved);
              if (Array.isArray(localItems) && localItems.length > 0) {
                saveUserCloudCollection(currentUserId, 'team', { items: localItems });
              }
            }
          } catch (e) {}
        }
      },

      onDevicesLoaded: (cloudDevices, fromCloud) => {
        if (fromCloud) {
          setDevices(cloudDevices);
          try {
            localStorage.setItem(`biz_devices_${currentUserId}`, JSON.stringify(cloudDevices));
          } catch (e) {}
        } else {
          try {
            const localSaved = localStorage.getItem(`biz_devices_${currentUserId}`);
            if (localSaved) {
              const localItems = JSON.parse(localSaved);
              if (Array.isArray(localItems) && localItems.length > 0) {
                saveUserCloudCollection(currentUserId, 'devices', { items: localItems });
              }
            }
          } catch (e) {}
        }
      },

      onPayrollLoaded: (cloudPayroll, fromCloud) => {
        if (fromCloud) {
          setEmployees(cloudPayroll.employees);
          setPayrollPayments(cloudPayroll.payments);
          setSalaryAdjustments(cloudPayroll.adjustments);
          try {
            localStorage.setItem(`biz_employees_${currentUserId}`, JSON.stringify(cloudPayroll.employees));
            localStorage.setItem(`biz_payroll_payments_${currentUserId}`, JSON.stringify(cloudPayroll.payments));
            localStorage.setItem(`biz_salary_adjustments_${currentUserId}`, JSON.stringify(cloudPayroll.adjustments));
          } catch (e) {}
        } else {
          try {
            const localEmp = localStorage.getItem(`biz_employees_${currentUserId}`);
            const localPay = localStorage.getItem(`biz_payroll_payments_${currentUserId}`);
            const localAdj = localStorage.getItem(`biz_salary_adjustments_${currentUserId}`);
            if (localEmp || localPay || localAdj) {
              saveUserCloudCollection(currentUserId, 'payroll', {
                employees: localEmp ? JSON.parse(localEmp) : [],
                payments: localPay ? JSON.parse(localPay) : [],
                adjustments: localAdj ? JSON.parse(localAdj) : [],
              });
            }
          } catch (e) {}
        }
      },

      onAuditLogsLoaded: (cloudLogs, fromCloud) => {
        if (fromCloud) {
          setAuditLogs(cloudLogs);
          try {
            localStorage.setItem(`biz_audit_logs_${currentUserId}`, JSON.stringify(cloudLogs));
          } catch (e) {}
        }
      },

      onLoyaltyLoaded: (cloudLoyalty, fromCloud) => {
        if (fromCloud) {
          setLoyaltySettings(cloudLoyalty);
          try {
            localStorage.setItem(`biz_loyalty_settings_${currentUserId}`, JSON.stringify(cloudLoyalty));
          } catch (e) {}
        }
      },

      onQrTrackingLoaded: (cloudQr, fromCloud) => {
        if (fromCloud) {
          setGeneratedProductCodes(cloudQr.generatedCodes);
          setProductQRCounts(cloudQr.productQRCounts);
          try {
            localStorage.setItem(`biz_generated_codes_${currentUserId}`, JSON.stringify(cloudQr.generatedCodes));
            localStorage.setItem(`biz_product_qr_counts_${currentUserId}`, JSON.stringify(cloudQr.productQRCounts));
          } catch (e) {}
        }
      },

      onSettingsLoaded: (cloudSettings, fromCloud) => {
        if (fromCloud && cloudSettings) {
          setSettings((prev) => ({ ...prev, ...cloudSettings }));
          try {
            localStorage.setItem('biz_settings', JSON.stringify({ ...settings, ...cloudSettings }));
          } catch (e) {}
        }
      },

      onNotificationsLoaded: (cloudNotifs, fromCloud) => {
        if (fromCloud && cloudNotifs) {
          if (Array.isArray(cloudNotifs.manual)) {
            setManualNotifications(cloudNotifs.manual);
            try {
              localStorage.setItem('biz_manual_notifications', JSON.stringify(cloudNotifs.manual));
            } catch (e) {}
          }
          if (cloudNotifs.readMap && typeof cloudNotifs.readMap === 'object') {
            setReadNotificationIds((prev) => {
              const merged = { ...prev, ...cloudNotifs.readMap };
              try {
                localStorage.setItem(`biz_read_notifs_${currentUserId}`, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }
      },

      onOnlineProductsLoaded: (cloudOnlineProducts, fromCloud) => {
        if (fromCloud) {
          setOnlineProducts(cloudOnlineProducts);
          try {
            localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(cloudOnlineProducts));
          } catch (e) {}
        }
      },

      onOnlineOrdersLoaded: (cloudOrders, fromCloud) => {
        if (fromCloud) {
          setOnlineOrders(cloudOrders);
          try {
            localStorage.setItem(`biz_online_orders_${currentUserId}`, JSON.stringify(cloudOrders));
          } catch (e) {}
        }
      },

      onOnlineCustomersLoaded: (cloudCustomers, fromCloud) => {
        if (fromCloud) {
          setOnlineCustomers(cloudCustomers);
          try {
            localStorage.setItem(`biz_online_customers_${currentUserId}`, JSON.stringify(cloudCustomers));
          } catch (e) {}
        }
      },

      onOnlineSettingsLoaded: (cloudOnlineSettings, fromCloud) => {
        if (fromCloud && cloudOnlineSettings) {
          setSettings((prev) => ({
            ...prev,
            onlineBusiness: {
              ...(prev.onlineBusiness || defaultOnlineBusinessSettings),
              ...cloudOnlineSettings,
            },
          }));
        }
      },

      onPersonalContactsLoaded: (cloudContacts, fromCloud) => {
        if (fromCloud) {
          setPersonalContacts(cloudContacts);
          try {
            localStorage.setItem(`biz_personal_contacts_${currentUserId}`, JSON.stringify(cloudContacts));
          } catch (e) {}
        }
      },

      onPersonalTransactionsLoaded: (cloudTransactions, fromCloud) => {
        if (fromCloud) {
          setPersonalTransactions(cloudTransactions);
          try {
            localStorage.setItem(`biz_personal_transactions_${currentUserId}`, JSON.stringify(cloudTransactions));
          } catch (e) {}
        }
      },

      onSyncStatusChanged: (status) => {
        setIsCloudSynced(status === 'synced');
      },
    });

    setIsCloudSynced(true);

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // POS Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync LocalStorage
  useEffect(() => {
    localStorage.setItem('biz_language', language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('biz_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Demo data must never overwrite a real store's local cache.
    if (isDemoMode) return;
    localStorage.setItem('biz_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (isDemoMode) return;
    localStorage.setItem('biz_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    if (isDemoMode) return;
    localStorage.setItem('biz_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    if (isDemoMode) return;
    localStorage.setItem('biz_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    if (isDemoMode) return;
    localStorage.setItem('biz_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Generated Product POS / QR Code Limit Tracking State (Store Isolated)
  const [generatedProductCodes, setGeneratedProductCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`biz_generated_codes_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Re-sync when store/user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`biz_generated_codes_${user?.id || 'default'}`);
      setGeneratedProductCodes(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setGeneratedProductCodes([]);
    }
  }, [user?.id]);

  // Persist to LocalStorage per store
  useEffect(() => {
    try {
      localStorage.setItem(`biz_generated_codes_${user?.id || 'default'}`, JSON.stringify(generatedProductCodes));
    } catch (e) {}
  }, [generatedProductCodes, user?.id]);

  // Real-time cleanup: automatically remove orphaned product codes when a product is deleted
  useEffect(() => {
    setGeneratedProductCodes((prev) => {
      const valid = prev.filter((id) => products.some((p) => p.id === id));
      if (valid.length !== prev.length) {
        return valid;
      }
      return prev;
    });
  }, [products]);

  // Generated Product Unit QR Code Count Tracking (Store Isolated)
  const [productQRCounts, setProductQRCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`biz_product_qr_counts_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Re-sync productQRCounts when store/user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`biz_product_qr_counts_${user?.id || 'default'}`);
      setProductQRCounts(saved ? JSON.parse(saved) : {});
    } catch (e) {
      setProductQRCounts({});
    }
  }, [user?.id]);

  // Persist productQRCounts to LocalStorage per store
  useEffect(() => {
    try {
      localStorage.setItem(`biz_product_qr_counts_${user?.id || 'default'}`, JSON.stringify(productQRCounts));
    } catch (e) {}
  }, [productQRCounts, user?.id]);

  // Real-time cleanup for unit QR code counts
  useEffect(() => {
    setProductQRCounts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        if (!products.some((p) => p.id === id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [products]);

  const getGeneratedQRCount = (productId: string): number => {
    if (!productId) return 0;
    if (typeof productQRCounts[productId] === 'number') {
      return productQRCounts[productId];
    }
    return generatedProductCodes.includes(productId) ? 1 : 0;
  };

  const recordGeneratedQRCodes = (
    productId: string,
    requestedCount: number
  ): { success: boolean; message?: string } => {
    if (!productId) return { success: false, message: 'Invalid product selected.' };

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, message: 'Product not found in current store.' };
    }

    const existingQRCount = getGeneratedQRCount(productId);
    const countToAdd = Math.max(1, Number(requestedCount) || 1);
    const newTotal = existingQRCount + countToAdd;
    const nextCounts = {
      ...productQRCounts,
      [productId]: newTotal,
    };
    setProductQRCounts(nextCounts);

    let nextCodes = generatedProductCodes;
    if (!generatedProductCodes.includes(productId)) {
      nextCodes = [...generatedProductCodes, productId];
      setGeneratedProductCodes(nextCodes);
    }

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'qrTracking', {
        generatedCodes: nextCodes,
        productQRCounts: nextCounts,
      });
    }

    return { success: true };
  };

  const recordGeneratedCode = (productId: string): boolean => {
    if (!productId) return false;
    const res = recordGeneratedQRCodes(productId, 1);
    return res.success;
  };

  const isCodeGenerated = (productId: string): boolean => {
    return generatedProductCodes.includes(productId) || (productQRCounts[productId] || 0) > 0;
  };

  const removeGeneratedCode = (productId: string) => {
    const nextCodes = generatedProductCodes.filter((id) => id !== productId);
    const nextCounts = { ...productQRCounts };
    delete nextCounts[productId];

    setGeneratedProductCodes(nextCodes);
    setProductQRCounts(nextCounts);

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'qrTracking', {
        generatedCodes: nextCodes,
        productQRCounts: nextCounts,
      });
    }
  };

  // Team, Payroll, Audit & Loyalty Cloud Handlers
  const saveTeamMembers = (updated: TeamMember[]) => {
    setTeamMembers(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'team', { items: updated });
      try {
        localStorage.setItem(`biz_team_members_${uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const saveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'payroll', {
        employees: updated,
        payments: payrollPayments,
        adjustments: salaryAdjustments,
      });
      try {
        localStorage.setItem(`biz_employees_${uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const savePayrollPayments = (updated: PayrollPayment[]) => {
    setPayrollPayments(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'payroll', {
        employees,
        payments: updated,
        adjustments: salaryAdjustments,
      });
      try {
        localStorage.setItem(`biz_payroll_payments_${uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const saveSalaryAdjustments = (updated: SalaryAdjustment[]) => {
    setSalaryAdjustments(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'payroll', {
        employees,
        payments: payrollPayments,
        adjustments: updated,
      });
      try {
        localStorage.setItem(`biz_salary_adjustments_${uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const saveAuditLogs = (updated: AuditLogEntry[]) => {
    setAuditLogs(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'auditLogs', { items: updated });
      try {
        localStorage.setItem(`biz_audit_logs_${uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const saveLoyaltySettings = (updated: CustomerLoyaltySettings) => {
    setLoyaltySettings(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      saveUserCloudCollection(uid, 'loyalty', { settings: updated });
      try {
        localStorage.setItem(`biz_loyalty_settings_${uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  // Language & Theme helpers with persistence and document direction (RTL)
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('biz_language', lang);
      localStorage.setItem('biz_landing_language', lang);
      localStorage.setItem('biz_language_manually_set', 'true');
    } catch (e) {}

    if (user && user.id) {
      try {
        const userRef = doc(db, 'users', user.id);
        updateDoc(userRef, { preferredLanguage: lang }).catch((err) => {
          console.warn('Failed to update preferredLanguage in Firestore:', err);
        });
      } catch (e) {}
    }
  };

  // Landing Page Auto Country-Based Language Detection for unauthenticated visitors
  useEffect(() => {
    // DO NOT run auto-detection if user is authenticated or if language was manually set by visitor
    if (user) return;

    const manuallySet = localStorage.getItem('biz_language_manually_set');
    if (manuallySet === 'true') return;

    const savedLang = localStorage.getItem('biz_landing_language') || localStorage.getItem('biz_language');
    if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.code === savedLang)) {
      setLanguageState(savedLang as Language);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const detectVisitorCountry = async () => {
      try {
        let countryName = '';
        let countryCode = '';

        try {
          const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            countryName = data.country_name || '';
            countryCode = data.country_code || data.country || '';
          }
        } catch (e) {
          try {
            const res2 = await fetch('https://ipwho.is/', { signal: controller.signal });
            if (res2.ok) {
              const data2 = await res2.json();
              countryName = data2.country || '';
              countryCode = data2.country_code || '';
            }
          } catch (e2) {}
        }

        if (!isMounted) return;

        if (countryName || countryCode) {
          const detected = getDefaultLanguageForCountry(countryName || countryCode);
          setLanguageState(detected);
        } else {
          const browserLang = (navigator.language || '').split('-')[0];
          if (SUPPORTED_LANGUAGES.some((l) => l.code === browserLang)) {
            setLanguageState(browserLang as Language);
          }
        }
      } catch (err) {
        // Silent fallback
      } finally {
        clearTimeout(timer);
      }
    };

    detectVisitorCountry();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [user]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('biz_theme', newTheme);
    } catch (e) {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const t = (key: string): string => {
    if (!key) return '';
    let val = translations[language]?.[key] || translations['en']?.[key];
    if (val) return val;

    if (key.includes('.')) {
      const parts = key.split('.');
      let currLang: any = translations[language];
      let currEn: any = translations['en'];
      for (const p of parts) {
        if (currLang && typeof currLang === 'object') currLang = currLang[p];
        else currLang = undefined;
        if (currEn && typeof currEn === 'object') currEn = currEn[p];
        else currEn = undefined;
      }
      if (typeof currLang === 'string') return currLang;
      if (typeof currEn === 'string') return currEn;
    }

    return translations['en']?.[key] || key;
  };

  const formatNumber = (val: number | string | undefined | null, options?: { decimals?: number; useGrouping?: boolean }) => {
    return formatNumberHelper(val, language, options);
  };

  const storeBaseCurrency =
    settings.baseCurrency ||
    (user?.country && isBangladeshCountry(user.country) ? 'BDT' : undefined) ||
    normalizeCurrencyCode(user?.currency) ||
    'BDT';

  const displayCurrency = normalizeCurrencyCode(settings.currency || 'BDT');
  const displayCurrencySymbol = getCurrencySymbol(displayCurrency);

  const formatCurrency = (
    amount: number | string | undefined | null,
    options?: FormatMoneyOptions & { sourceCurrency?: string; displayCurrency?: string }
  ) => {
    const source = options?.sourceCurrency || storeBaseCurrency;
    const target = options?.displayCurrency || displayCurrency;
    return formatMoneyWithRates(amount, source, target, language, options);
  };

  const formatMoney = (
    amount: number | string | undefined | null,
    sourceCurrency: string = storeBaseCurrency,
    displayCurrencyParam: string = displayCurrency,
    localeParam: Language | string = language,
    options?: FormatMoneyOptions
  ) => {
    return formatMoneyWithRates(amount, sourceCurrency, displayCurrencyParam, localeParam, options);
  };

  // Pure, deterministic, deduplicated notification calculation engine
  const notifications = React.useMemo(() => {
    return generateSystemNotifications({
      products,
      customers,
      sales,
      manualNotifications,
      readMap: readNotificationIds,
      formatCurrency: (amt: number) => formatCurrency(amt),
      language,
      storeId: user?.id,
    });
  }, [products, customers, sales, manualNotifications, readNotificationIds, formatCurrency, language, user?.id]);

  const convertMoney = (
    amount: number,
    fromCurrency: string = storeBaseCurrency,
    toCurrency: string = displayCurrency
  ) => {
    return convertCurrencyWithRates(amount, fromCurrency, toCurrency);
  };

  const getExchangeRate = async (fromCurrency: string, toCurrency?: string) => {
    return getExchangeRateHelper(fromCurrency, toCurrency);
  };

  const formatDate = (dateStr: string | Date | undefined | null) => {
    return formatDateHelper(dateStr, language);
  };

  // Log activity helper
  const logActivity = (action: string, actionBn: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      action,
      actionBn,
      userName: user ? user.ownerName : 'System',
      timestamp: new Date().toLocaleString(),
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Auth methods using Supabase Auth & PostgreSQL
  const login = async (emailInput: string, passInput: string): Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !passInput) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    const tStart = performance.now();
    console.log(`[Supabase Auth] Login started: ${cleanEmail}`);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: passInput,
      });

      if (authError) {
        console.warn('[Supabase Auth Error]:', authError.message);
        let message = authError.message;
        if (
          authError.message.includes('Invalid login credentials') ||
          authError.message.includes('invalid_grant')
        ) {
          message = 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করেছেন। অনুগ্রহ করে সঠিক তথ্য দিন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।';
        } else if (authError.message.includes('Email not confirmed')) {
          message = 'আপনার ইমেইলটি এখনো নিশ্চিত করা হয়নি। দয়া করে ইনবক্স চেক করুন।';
        }
        return { success: false, message };
      }

      const sbUser = authData.user;
      if (!sbUser) {
        return { success: false, message: 'Failed to retrieve authenticated user session.' };
      }

      console.log(`[Supabase Auth] Login successful for: ${cleanEmail} in ${(performance.now() - tStart).toFixed(1)}ms`);

      const isAdmin = isTeamStockAdmin(cleanEmail);
      let uData = await getSupabaseUser(sbUser.id);
      if (!uData && cleanEmail) {
        uData = await getSupabaseUserByEmail(cleanEmail);
      }

      const meta = sbUser.user_metadata || {};
      const fullName = uData?.full_name || uData?.ownerName || meta.full_name || cleanEmail.split('@')[0] || (isAdmin ? 'Admin Owner' : 'Store Owner');
      const brandName = uData?.brand_name || uData?.storeName || meta.brand_name || 'My Store';
      const roleRaw = uData?.role || meta.role || 'Owner';
      const normalizedRole: UserRole = (isAdmin || !roleRaw || roleRaw.toString().toLowerCase() === 'owner' || roleRaw.toString().toLowerCase() === 'admin' || roleRaw.toString().toLowerCase() === 'platformowner') ? 'Owner' : 'Manager';

      const loginAccountStatus = (uData?.status || '').toString().toLowerCase();
      if (
        (loginAccountStatus === 'suspended' || loginAccountStatus === 'blocked') &&
        !isAdmin &&
        sbUser.id !== 'usr-demo-merchant-01'
      ) {
        setAccountBlocked({ email: cleanEmail, status: loginAccountStatus as 'suspended' | 'blocked' });
        await supabase.auth.signOut();
        setUser(null);
        return {
          success: false,
          message:
            loginAccountStatus === 'blocked'
              ? 'Your account has been blocked by the platform administrator.'
              : 'Your account has been suspended by the platform administrator.',
        };
      }

      const rawPlan = (uData?.plan || meta.plan || 'Free').toString();
      const subPlan: SubscriptionPlan = isAdmin ? 'Lifetime' : (
        rawPlan.toLowerCase() === 'lifetime' ? 'Lifetime' :
        rawPlan.toLowerCase() === 'premium' ? 'Premium' :
        rawPlan.toLowerCase() === 'pro' ? 'Pro' : 'Free'
      );

      const foundUser: UserProfile = {
        id: sbUser.id,
        brandName: brandName,
        ownerName: fullName,
        fullName: fullName,
        name: fullName,
        mobile: uData?.phone || meta.phone || '',
        email: cleanEmail,
        businessType: uData?.business_type || meta.business_type || 'General Retail & Grocery',
        country: uData?.country || meta.country || 'Bangladesh',
        currency: uData?.currency || '৳',
        timeZone: 'Asia/Dhaka',
        role: normalizedRole,
        subscriptionPlan: subPlan,
        subscriptionStatus: (uData?.subscription_status || 'active') as any,
        status: 'active',
        storeAddress: uData?.store_address || '',
        affiliateCode: uData?.affiliate_code || '',
        verifiedEmail: true,
        verifiedPhone: true,
        createdAt: uData?.created_at ? new Date(uData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };

      // Ensure record in Supabase PostgreSQL
      await upsertSupabaseUser({
        id: sbUser.id,
        email: cleanEmail,
        ownerName: fullName,
        brandName: brandName,
        businessType: foundUser.businessType,
        mobile: foundUser.mobile,
        role: normalizedRole,
        subscriptionPlan: subPlan,
        subscriptionStatus: 'active',
        currency: foundUser.currency,
      });

      setAccountBlocked(null);
      setUser(foundUser);
      setIsEmailVerified(true);
      if (foundUser.brandName) {
        setSettings((prev) => ({ ...prev, brandName: foundUser.brandName }));
      }

      if (foundUser.role === 'Owner') {
        setActiveTab('owner');
      } else {
        setActiveTab('dashboard');
      }

      logActivity('User Logged In', 'ব্যবহারকারী লগইন করেছে', cleanEmail);
      return { success: true };
    } catch (error: any) {
      console.warn('[Supabase Auth Notice] Login notice:', error?.message || error);
      return { success: false, message: error?.message || 'Failed to sign in.' };
    }
  };

  const signup = async (data: Partial<UserProfile> & { password?: string }): Promise<{ success: boolean; message?: string; requiresEmailVerification?: boolean }> => {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const pass = data.password || '';

    if (!cleanEmail || !pass) {
      return {
        success: false,
        message: 'Please provide both email and password.',
      };
    }

    try {
      console.log('[Supabase Auth] Attempting signUp...', { email: cleanEmail });
      const fullName = data.ownerName || data.fullName || 'Store Owner';
      const storeName = data.brandName || 'My Store';
      const storeType = data.businessType || 'General Retail & Grocery';
      const phone = data.mobile || '';
      const userCountry = data.country || 'Bangladesh';
      const userPrefLang = data.preferredLanguage || language || 'en';
      const isAdmin = isTeamStockAdmin(cleanEmail);
      const assignedRole: UserRole = 'Owner';
      const assignedPlan: SubscriptionPlan = isAdmin ? 'Lifetime' : 'Free';

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            brand_name: storeName,
            business_type: storeType,
            phone: phone,
            role: assignedRole,
            plan: assignedPlan,
          },
        },
      });

      if (authErr) {
        console.warn('[Supabase Auth SignUp Error]:', authErr.message);
        let message = authErr.message;
        if (
          authErr.message.includes('User already registered') ||
          authErr.message.includes('already exists')
        ) {
          message = 'An account with this email address already exists. Please log in.';
        } else if (authErr.message.includes('Password should be at least')) {
          message = 'Password should be at least 6 characters.';
        }
        return { success: false, message };
      }

      const sbUser = authData.user;
      const userId = sbUser?.id || `user_${Date.now()}`;

      // Persist user record in Supabase users table
      await upsertSupabaseUser({
        id: userId,
        email: cleanEmail,
        ownerName: fullName,
        brandName: storeName,
        businessType: storeType,
        mobile: phone,
        role: assignedRole,
        subscriptionPlan: assignedPlan,
        subscriptionStatus: 'active',
        currency: data.currency || (userCountry === 'Bangladesh' ? '৳' : '$'),
      });

      const newUser: UserProfile = {
        id: userId,
        brandName: storeName,
        ownerName: fullName,
        fullName: fullName,
        name: fullName,
        mobile: phone,
        email: cleanEmail,
        businessType: storeType,
        country: userCountry,
        preferredLanguage: userPrefLang as Language,
        currency: data.currency || (userCountry === 'Bangladesh' ? '৳' : '$'),
        timeZone: data.timeZone || (userCountry === 'Bangladesh' ? 'Asia/Dhaka' : 'UTC'),
        role: assignedRole,
        subscriptionPlan: assignedPlan,
        subscriptionStatus: 'active',
        storeAddress: data.storeAddress || '',
        affiliateCode: data.affiliateCode || '',
        // Remember the plan the visitor picked on the pricing page so the
        // subscription view can offer it after the account is created.
        pendingPlan: data.pendingPlan,
        verifiedEmail: true,
        verifiedPhone: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setLanguageState(userPrefLang as Language);
      localStorage.setItem('biz_language', userPrefLang);
      localStorage.setItem('biz_language_manually_set', 'true');
      setUser(newUser);
      setIsEmailVerified(true);
      if (storeName) {
        setSettings((prev) => ({ ...prev, brandName: storeName }));
      }
      setActiveTab('owner');

      logActivity('User Registered Account', `নতুন অ্যাকাউন্ট তৈরি করা হয়েছে (Supabase)`, cleanEmail);
      return {
        success: true,
        requiresEmailVerification: false,
        message: 'Account created successfully!',
      };
    } catch (error: any) {
      console.warn('[Supabase Auth Notice] Signup notice:', error?.message || error);
      let message = error.message || 'Failed to create account.';
      return { success: false, message };
    }
  };

  // Sign in with Google via Supabase OAuth. The Google provider must be
  // enabled in Supabase Auth settings with a Google Cloud OAuth client;
  // until then this returns the provider error. On success the browser
  // redirects to Google and the onAuthStateChange listener completes the
  // session (syncSupabaseProfile) when the user returns.
  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        console.warn('[Supabase Auth Google Error]:', error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('[Supabase Auth Google Notice]:', err?.message || err);
      return { success: false, message: err?.message || 'Google sign-in failed.' };
    }
  };

  // Send a 6-digit email OTP login code via Supabase Auth (built-in email
  // OTP — no backend API needed). Only works for existing accounts.
  const sendLoginCode = async (emailInput: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your email address.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });
      if (error) {
        console.warn('[Supabase Auth OTP Send Error]:', error.message);
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.warn('[Supabase Auth OTP Send Notice]:', err?.message || err);
      return { success: false, message: err?.message || 'Failed to send login code.' };
    }
  };

  // Verify a 6-digit email OTP login code and complete the session.
  const verifyLoginCode = async (emailInput: string, token: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = (emailInput || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();
    if (!cleanEmail || !cleanToken) {
      return { success: false, message: 'Email and 6-digit code are required.' };
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
      if (error) {
        console.warn('[Supabase Auth OTP Verify Error]:', error.message);
        return { success: false, message: error.message };
      }
      if (data.user) {
        await syncSupabaseProfile(data.user);
      }
      return { success: true };
    } catch (err: any) {
      console.warn('[Supabase Auth OTP Verify Notice]:', err?.message || err);
      return { success: false, message: err?.message || 'Failed to verify login code.' };
    }
  };

  // Email-verification OTP removed (audit b.3): the /api/auth/* Resend flow
  // never ran live (static Vercel build) and Supabase "Confirm email" is OFF,
  // so no verification screen or OTP is needed. The working Supabase login
  // OTP (sendLoginCode / verifyLoginCode) is untouched.

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (sbErr) {
      console.warn('Supabase signOut notice:', sbErr);
    }
    setUser(null);
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setSuppliers([]);
    setExpenses([]);
    setPurchases([]);
    setAdjustments([]);
    setDueCollections([]);
    setTeamMembers([]);
    setEmployees([]);
    setPayrollPayments([]);
    setSalaryAdjustments([]);
    setAuditLogs([]);
    setCart([]);
    setIsCloudSynced(false);
    try {
      localStorage.setItem('biz_user', 'null');
    } catch (e) {}
    logActivity('User Logged Out', 'ব্যবহারকারী লগআউট করেছে');
  };

  // Demo Mode: guest preview of the real dashboard with sample data.
  // No account, no password, no cloud writes. The demo user is never
  // persisted, so reloading the page ends the demo.
  const enterDemoMode = () => {
    const demoUser = initialRegisteredUsers[0];
    setIsDemoMode(true);
    setIsEmailVerified(true);
    setUser({ ...demoUser });
    setProducts(demoProducts);
    setCategories(demoCategories);
    setBrands(demoBrands);
    setCustomers(demoCustomers);
    setSuppliers(demoSuppliers);
    setExpenses(demoExpenses);
    setSales(demoSales);
    setPurchases(demoPurchases);
    setActiveTab('dashboard');
  };

  const exitDemoMode = async (): Promise<void> => {
    setIsDemoMode(false);
    await logout();
  };

  // Owner Panel User Management Handlers
  const updateUserRole = (userId: string, newRole: UserRole) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, role: newRole } : prev));
    }
    try {
      const userRef = doc(db, 'users', userId);
      updateDoc(userRef, { role: newRole });
    } catch (e) {
      console.warn('Firestore user role update notice:', e);
    }
    logActivity('Updated User Role', 'ব্যবহারকারীর রোল পরিবর্তন করা হয়েছে', `${userId} -> ${newRole}`);
  };

  const sendSupabasePasswordReset = async (emailInput: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস প্রদান করুন।' };
    }
    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://yearmedia.xyz';
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectOrigin,
      });
      if (sbError) {
        console.warn('[Supabase Auth] Password reset failed:', sbError.message);
        return {
          success: false,
          message: `পাসওয়ার্ড রিসেট ইমেইল পাঠানো যায়নি: ${sbError.message}`,
        };
      }
      return {
        success: true,
        message: `পাসওয়ার্ড রিসেট লিংক (${cleanEmail}) ইমেইলে পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।`,
      };
    } catch (error: any) {
      console.warn('Password reset failed:', error);
      return {
        success: false,
        message: 'পাসওয়ার্ড রিসেট ইমেইল পাঠানো যায়নি। আবার চেষ্টা করুন।',
      };
    }
  };

  const suspendUser = async (userId: string) => {
    const ok = await updateSupabaseUserStatus(userId, 'suspended');
    if (!ok) {
      console.warn('[Supabase DB] suspendUser failed for', userId);
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' } : u))
    );
    if (user && user.id === userId) {
      setAccountBlocked({ email: user.email, status: 'suspended' });
      supabase.auth.signOut().catch(() => {});
      setUser(null);
    }
    logActivity('Suspended User Account', 'ব্যবহারকারী স্থগিত করা হয়েছে', userId);
  };

  const activateUser = async (userId: string) => {
    const ok = await updateSupabaseUserStatus(userId, 'active');
    if (!ok) {
      console.warn('[Supabase DB] activateUser failed for', userId);
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
    );
    if (user && user.id === userId) {
      setAccountBlocked(null);
    }
    logActivity('Activated User Account', 'ব্যবহারকারী সক্রিয় করা হয়েছে', userId);
  };

  const blockUser = async (userId: string) => {
    const ok = await updateSupabaseUserStatus(userId, 'blocked');
    if (!ok) {
      console.warn('[Supabase DB] blockUser failed for', userId);
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'blocked' } : u))
    );
    if (user && user.id === userId) {
      setAccountBlocked({ email: user.email, status: 'blocked' });
      supabase.auth.signOut().catch(() => {});
      setUser(null);
    }
    logActivity('Blocked User Account', 'ব্যবহারকারীর অ্যাকাউন্ট ব্লক করা হয়েছে', userId);
  };

  const unblockUser = async (userId: string) => {
    const ok = await updateSupabaseUserStatus(userId, 'active');
    if (!ok) {
      console.warn('[Supabase DB] unblockUser failed for', userId);
      return;
    }
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
    );
    if (user && user.id === userId) {
      setAccountBlocked(null);
    }
    logActivity('Unblocked User Account', 'অ্যাকাউন্ট আনব্লক করা হয়েছে', userId);
  };

  const deleteUser = async (userId: string) => {
    const ok = await deleteSupabaseUserRow(userId);
    if (!ok) {
      console.warn('[Supabase DB] deleteUser failed for', userId);
      return;
    }
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    if (user && user.id === userId) {
      supabase.auth.signOut().catch(() => {});
      setUser(null);
    }
    // NOTE: only the public.users row is deleted. The Supabase Auth
    // identity cannot be deleted from the frontend (needs service_role);
    // with no profile row the account can no longer use the app.
    logActivity('Deleted User Account', 'অ্যাকোউন্ট ডিঅ্যাক্টিভেট/মুছে ফেলা হয়েছে', userId);
  };

  const updateUserData = async (userId: string, data: Partial<UserProfile>) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...data } : u))
    );
    if (user && (user.id === userId || user.email === data.email)) {
      setUser((prev) => (prev ? { ...prev, ...data } : prev));
    }
    try {
      const userRef = doc(db, 'users', userId);
      const fsData: Record<string, any> = {};
      if (data.ownerName !== undefined) { fsData.ownerName = data.ownerName; fsData.fullName = data.ownerName; }
      if (data.brandName !== undefined) { fsData.brandName = data.brandName; fsData.storeName = data.brandName; }
      if (data.mobile !== undefined) { fsData.mobile = data.mobile; fsData.phone = data.mobile; }
      if (data.email !== undefined) { fsData.email = data.email; }
      if (data.businessType !== undefined) { fsData.businessType = data.businessType; fsData.storeType = data.businessType; }
      if (data.role !== undefined) { fsData.role = data.role.toLowerCase(); }
      if (data.subscriptionPlan !== undefined) {
        fsData.subscriptionPlan = data.subscriptionPlan;
        fsData.subscription = data.subscriptionPlan.toLowerCase();
        fsData.subscriptionStatus = 'active';
        fsData.pendingPlan = deleteField();
      }
      if (data.status !== undefined) { fsData.status = data.status; }
      if (data.notes !== undefined) { fsData.notes = data.notes; }
      if (data.dashboardPreferences !== undefined) {
        fsData.dashboardPreferences = data.dashboardPreferences;
        if (user && (user.id === userId || user.email === data.email)) {
          setDashboardPreferences(data.dashboardPreferences);
          localStorage.setItem('biz_dashboard_preferences', JSON.stringify(data.dashboardPreferences));
          localStorage.setItem(`biz_dashboard_preferences_${userId}`, JSON.stringify(data.dashboardPreferences));
        }
      }
      await setDoc(userRef, fsData, { merge: true });
    } catch (e) {
      console.warn('Firestore updateUserData notice:', e);
    }
    logActivity('Updated User Profile', 'ব্যবহারকারীর তথ্য পরিবর্তন করা হয়েছে', userId);
  };

  const refreshUsers = async (): Promise<void> => {
    try {
      const list = await getSupabaseAllUsers();
      setAllUsers(list);
    } catch (e) {
      console.warn('refreshUsers error:', e);
    }
  };

  const resetUserPassword = (userId: string, _newPass: string) => {
    // The frontend cannot set an arbitrary password for another user.
    // Send a Supabase password-reset email to the account instead; the
    // typed new password is intentionally never stored anywhere.
    // (Previously this wrote the plaintext password to Firestore.)
    const target = allUsers.find((u) => u.id === userId);
    const targetEmail = (target?.email || '').trim().toLowerCase();
    if (targetEmail) {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://yearmedia.xyz';
      supabase.auth
        .resetPasswordForEmail(targetEmail, { redirectTo: redirectOrigin })
        .then(
          ({ error }) => {
            if (error) console.warn('[Supabase Auth] Owner password reset notice:', error.message);
          },
          (err) => console.warn('[Supabase Auth] Owner password reset notice:', err)
        );
    } else {
      console.warn('[Supabase Auth] Owner password reset: no email found for user', userId);
    }
    logActivity('Reset User Password', 'পাসওয়ার্ড পরিবর্তন করা হয়েছে', userId);
  };

  const isMatchingUser = (
    userItem: { id?: string; email?: string } | null | undefined,
    targetId?: string,
    targetEmail?: string
  ): boolean => {
    if (!userItem) return false;
    const uId = userItem.id ? String(userItem.id).trim().toLowerCase() : '';
    const uEmail = userItem.email ? String(userItem.email).trim().toLowerCase() : '';
    const tId = targetId ? String(targetId).trim().toLowerCase() : '';
    const tEmail = targetEmail ? String(targetEmail).trim().toLowerCase() : '';

    if (tId && uId && uId === tId) return true;
    if (tEmail && uEmail && uEmail === tEmail) return true;
    if (tId && uEmail && uEmail === tId) return true;
    if (tEmail && uId && uId === tEmail) return true;
    return false;
  };

  const updateUserPlan = async (userId: string, newPlan: SubscriptionPlan, billingPeriod: BillingCycle = 'monthly') => {
    const startDate = new Date().toISOString();
    const expiryDate = newPlan === 'Lifetime' || newPlan === 'Free' ? undefined : calculateSubscriptionExpiry(startDate, billingPeriod);

    const targetUser = allUsers.find((u) => isMatchingUser(u, userId)) || (isMatchingUser(user, userId) ? user : null);
    const existingOwned = Array.isArray(targetUser?.ownedPlans) && targetUser.ownedPlans.length > 0
      ? targetUser.ownedPlans
      : [targetUser?.subscriptionPlan || 'Free'];
    const newOwnedSet = new Set<SubscriptionPlan>([...existingOwned, newPlan, 'Free']);
    if (newPlan === 'Premium' || newPlan === 'Business') {
      newOwnedSet.add('Pro');
    }
    const newOwnedPlans = Array.from(newOwnedSet);

    setAllUsers((prev) =>
      prev.map((u) =>
        isMatchingUser(u, userId)
          ? {
              ...u,
              subscriptionPlan: newPlan,
              subscriptionStatus: 'active',
              startDate,
              expiryDate,
              billingPeriod,
              pendingPlan: undefined,
              ownedPlans: newOwnedPlans,
            }
          : u
      )
    );
    if (user && isMatchingUser(user, userId)) {
      const updatedUser: UserProfile = {
        ...user,
        subscriptionPlan: newPlan,
        subscriptionStatus: 'active',
        startDate,
        expiryDate,
        billingPeriod,
        pendingPlan: undefined,
        ownedPlans: newOwnedPlans,
      };
      setUser(updatedUser);
      try {
        localStorage.setItem('biz_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }

    try {
      await updateSupabaseUserPlan(userId, newPlan, 'active', expiryDate, targetUser?.email);
    } catch (e) {}

    try {
      const userRef = doc(db, 'users', userId);
      const updateData: Record<string, any> = {
        subscriptionPlan: newPlan,
        subscription: newPlan.toLowerCase(),
        subscriptionStatus: 'active',
        startDate,
        billingPeriod,
        pendingPlan: deleteField(),
        ownedPlans: newOwnedPlans,
      };
      if (expiryDate) {
        updateData.expiryDate = expiryDate;
      } else {
        updateData.expiryDate = deleteField();
      }
      await setDoc(userRef, updateData, { merge: true });

      if (targetUser?.email && targetUser.email !== userId) {
        const emailRef = doc(db, 'users', targetUser.email);
        await setDoc(emailRef, updateData, { merge: true });
      }
    } catch (e) {
      console.warn('[AppContext] Failed to persist updateUserPlan to Firestore:', e);
    }

    logActivity('Directly Updated User Plan', 'ব্যবহারকারীর প্ল্যান রেনু/আপগ্রেড করা হয়েছে', `${userId} -> ${newPlan}`);
  };

  const activateUserSubscription = async (params: {
    userId: string;
    plan: SubscriptionPlan;
    billingPeriod: BillingCycle;
    paymentMethod?: string;
    paymentProvider?: string;
    paymentRegion?: 'international' | 'bangladesh';
    transactionId?: string;
    amount?: number;
    currency?: string;
  }): Promise<void> => {
    const { userId, plan, billingPeriod, paymentMethod, paymentProvider, paymentRegion, transactionId, amount, currency } = params;
    const startDate = new Date().toISOString();
    const expiryDate = plan === 'Lifetime' || plan === 'Free' ? undefined : calculateSubscriptionExpiry(startDate, billingPeriod);

    console.log(`[AppContext] Activating subscription for user ${userId}: plan=${plan}, cycle=${billingPeriod}, txId=${transactionId}`);

    const targetUser = allUsers.find((u) => isMatchingUser(u, userId)) || (isMatchingUser(user, userId) ? user : null);
    const existingOwned = Array.isArray(targetUser?.ownedPlans) && targetUser.ownedPlans.length > 0
      ? targetUser.ownedPlans
      : [targetUser?.subscriptionPlan || 'Free'];
    const newOwnedSet = new Set<SubscriptionPlan>([...existingOwned, plan, 'Free']);
    if (plan === 'Premium' || plan === 'Business') {
      newOwnedSet.add('Pro');
    }
    const newOwnedPlans = Array.from(newOwnedSet);

    // Update Supabase
    try {
      await updateSupabaseUserPlan(userId, plan, 'active', expiryDate, targetUser?.email);
    } catch (e) {}

    // 1. Update Firestore user profile
    try {
      const userRef = doc(db, 'users', userId);
      const userDocUpdate: Record<string, any> = {
        subscriptionPlan: plan,
        subscription: plan.toLowerCase(),
        subscriptionStatus: 'active',
        startDate,
        billingPeriod,
        billingCycle: billingPeriod,
        paymentMethod: paymentMethod || paymentProvider || 'Online Payment',
        paymentProvider: paymentProvider || paymentMethod || 'Online Payment',
        paymentRegion: paymentRegion || 'international',
        transactionId: transactionId || `TX_${Date.now()}`,
        pendingPlan: deleteField(),
        ownedPlans: newOwnedPlans,
      };
      if (expiryDate) {
        userDocUpdate.expiryDate = expiryDate;
      } else {
        userDocUpdate.expiryDate = deleteField();
      }

      await setDoc(userRef, userDocUpdate, { merge: true });
      if (targetUser?.email && targetUser.email !== userId) {
        const emailRef = doc(db, 'users', targetUser.email);
        await setDoc(emailRef, userDocUpdate, { merge: true });
      }
      console.log(`[AppContext] User document updated successfully in Firestore.`);
    } catch (e) {
      console.warn('[AppContext] Error updating user in Firestore:', e);
    }

    // 2. Record approved subscription document in subscriptionRequests
    try {
      const subRequestsCollection = collection(db, 'subscriptionRequests');
      await addDoc(subRequestsCollection, {
        userId,
        uid: userId,
        userEmail: targetUser?.email || '',
        userName: targetUser?.ownerName || targetUser?.fullName || 'User',
        brandName: targetUser?.brandName || '',
        currentPlan: targetUser?.subscriptionPlan || 'Free',
        requestedPlan: plan,
        plan,
        billingCycle: billingPeriod,
        billingPeriod,
        paymentMethod: paymentMethod || paymentProvider || 'Online Payment',
        paymentProvider: paymentProvider || paymentMethod || 'Online Payment',
        paymentRegion: paymentRegion || 'international',
        currency: currency || 'USD',
        transactionId: transactionId || `TX_${Date.now()}`,
        amount: amount || 0,
        status: 'approved',
        startDate,
        expiryDate: expiryDate || '',
        requestDate: startDate,
        reviewedDate: startDate,
        approvedBy: 'Instant Payment Gateway (Paddle/Direct)',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('[AppContext] Error adding approved record to subscriptionRequests:', e);
    }

    // Mark any existing pending requests for this user as approved
    setSubscriptionRequests((prev) =>
      prev.map((r) =>
        isMatchingUser({ id: r.userId, email: r.userEmail }, userId, targetUser?.email) && r.status === 'pending'
          ? {
              ...r,
              status: 'approved',
              reviewedDate: startDate,
              approvedBy: 'Instant Activation',
              startDate,
              expiryDate,
            }
          : r
      )
    );

    // 3. Update local state
    setAllUsers((prev) =>
      prev.map((u) =>
        isMatchingUser(u, userId, targetUser?.email)
          ? {
              ...u,
              subscriptionPlan: plan,
              subscriptionStatus: 'active',
              startDate,
              expiryDate,
              billingPeriod,
              transactionId,
              paymentMethod: paymentMethod || paymentProvider,
              pendingPlan: undefined,
              ownedPlans: newOwnedPlans,
            }
          : u
      )
    );

    if (user && isMatchingUser(user, userId, targetUser?.email)) {
      const updatedUser: UserProfile = {
        ...user,
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        startDate,
        expiryDate,
        billingPeriod,
        transactionId,
        paymentMethod: paymentMethod || paymentProvider,
        pendingPlan: undefined,
        ownedPlans: newOwnedPlans,
      };
      setUser(updatedUser);
      try {
        localStorage.setItem('biz_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }

    // 4. Trigger user notification
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `${plan} Plan Activated!`,
      titleBn: `${plan} প্ল্যান সক্রিয় হয়েছে!`,
      message: `Your ${plan} subscription is active and ready to use.`,
      messageBn: `আপনার ${plan} প্ল্যান সফলভাবে সক্রিয় করা হয়েছে।`,
      type: 'subscription',
      priority: 'info',
      date: new Date().toISOString().split('T')[0],
      read: false,
      linkTab: 'subscription',
    };
    addManualNotification(notif);
    logActivity('Activated Subscription', 'সাবস্ক্রিপশন সক্রিয় করা হয়েছে', `${plan} (${billingPeriod})`);
  };

  // Subscription Approval System Handlers
  const requestSubscription = async (data: {
    requestedPlan: SubscriptionPlan;
    billingCycle: BillingCycle;
    paymentMethod: string;
    paymentRegion?: 'international' | 'bangladesh';
    paymentProvider?: string;
    currency?: string;
    transactionId?: string;
    amount: number;
  }): Promise<boolean> => {
    if (!user) {
      throw new Error('User must be logged in to submit a request.');
    }

    const targetUid = user.id || user.uid || (auth.currentUser ? auth.currentUser.uid : '');
    const userEmail = user.email || (auth.currentUser ? auth.currentUser.email : '') || '';
    const generatedId = `sub_req_${Date.now()}`;

    try {
      // 1. Primary write to Supabase PostgreSQL subscription_requests table
      await createSupabaseSubscriptionRequest({
        id: generatedId,
        userId: targetUid,
        userEmail: userEmail,
        userName: user.ownerName || user.fullName || 'Merchant',
        brandName: user.brandName || user.storeName || 'My Store',
        currentPlan: user.subscriptionPlan || 'Free',
        requestedPlan: data.requestedPlan || 'Pro',
        billingCycle: data.billingCycle || 'monthly',
        paymentMethod: data.paymentMethod || 'Manual',
        paymentProvider: data.paymentProvider || data.paymentMethod || 'Manual',
        paymentRegion: data.paymentRegion || 'bangladesh',
        transactionId: data.transactionId ? String(data.transactionId).trim() : '',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        currency: data.currency || (data.paymentRegion === 'bangladesh' ? 'BDT' : 'USD'),
        status: 'pending',
      });

      // 2. Mark user subscriptionStatus as 'pending' in Supabase (keeping their current plan active until approved)
      if (targetUid) {
        try {
          await supabase
            .from('users')
            .update({
              subscription_status: 'pending',
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUid);
        } catch (uErr) {
          console.warn('Notice updating user status in Supabase:', uErr);
        }
      }

      // 3. Fallback write to Firestore (completely non-blocking, never hangs UI)
      try {
        const docRef = doc(db, 'subscriptionRequests', generatedId);
        setDoc(docRef, {
          id: generatedId,
          uid: targetUid,
          userId: targetUid,
          email: userEmail,
          userEmail: userEmail,
          userName: user.ownerName || user.fullName || 'Merchant',
          storeName: user.brandName || user.storeName || 'My Store',
          brandName: user.brandName || user.storeName || 'My Store',
          currentPlan: user.subscriptionPlan || 'Free',
          requestedPlan: data.requestedPlan || 'Pro',
          billingCycle: data.billingCycle || 'monthly',
          paymentMethod: data.paymentMethod || 'Manual',
          paymentRegion: data.paymentRegion || 'bangladesh',
          paymentProvider: data.paymentProvider || data.paymentMethod || 'Manual',
          currency: data.currency || (data.paymentRegion === 'bangladesh' ? 'BDT' : 'USD'),
          transactionId: data.transactionId ? String(data.transactionId).trim() : '',
          amount: typeof data.amount === 'number' ? data.amount : 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
          requestDate: new Date().toISOString(),
        }).catch(() => {});
      } catch (fErr) {}

      // 4. Update local user state: remains on currentPlan, but subscriptionStatus is 'pending' and pendingPlan is set
      const updatedUser: UserProfile = {
        ...user,
        pendingPlan: data.requestedPlan,
        subscriptionStatus: 'pending',
      };
      setUser(updatedUser);
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

      // 5. Add to local subscriptionRequests state so Owner Panel and user see it immediately
      const newReq: SubscriptionRequest = {
        id: generatedId,
        userId: targetUid,
        userName: user.ownerName || user.fullName || 'Merchant',
        userEmail: userEmail,
        brandName: user.brandName || user.storeName || 'My Store',
        currentPlan: user.subscriptionPlan || 'Free',
        requestedPlan: data.requestedPlan || 'Pro',
        billingCycle: data.billingCycle || 'monthly',
        paymentMethod: data.paymentMethod || 'Manual',
        paymentProvider: data.paymentProvider || data.paymentMethod || 'Manual',
        paymentRegion: data.paymentRegion || 'bangladesh',
        currency: data.currency || (data.paymentRegion === 'bangladesh' ? 'BDT' : 'USD'),
        transactionId: data.transactionId ? String(data.transactionId).trim() : '',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        status: 'pending',
        requestDate: new Date().toISOString(),
        billingPeriod: data.billingCycle || 'monthly',
      };
      setSubscriptionRequests((prev) => [newReq, ...prev.filter((r) => r.id !== generatedId)]);

      // 6. User notification
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Subscription Request Pending',
        titleBn: 'সাবস্ক্রিপশন আবেদন পেন্ডিং রয়েছে',
        message: `Your request for the ${data.requestedPlan} Plan has been submitted and is pending approval by the platform owner.`,
        messageBn: `আপনার ${data.requestedPlan} প্ল্যানের আবেদনটি সফলভাবে জমা হয়েছে এবং ওনার প্যানেলের অনুমোদনের অপেক্ষায় পেন্ডিং রয়েছে।`,
        type: 'subscription',
        priority: 'info',
        date: new Date().toISOString().split('T')[0],
        read: false,
        linkTab: 'subscription',
      };
      addManualNotification(notif);
      logActivity('Requested Subscription Upgrade', 'সাবস্ক্রিপশন আপগ্রেড আবেদন করা হয়েছে', data.requestedPlan);

      return true;
    } catch (error: any) {
      console.error('[Subscription Request Error]:', error);
      throw error;
    }
  };

  const approveSubscriptionRequest = async (requestId: string): Promise<void> => {
    const req = subscriptionRequests.find((r) => r.id === requestId);
    if (!req) return;

    const nowIso = new Date().toISOString();
    const ownerIdentifier = user?.email || user?.ownerName || 'Owner';
    const billingPeriod = req.billingCycle || req.billingPeriod || 'monthly';
    const startDate = nowIso;
    const expiryDate = req.requestedPlan === 'Lifetime' || req.requestedPlan === 'Free' ? undefined : calculateSubscriptionExpiry(startDate, billingPeriod);

    const targetUser = allUsers.find((u) => isMatchingUser(u, req.userId, req.userEmail)) || (isMatchingUser(user, req.userId, req.userEmail) ? user : null);
    const existingOwned = Array.isArray(targetUser?.ownedPlans) && targetUser.ownedPlans.length > 0
      ? targetUser.ownedPlans
      : [targetUser?.subscriptionPlan || 'Free'];
    const newOwnedSet = new Set<SubscriptionPlan>([...existingOwned, req.requestedPlan, 'Free']);
    if (req.requestedPlan === 'Premium' || req.requestedPlan === 'Business') {
      newOwnedSet.add('Pro');
    }
    const newOwnedPlans = Array.from(newOwnedSet);

    try {
      console.log('[Supabase DB] Approving request:', requestId, req.userEmail || req.userId);

      // 1. Update status in Supabase subscription_requests (records the
      // approver email, notes, and the approved start/expiry dates)
      await updateSupabaseSubscriptionRequestStatus(requestId, 'approved', {
        approvedBy: ownerIdentifier,
        startDate,
        ...(expiryDate ? { expiryDate } : {}),
      });

      // 2. Update merchant user plan in Supabase users table (by both id and email)
      await updateSupabaseUserPlan(req.userId, req.requestedPlan, 'active', expiryDate, req.userEmail);

      // 3. Fallback Firestore update
      try {
        const reqRef = doc(db, 'subscriptionRequests', requestId);
        await setDoc(reqRef, {
          status: 'approved',
          reviewedDate: nowIso,
          approvedBy: ownerIdentifier,
          startDate,
          billingPeriod,
          billingCycle: billingPeriod,
          ...(expiryDate ? { expiryDate } : {}),
        }, { merge: true });

        const userUpdateData: Record<string, any> = {
          subscriptionPlan: req.requestedPlan,
          subscription: req.requestedPlan.toLowerCase(),
          subscriptionStatus: 'active',
          startDate,
          billingPeriod,
          billingCycle: billingPeriod,
          pendingPlan: deleteField(),
          ownedPlans: newOwnedPlans,
          ...(expiryDate ? { expiryDate } : { expiryDate: deleteField() }),
        };

        if (req.userId) {
          const userRef = doc(db, 'users', req.userId);
          await setDoc(userRef, userUpdateData, { merge: true });
        }
        if (req.userEmail && req.userEmail !== req.userId) {
          const emailRef = doc(db, 'users', req.userEmail);
          await setDoc(emailRef, userUpdateData, { merge: true });
        }
      } catch (fErr) {}

      // 4. Update local subscriptionRequests state
      setSubscriptionRequests((prev) =>
        prev.map((r) =>
          r.id === requestId || (isMatchingUser({ id: r.userId, email: r.userEmail }, req.userId, req.userEmail) && r.status === 'pending')
            ? {
                ...r,
                status: 'approved',
                reviewedDate: nowIso,
                approvedBy: ownerIdentifier,
                startDate,
                expiryDate,
              }
            : r
        )
      );

      // 5. Update local allUsers and current user (if affected)
      setAllUsers((prev) =>
        prev.map((u) => {
          if (isMatchingUser(u, req.userId, req.userEmail)) {
            return {
              ...u,
              subscriptionPlan: req.requestedPlan,
              subscriptionStatus: 'active',
              startDate,
              expiryDate,
              billingPeriod,
              transactionId: req.transactionId || u.transactionId,
              paymentMethod: req.paymentMethod || req.paymentProvider || u.paymentMethod,
              pendingPlan: undefined,
              ownedPlans: newOwnedPlans,
            };
          }
          return u;
        })
      );

      if (user && isMatchingUser(user, req.userId, req.userEmail)) {
        const updatedUser: UserProfile = {
          ...user,
          subscriptionPlan: req.requestedPlan,
          subscriptionStatus: 'active',
          startDate,
          expiryDate,
          billingPeriod,
          transactionId: req.transactionId || user.transactionId,
          paymentMethod: req.paymentMethod || req.paymentProvider || user.paymentMethod,
          pendingPlan: undefined,
          ownedPlans: newOwnedPlans,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('biz_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Subscription Plan Activated!',
        titleBn: 'সাবস্ক্রিপশন প্ল্যান সক্রিয় হয়েছে!',
        message: `Your request for the ${req.requestedPlan} Plan has been reviewed and APPROVED by the owner.`,
        messageBn: `আপনার ${req.requestedPlan} প্ল্যানের আবেদনটি ওনার প্যানেল থেকে অনুমোদন করা হয়েছে এবং ফিচারগুলো সক্রিয় করা হয়েছে!`,
        type: 'subscription',
        priority: 'info',
        date: new Date().toISOString().split('T')[0],
        read: false,
        linkTab: 'subscription',
      };
      addManualNotification(notif);
      logActivity('Approved Subscription Request', 'সাবস্ক্রিপশন আবেদন অনুমোদন করা হয়েছে', req.userEmail || req.userId);
    } catch (error: any) {
      console.error('[Error approving subscription request]:', error);
    }
  };

  const cancelSubscriptionRequest = async (requestId: string, notes?: string): Promise<void> => {
    const req = subscriptionRequests.find((r) => r.id === requestId);
    if (!req) return;

    const nowIso = new Date().toISOString();
    const ownerIdentifier = user?.ownerName || user?.email || 'Owner';

    try {
      // 1. Supabase write
      await updateSupabaseSubscriptionRequestStatus(requestId, 'cancelled', { approvedBy: ownerIdentifier, notes });
      if (req.userId) {
        await updateSupabaseUserPlan(req.userId, 'free', 'cancelled', undefined, req.userEmail);
      }

      // 2. Firestore fallback
      try {
        const reqRef = doc(db, 'subscriptionRequests', requestId);
        await setDoc(
          reqRef,
          {
            status: 'cancelled',
            cancelledAt: nowIso,
            cancelledBy: ownerIdentifier,
            notes: notes ? `Cancellation Note: ${notes}` : req.notes,
          },
          { merge: true }
        );
        const cancelUserUpdate = {
          subscriptionPlan: 'Free',
          subscription: 'free',
          subscriptionStatus: 'cancelled',
          pendingPlan: deleteField(),
        };
        if (req.userId) {
          const userRef = doc(db, 'users', req.userId);
          await setDoc(userRef, cancelUserUpdate, { merge: true });
        }
        if (req.userEmail && req.userEmail !== req.userId) {
          const emailRef = doc(db, 'users', req.userEmail);
          await setDoc(emailRef, cancelUserUpdate, { merge: true });
        }
      } catch (fErr) {}

      // 3. Update local user state
      setSubscriptionRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'cancelled', notes } : r))
      );

      setAllUsers((prev) =>
        prev.map((u) => {
          if (isMatchingUser(u, req.userId, req.userEmail)) {
            return {
              ...u,
              subscriptionPlan: 'Free',
              subscriptionStatus: 'cancelled',
              pendingPlan: undefined,
              cancelledAt: nowIso,
              cancelledBy: ownerIdentifier,
            };
          }
          return u;
        })
      );

      if (user && isMatchingUser(user, req.userId, req.userEmail)) {
        const updatedUser: UserProfile = {
          ...user,
          subscriptionPlan: 'Free',
          subscriptionStatus: 'cancelled',
          pendingPlan: undefined,
          cancelledAt: nowIso,
          cancelledBy: ownerIdentifier,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('biz_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Subscription Plan Cancelled',
        titleBn: 'সাবস্ক্রিপশন বাতিল করা হয়েছে',
        message: `Your ${req.requestedPlan || req.currentPlan} Plan subscription has been cancelled.`,
        messageBn: `আপনার ${req.requestedPlan || req.currentPlan} প্ল্যানটি বাতিল করা হয়েছে।`,
        type: 'subscription',
        priority: 'info',
        date: new Date().toISOString().split('T')[0],
        read: false,
        linkTab: 'subscription',
      };
      addManualNotification(notif);
    } catch (error: any) {
      console.warn('Error cancelling subscription request:', error);
    }
  };

  const cancelUserSubscription = async (userId: string, notes?: string): Promise<void> => {
    const targetUser = allUsers.find((u) => isMatchingUser(u, userId)) || (isMatchingUser(user, userId) ? user : null);
    if (!targetUser) return;

    const nowIso = new Date().toISOString();
    const ownerIdentifier = user?.ownerName || user?.email || 'Owner';

    try {
      const userReqs = subscriptionRequests.filter(
        (r) => isMatchingUser({ id: r.userId, email: r.userEmail }, userId, targetUser.email) && (r.status === 'approved' || r.status === 'pending')
      );

      for (const req of userReqs) {
        await updateSupabaseSubscriptionRequestStatus(req.id, 'cancelled', { approvedBy: ownerIdentifier, notes });
      }
      await updateSupabaseUserPlan(userId, 'free', 'cancelled', undefined, targetUser.email);

      setAllUsers((prev) =>
        prev.map((u) => {
          if (isMatchingUser(u, userId, targetUser.email)) {
            return {
              ...u,
              subscriptionPlan: 'Free',
              subscriptionStatus: 'cancelled',
              pendingPlan: undefined,
              cancelledAt: nowIso,
              cancelledBy: ownerIdentifier,
            };
          }
          return u;
        })
      );

      if (user && isMatchingUser(user, userId, targetUser.email)) {
        const updatedUser: UserProfile = {
          ...user,
          subscriptionPlan: 'Free',
          subscriptionStatus: 'cancelled',
          pendingPlan: undefined,
          cancelledAt: nowIso,
          cancelledBy: ownerIdentifier,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('biz_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }
    } catch (error: any) {
      console.warn('Error cancelling user subscription:', error);
    }
  };

  const rejectSubscriptionRequest = async (requestId: string, notes?: string): Promise<void> => {
    const req = subscriptionRequests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      await updateSupabaseSubscriptionRequestStatus(requestId, 'rejected', { approvedBy: user?.email || user?.ownerName || 'Owner', notes });
      if (req.userId) {
        await supabase.from('users').update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', req.userId);
      }
      if (req.userEmail) {
        await supabase.from('users').update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('email', req.userEmail.toLowerCase().trim());
      }

      setSubscriptionRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected', notes } : r))
      );

      setAllUsers((prev) =>
        prev.map((u) => {
          if (isMatchingUser(u, req.userId, req.userEmail)) {
            return {
              ...u,
              subscriptionStatus: 'active',
              pendingPlan: undefined,
            };
          }
          return u;
        })
      );

      if (user && isMatchingUser(user, req.userId, req.userEmail)) {
        const updatedUser: UserProfile = {
          ...user,
          subscriptionStatus: 'active',
          pendingPlan: undefined,
        };
        setUser(updatedUser);
        try {
          localStorage.setItem('biz_user', JSON.stringify(updatedUser));
        } catch (e) {}
      }

      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Subscription Request Rejected',
        titleBn: 'সাবস্ক্রিপশন আবেদন প্রত্যাখ্যাত হয়েছে',
        message: `Your request for the ${req.requestedPlan} Plan was rejected.${notes ? ` Note: ${notes}` : ''}`,
        messageBn: `আপনার ${req.requestedPlan} প্ল্যানের আবেদন বাতিল করা হয়েছে।`,
        type: 'subscription',
        priority: 'info',
        date: new Date().toISOString().split('T')[0],
        read: false,
        linkTab: 'subscription',
      };
      addManualNotification(notif);
      logActivity('Rejected Subscription Request', 'সাবস্ক্রিপশন আবেদন প্রত্যাখ্যান করা হয়েছে', req.userEmail || req.userId);
    } catch (error) {
      console.error('Error rejecting subscription request:', error);
    }
  };

  const switchActivePlan = async (targetPlan: SubscriptionPlan): Promise<boolean> => {
    if (!user) return false;

    // Maintain and union all owned plans
    const existingOwned = Array.isArray(user.ownedPlans) && user.ownedPlans.length > 0
      ? user.ownedPlans
      : [user.subscriptionPlan || 'Free'];
    const newOwnedSet = new Set<SubscriptionPlan>([...existingOwned, targetPlan, 'Free']);
    if (targetPlan === 'Premium' || targetPlan === 'Business') {
      newOwnedSet.add('Pro');
    }
    const newOwnedPlans = Array.from(newOwnedSet);

    const updatedUser: UserProfile = {
      ...user,
      subscriptionPlan: targetPlan,
      subscriptionStatus: 'active',
      pendingPlan: undefined,
      ownedPlans: newOwnedPlans,
    };

    setUser(updatedUser);
    setAllUsers((prev) =>
      prev.map((u) =>
        isMatchingUser(u, user.id, user.email)
          ? {
              ...u,
              subscriptionPlan: targetPlan,
              subscriptionStatus: 'active',
              pendingPlan: undefined,
              ownedPlans: newOwnedPlans,
            }
          : u
      )
    );
    try {
      localStorage.setItem('biz_user', JSON.stringify(updatedUser));
    } catch (e) {}

    // Persist to Supabase
    try {
      await updateSupabaseUserPlan(user.id, targetPlan, 'active', undefined, user.email);
    } catch (sbErr) {
      console.warn('[Supabase DB] Error in switchActivePlan:', sbErr);
    }

    // Persist to Firestore
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(
        userRef,
        {
          subscriptionPlan: targetPlan,
          subscription: targetPlan.toLowerCase(),
          subscriptionStatus: 'active',
          pendingPlan: deleteField(),
          ownedPlans: newOwnedPlans,
        },
        { merge: true }
      );
      if (user.email && user.email !== user.id) {
        const emailRef = doc(db, 'users', user.email);
        await setDoc(
          emailRef,
          {
            subscriptionPlan: targetPlan,
            subscription: targetPlan.toLowerCase(),
            subscriptionStatus: 'active',
            pendingPlan: deleteField(),
            ownedPlans: newOwnedPlans,
          },
          { merge: true }
        );
      }
    } catch (fErr) {
      console.warn('[Firestore] Error in switchActivePlan:', fErr);
    }

    logActivity('Switched Active Subscription Plan', 'অ্যাক্টিভ সাবস্ক্রিপশন প্ল্যান পরিবর্তন করা হয়েছে', `${user.subscriptionPlan} -> ${targetPlan}`);

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Active Plan Switched!',
      titleBn: 'প্ল্যান সফলভাবে পরিবর্তন করা হয়েছে!',
      message: `You have successfully switched your active store plan to ${targetPlan}.`,
      messageBn: `আপনার বর্তমান স্টোরের সক্রিয় প্ল্যান ${targetPlan}-এ পরিবর্তন করা হয়েছে।`,
      type: 'subscription',
      priority: 'info',
      date: new Date().toISOString().split('T')[0],
      read: false,
      linkTab: 'subscription',
    };
    addManualNotification(notif);

    return true;
  };

  const cancelActivePendingRequest = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const userPendingReqs = subscriptionRequests.filter(
        (r) => isMatchingUser({ id: r.userId, email: r.userEmail }, user.id, user.email) && r.status === 'pending'
      );
      for (const req of userPendingReqs) {
        await updateSupabaseSubscriptionRequestStatus(req.id, 'cancelled', { notes: 'Cancelled by user' });
        try {
          await setDoc(doc(db, 'subscriptionRequests', req.id), { status: 'cancelled', cancelledAt: new Date().toISOString() }, { merge: true });
        } catch (e) {}
      }
      setSubscriptionRequests((prev) =>
        prev.map((r) =>
          isMatchingUser({ id: r.userId, email: r.userEmail }, user.id, user.email) && r.status === 'pending'
            ? { ...r, status: 'cancelled' }
            : r
        )
      );

      const updatedUser: UserProfile = {
        ...user,
        subscriptionStatus: 'active',
        pendingPlan: undefined,
      };
      setUser(updatedUser);
      setAllUsers((prev) =>
        prev.map((u) =>
          isMatchingUser(u, user.id, user.email)
            ? { ...u, subscriptionStatus: 'active', pendingPlan: undefined }
            : u
        )
      );
      try {
        localStorage.setItem('biz_user', JSON.stringify(updatedUser));
      } catch (e) {}

      try {
        await setDoc(doc(db, 'users', user.id), { subscriptionStatus: 'active', pendingPlan: deleteField() }, { merge: true });
        if (user.email && user.email !== user.id) {
          await setDoc(doc(db, 'users', user.email), { subscriptionStatus: 'active', pendingPlan: deleteField() }, { merge: true });
        }
      } catch (e) {}
      try {
        await supabase.from('users').update({ subscription_status: 'active' }).eq('id', user.id);
        if (user.email) {
          await supabase.from('users').update({ subscription_status: 'active' }).eq('email', user.email);
        }
      } catch (e) {}
      return true;
    } catch (err) {
      console.warn('Error cancelling active pending request:', err);
      return false;
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    let processedData = { ...data };
    if (data.photoUrl && data.photoUrl.startsWith('data:image') && data.photoUrl.length > 50000) {
      try {
        const compressed = await compressImage(data.photoUrl, { maxWidth: 320, maxHeight: 320, quality: 0.82 });
        processedData.photoUrl = compressed;
        processedData.profilePhotoUrl = compressed;
        processedData.avatarUrl = compressed;
      } catch (e) {}
    }
    const updated = { ...user, ...processedData };
    setUser(updated);
    try {
      localStorage.setItem('biz_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage quota notice in updateProfile:', e);
    }
    if (data.brandName) {
      setSettings((prev) => {
        const next = { ...prev, brandName: data.brandName! };
        try {
          localStorage.setItem('biz_settings', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
    if (auth.currentUser) {
      const fsPayload: Record<string, any> = { ...processedData };
      if (data.brandName) fsPayload.storeName = data.brandName;
      updateDoc(doc(db, 'users', auth.currentUser.uid), fsPayload)
        .catch((err) => console.warn('Sync profile error:', err));
    }
    logActivity('Updated Profile', 'প্রোফাইল আপডেট করা হয়েছে');
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    let processedData = { ...data };
    if (data.photoUrl && data.photoUrl.startsWith('data:image') && data.photoUrl.length > 50000) {
      try {
        const compressed = await compressImage(data.photoUrl, { maxWidth: 320, maxHeight: 320, quality: 0.82 });
        processedData.photoUrl = compressed;
        processedData.profilePhotoUrl = compressed;
        processedData.avatarUrl = compressed;
      } catch (e) {}
    }
    const updated = { ...user, ...processedData };
    setUser(updated);
    try {
      localStorage.setItem('biz_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage quota notice in updateUser:', e);
    }
    if (data.brandName) {
      setSettings((prev) => {
        const next = { ...prev, brandName: data.brandName! };
        try {
          localStorage.setItem('biz_settings', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
    if (auth.currentUser) {
      const fsPayload: Record<string, any> = { ...processedData };
      if (data.brandName) fsPayload.storeName = data.brandName;
      updateDoc(doc(db, 'users', auth.currentUser.uid), fsPayload)
        .catch((err) => console.warn('Sync user error:', err));
    }
  };

  const uploadProfilePhoto = async (photoInput: string | File | Blob): Promise<void> => {
    if (!user) return;
    try {
      const compressedPhoto = await compressImage(photoInput, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.82,
        outputFormat: 'image/jpeg',
      });

      const updated = {
        ...user,
        photoUrl: compressedPhoto,
        profilePhotoUrl: compressedPhoto,
        avatarUrl: compressedPhoto,
      };
      setUser(updated);
      try {
        localStorage.setItem('biz_user', JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage quota notice in uploadProfilePhoto:', e);
      }
      if (auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            photoUrl: compressedPhoto,
            profilePhotoUrl: compressedPhoto,
            avatarUrl: compressedPhoto,
          });
        } catch (err) {
          console.warn('Sync profile photo error:', err);
        }
      }
      logActivity('Uploaded Profile Photo', 'প্রোফাইল ছবি পরিবর্তন করা হয়েছে');
    } catch (err) {
      console.error('Error in uploadProfilePhoto:', err);
      throw err;
    }
  };

  const removeProfilePhoto = async (): Promise<void> => {
    if (!user) return;
    const updated = {
      ...user,
      photoUrl: '',
      profilePhotoUrl: '',
      avatarUrl: '',
    };
    setUser(updated);
    try {
      localStorage.setItem('biz_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage quota notice in removeProfilePhoto:', e);
    }
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          photoUrl: deleteField(),
          profilePhotoUrl: deleteField(),
          avatarUrl: deleteField(),
        });
      } catch (err) {
        console.warn('Remove profile photo error:', err);
      }
    }
    logActivity('Removed Profile Photo', 'প্রোফাইল ছবি মুছে ফেলা হয়েছে');
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      localStorage.setItem('biz_settings', JSON.stringify(next));
      return next;
    });

    if (auth.currentUser) {
      const fsPayload: Record<string, any> = {};
      if (newSettings.brandName) {
        fsPayload.brandName = newSettings.brandName;
        fsPayload.storeName = newSettings.brandName;
      }
      if (newSettings.paymentSettings) {
        fsPayload.paymentSettings = newSettings.paymentSettings;
        fsPayload['storeSettings.payment'] = {
          ...newSettings.paymentSettings,
          updatedAt: new Date().toISOString(),
        };
        // Also save to global platform settings doc in Firestore for all customer apps to access
        setDoc(doc(db, 'settings', 'payment'), {
          ...newSettings.paymentSettings,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch((err) => console.warn('Sync global settings/payment error:', err));
      }
      if (Object.keys(fsPayload).length > 0) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), fsPayload)
          .catch((err) => console.warn('Sync settings error:', err));
      }
    }

    if (newSettings.brandName) {
      setUser((prev) => {
        if (!prev) return prev;
        const updatedUser = { ...prev, brandName: newSettings.brandName! };
        localStorage.setItem('biz_user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    }
    logActivity('Settings Updated', 'সেটিংস সেভ করা হয়েছে');
  };

  // POS Cart management
  const addToCart = (product: Product) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (product.expiryDate && product.expiryDate <= todayStr) {
      alert('This product has expired and cannot be sold.');
      return;
    }
    if (product.currentStock <= 0) {
      alert(t('outOfStock'));
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert('Cannot add more than available stock!');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const targetItem = cart.find((i) => i.product.id === productId);
    if (targetItem && targetItem.product.expiryDate && targetItem.product.expiryDate <= todayStr) {
      alert('This product has expired and cannot be sold.');
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.currentStock;
          const validQty = Math.min(qty, maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  // Complete POS sale
  const checkoutPOS = async (saleData: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    discount: number;
    tax: number;
    paymentMethod: 'Cash' | 'Card' | 'bKash/Mobile' | 'Due/Credit' | 'Split';
    cashReceived: number;
    note?: string;
  }, options?: { skipPosGate?: boolean }): Promise<Sale> => {
    // Subscription feature enforcement — skipped for Quick Sale, which is
    // free for all plans (QuickSaleView passes skipPosGate). POS Register
    // (PosSystem) never skips, so it stays Premium-only.
    const isOwner = isTeamStockAdmin(user?.email) || user?.role === 'PlatformOwner';
    const planLimits = getPlanLimits(user?.subscriptionPlan, user?.subscriptionStatus === 'expired');
    if (!options?.skipPosGate && !isOwner && !planLimits.isPosAllowed) {
      const upgradeMsg = user?.subscriptionPlan === 'Pro'
        ? 'POS & Sell is a Premium feature. Please upgrade to Premium to use the POS register.'
        : 'POS & Sell is locked on Free Trial. Please upgrade to Pro or Premium to use POS.';
      alert(upgradeMsg);
      throw new Error(upgradeMsg);
    }

    if (!cart || cart.length === 0) {
      throw new Error('Cart is empty. Please add products to complete the sale.');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const expiredItem = cart.find(
      (item) => item.product.expiryDate && item.product.expiryDate <= todayStr
    );
    if (expiredItem) {
      alert(`Expired Product (${expiredItem.product.name}). Sale is not allowed.`);
      throw new Error('This product has expired and cannot be sold.');
    }

    const subtotal = cart.reduce((acc, item) => {
      const price = Number(item.product.sellingPrice) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);

    const taxPercent = Number(saleData.tax) || 0;
    const taxAmount = Math.round((subtotal * taxPercent) / 100);
    const discountAmount = Math.max(0, Number(saleData.discount) || 0);
    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

    let paidAmount = Number(saleData.cashReceived) || 0;
    if (saleData.paymentMethod === 'Due/Credit') {
      paidAmount = Number(saleData.cashReceived) || 0;
    } else {
      paidAmount = Math.min(
        saleData.cashReceived !== undefined ? Number(saleData.cashReceived) || 0 : grandTotal,
        grandTotal
      );
    }

    const dueAmount = Math.max(0, grandTotal - paidAmount);
    const changeAmount = Math.max(0, (Number(saleData.cashReceived) || 0) - grandTotal);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-6);
    const randStr = Math.floor(100 + Math.random() * 900);
    const invoiceNo = `ORD-${dateStr}-${timeStr}-${randStr}`;

    console.log('[QUICK SALE] creating sale items', { itemCount: cart.length });
    const saleItems = cart.map((item) => {
      const buyingPrice = Number(item.product.buyingPrice) || 0;
      const sellingPrice = Number(item.product.sellingPrice) || 0;
      const quantity = Number(item.quantity) || 1;
      return {
        productId: item.product.id,
        productName: item.product.name || 'Item',
        sku: (item.product.sku || '').trim(),
        buyingPrice,
        sellingPrice,
        quantity,
        unit: item.product.unit || 'pcs',
        total: sellingPrice * quantity,
        image: item.product.image || '',
      };
    });

    console.log('[QUICK SALE] creating sale', { invoiceNo, total: grandTotal, paymentMethod: saleData.paymentMethod });
    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      invoiceNo,
      customerId: saleData.customerId || '',
      customerName: saleData.customerName || 'Walk-in Customer',
      customerPhone: saleData.customerPhone || '',
      items: saleItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paidAmount,
      dueAmount,
      changeAmount,
      paymentMethod: saleData.paymentMethod,
      cashierName: user ? (user.ownerName || user.fullName || 'Cashier') : 'Cashier',
      date: new Date().toISOString(),
      note: saleData.note || '',
    };

    console.log('[QUICK SALE] updating stock');
    // 1. Calculate stock deductions
    const nextProducts = products.map((p) => {
      const cartMatch = cart.find((c) => c.product.id === p.id);
      if (cartMatch) {
        const current = Number(p.currentStock) || 0;
        const deduct = Number(cartMatch.quantity) || 1;
        const newStock = Math.max(0, current - deduct);
        let newStatus: Product['status'] = 'active';
        if (newStock === 0) newStatus = 'out_of_stock';
        else if (newStock <= (Number(p.minStockAlert) || 5)) newStatus = 'low';

        return { ...p, currentStock: newStock, status: newStatus };
      }
      return p;
    });

    // 2. Calculate updated customers
    let nextCustomers = customers;
    if (saleData.customerId) {
      nextCustomers = customers.map((c) => {
        if (c.id === saleData.customerId) {
          const currentSpent = Number(c.totalSpent) || 0;
          const currentDue = Number(c.dueAmount) || 0;
          const currentCount = Number(c.lifetimePurchasesCount) || 0;
          return {
            ...c,
            totalSpent: currentSpent + grandTotal,
            dueAmount: currentDue + dueAmount,
            lifetimePurchasesCount: currentCount + 1,
          };
        }
        return c;
      });
    }

    const nextSales = [newSale, ...sales];

    // Update local React state and storage IMMEDIATELY
    setProducts(nextProducts);
    setCustomers(nextCustomers);
    setSales(nextSales);
    const uid = user?.id || auth.currentUser?.uid;
    try {
      localStorage.setItem('biz_products', JSON.stringify(nextProducts));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify(nextProducts));
      localStorage.setItem('biz_sales', JSON.stringify(nextSales));
      if (uid) localStorage.setItem(`biz_sales_${uid}`, JSON.stringify(nextSales));
      localStorage.setItem('biz_customers', JSON.stringify(nextCustomers));
      if (uid) localStorage.setItem(`biz_customers_${uid}`, JSON.stringify(nextCustomers));
    } catch (e) {}

    // Update local IndexedDB storage
    if (uid) {
      offlineDb.setCollection(uid, 'sales', nextSales).catch(() => {});
      offlineDb.setCollection(uid, 'products', nextProducts).catch(() => {});
      offlineDb.setCollection(uid, 'customers', nextCustomers).catch(() => {});
    }

    clearCart();
    logActivity('Completed POS Sale', 'নতুন বিক্রয় ইনভয়েস সম্পন্ন', `${invoiceNo} - Total: ${formatCurrency(grandTotal)}`);

    // Enqueue operation in robust Offline Sync Queue
    if (uid) {
      syncQueueService
        .enqueue('CREATE_SALE', {
          sale: newSale,
          products: nextProducts,
          customers: nextCustomers,
        })
        .catch((err) => {
          console.warn('[SyncQueue] Notice enqueuing sale:', err);
        });
    }

    return newSale;
  };

  // Sync categories and brands to localStorage
  useEffect(() => {
    localStorage.setItem('biz_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('biz_brands', JSON.stringify(brands));
  }, [brands]);

  // Categories & Brands CRUD Methods
  const addCategory = async (name: string, description?: string): Promise<void> => {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const exists = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      description: description || '',
      productCount: 0,
    };
    const next = [...categories, newCat];
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'categories', { items: next });
    }
    setCategories(next);
  };

  const deleteCategory = async (id: string): Promise<void> => {
    const next = categories.filter((c) => c.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'categories', { items: next });
    }
    setCategories(next);
  };

  const addBrand = async (name: string, description?: string): Promise<void> => {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    const exists = brands.find((b) => b.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    const newBrand: Brand = {
      id: `brand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      description: description || '',
    };
    const next = [...brands, newBrand];
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'brands', { items: next });
    }
    setBrands(next);
  };

  const deleteBrand = async (id: string): Promise<void> => {
    const next = brands.filter((b) => b.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'brands', { items: next });
    }
    setBrands(next);
  };

  // Product CRUD
  const addProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'status'>): Promise<Product> => {
    // Check product limits based on authoritative subscription plan limits
    const isOwner = isTeamStockAdmin(user?.email) || user?.role === 'PlatformOwner';
    const planLimits = getPlanLimits(user?.subscriptionPlan, user?.subscriptionStatus === 'expired');
    
    if (!isOwner && planLimits.maxProducts !== Number.POSITIVE_INFINITY) {
      if (products.length >= planLimits.maxProducts) {
        const msg = `Free Trial plan limit reached (Max ${planLimits.maxProducts} products). Please upgrade to Pro or Premium for unlimited product catalogue.`;
        alert(msg);
        throw new Error(msg);
      }
    }

    if (!isOwner && planLimits.maxStockTotal !== Number.POSITIVE_INFINITY) {
      const currentTotalStock = products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0);
      const newStock = Number(data.currentStock) || 0;
      if (currentTotalStock + newStock > planLimits.maxStockTotal) {
        const msg = `Free Trial inventory capacity limit reached (${planLimits.maxStockTotal} total units max). Please upgrade to Pro or Premium for unlimited stock storage.`;
        alert(msg);
        throw new Error(msg);
      }
    }

    // Auto add category & brand if new
    if (data.category) await addCategory(data.category);
    if (data.brand) await addBrand(data.brand);

    let status: Product['status'] = 'active';
    if (data.currentStock === 0) status = 'out_of_stock';
    else if (data.currentStock <= data.minStockAlert) status = 'low';

    const sku = (data.sku || '').trim() || generateUniqueSku(products);
    const barcode = (data.barcode || '').trim() || sku || generateUniqueBarcode(products);

    const newProd: Product = {
      ...data,
      sku,
      barcode,
      id: `prod-${Date.now()}`,
      status,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const nextProducts = [newProd, ...products];

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      console.log(`[CloudSync] Persisting product ${newProd.name} to Firestore...`);
      await saveUserCloudCollection(uid, 'products', { items: nextProducts });
      console.log(`[CloudSync] Product ${newProd.name} persisted.`);
    }

    setProducts(nextProducts);
    try {
      localStorage.setItem('biz_products', JSON.stringify(nextProducts));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify(nextProducts));
    } catch (e) {}

    logActivity('Added New Product', 'নতুন পণ্য যোগ করা হয়েছে', data.name);
    return newProd;
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>): Promise<void> => {
    const nextProducts = products.map((p) => {
      if (p.id === id) {
        const sku = (updatedFields.sku || p.sku || '').trim() || generateUniqueSku(products);
        const barcode = (updatedFields.barcode || p.barcode || '').trim() || sku;

        const merged = { ...p, ...updatedFields, sku, barcode };
        let status = merged.status;
        if (merged.currentStock === 0) status = 'out_of_stock';
        else if (merged.currentStock <= merged.minStockAlert) status = 'low';
        else status = 'active';

        return { ...merged, status };
      }
      return p;
    });

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      console.log(`[CloudSync] Persisting updated product ${id} to Firestore...`);
      await saveUserCloudCollection(uid, 'products', { items: nextProducts });
      console.log(`[CloudSync] Product ${id} updated.`);
    }

    setProducts(nextProducts);
    try {
      localStorage.setItem('biz_products', JSON.stringify(nextProducts));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify(nextProducts));
    } catch (e) {}

    logActivity('Updated Product', 'পণ্য এডিট করা হয়েছে', `ID: ${id}`);
  };

  const deleteProduct = async (id: string): Promise<void> => {
    const nextProducts = products.filter((p) => p.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      console.log(`[CloudSync] Persisting deleted product ${id} to Firestore...`);
      await saveUserCloudCollection(uid, 'products', { items: nextProducts });
      console.log(`[CloudSync] Product ${id} deleted.`);
    }

    setProducts(nextProducts);
    try {
      localStorage.setItem('biz_products', JSON.stringify(nextProducts));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify(nextProducts));
    } catch (e) {}

    logActivity('Deleted Product', 'পণ্য মুছে ফেলা হয়েছে', `ID: ${id}`);
  };

  const clearAllProducts = async (): Promise<void> => {
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'products', { items: [] });
    }

    setProducts([]);
    setCart([]);
    try {
      localStorage.setItem('biz_products', JSON.stringify([]));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify([]));
    } catch (e) {}

    logActivity('Cleared All Products', 'সকল টেস্ট প্রোডাক্ট মুছে ফেলা হয়েছে');
  };

  // Stock Adjustment
  const adjustStock = async (
    productId: string,
    quantityDelta: number,
    reason: string,
    type: 'addition' | 'reduction' | 'damage_writeoff' | 'audit_correction'
  ): Promise<void> => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newStock = Math.max(0, prod.currentStock + quantityDelta);
    let newStatus: Product['status'] = 'active';
    if (newStock === 0) newStatus = 'out_of_stock';
    else if (newStock <= prod.minStockAlert) newStatus = 'low';

    const nextProducts = products.map((p) =>
      p.id === productId ? { ...p, currentStock: newStock, status: newStatus } : p
    );

    const newAdj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId,
      productName: prod.name,
      type,
      quantity: quantityDelta,
      reason,
      date: new Date().toISOString().split('T')[0],
      adjustedBy: user ? user.ownerName : 'Admin',
    };
    const nextAdjustments = [newAdj, ...adjustments];

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      console.log(`[CloudSync] Persisting stock adjustment for product ${productId} to Firestore...`);
      await saveUserCloudCollectionsBatch(uid, {
        products: { items: nextProducts },
        adjustments: { items: nextAdjustments },
      });
      console.log(`[CloudSync] Stock adjustment persisted.`);
    }

    setProducts(nextProducts);
    setAdjustments(nextAdjustments);
    try {
      localStorage.setItem('biz_products', JSON.stringify(nextProducts));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify(nextProducts));
    } catch (e) {}

    logActivity('Stock Adjusted', 'স্টক পরিবর্তন করা হয়েছে', `${prod.name} (${quantityDelta > 0 ? '+' : ''}${quantityDelta})`);
  };

  // Customers & Suppliers
  const addCustomer = async (custData: Omit<Customer, 'id' | 'createdAt' | 'dueAmount' | 'totalSpent' | 'lifetimePurchasesCount'>): Promise<Customer> => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      dueAmount: 0,
      totalSpent: 0,
      lifetimePurchasesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const nextCustomers = [newCust, ...customers];

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'customers', { items: nextCustomers });
    }

    setCustomers(nextCustomers);
    try {
      localStorage.setItem('biz_customers', JSON.stringify(nextCustomers));
      if (uid) localStorage.setItem(`biz_customers_${uid}`, JSON.stringify(nextCustomers));
    } catch (e) {}

    logActivity('Added Customer', 'নতুন গ্রাহক যোগ করা হয়েছে', custData.name);
    return newCust;
  };

  const updateCustomer = async (id: string, custData: Partial<Customer>): Promise<void> => {
    const nextCustomers = customers.map((c) => (c.id === id ? { ...c, ...custData } : c));
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'customers', { items: nextCustomers });
    }

    setCustomers(nextCustomers);
    try {
      localStorage.setItem('biz_customers', JSON.stringify(nextCustomers));
      if (uid) localStorage.setItem(`biz_customers_${uid}`, JSON.stringify(nextCustomers));
    } catch (e) {}

    logActivity('Updated Customer', 'গ্রাহকের তথ্য আপডেট করা হয়েছে', `ID: ${id}`);
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const nextCustomers = customers.filter((c) => c.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'customers', { items: nextCustomers });
    }

    setCustomers(nextCustomers);
    try {
      localStorage.setItem('biz_customers', JSON.stringify(nextCustomers));
      if (uid) localStorage.setItem(`biz_customers_${uid}`, JSON.stringify(nextCustomers));
    } catch (e) {}

    logActivity('Deleted Customer', 'গ্রাহক মুছে ফেলা হয়েছে', `ID: ${id}`);
  };

  const addSupplier = async (suppData: Omit<Supplier, 'id' | 'createdAt' | 'dueAmount' | 'totalPurchasesCount'>): Promise<Supplier> => {
    const newSupp: Supplier = {
      ...suppData,
      id: `supp-${Date.now()}`,
      dueAmount: 0,
      totalPurchasesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const nextSuppliers = [newSupp, ...suppliers];
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'suppliers', { items: nextSuppliers });
    }

    setSuppliers(nextSuppliers);
    try {
      localStorage.setItem('biz_suppliers', JSON.stringify(nextSuppliers));
      if (uid) localStorage.setItem(`biz_suppliers_${uid}`, JSON.stringify(nextSuppliers));
    } catch (e) {}

    logActivity('Added Supplier', 'নতুন সরবরাহকারী যোগ করা হয়েছে', suppData.name);
    return newSupp;
  };

  const updateSupplier = async (id: string, suppData: Partial<Supplier>): Promise<void> => {
    const nextSuppliers = suppliers.map((s) => (s.id === id ? { ...s, ...suppData } : s));
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'suppliers', { items: nextSuppliers });
    }

    setSuppliers(nextSuppliers);
    try {
      localStorage.setItem('biz_suppliers', JSON.stringify(nextSuppliers));
      if (uid) localStorage.setItem(`biz_suppliers_${uid}`, JSON.stringify(nextSuppliers));
    } catch (e) {}

    logActivity('Updated Supplier', 'সরবরাহকারী তথ্য আপডেট করা হয়েছে', `ID: ${id}`);
  };

  const deleteSupplier = async (id: string): Promise<void> => {
    const nextSuppliers = suppliers.filter((s) => s.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'suppliers', { items: nextSuppliers });
    }

    setSuppliers(nextSuppliers);
    try {
      localStorage.setItem('biz_suppliers', JSON.stringify(nextSuppliers));
      if (uid) localStorage.setItem(`biz_suppliers_${uid}`, JSON.stringify(nextSuppliers));
    } catch (e) {}

    logActivity('Deleted Supplier', 'সরবরাহকারী মুছে ফেলা হয়েছে', `ID: ${id}`);
  };

  const resetAllDataToZero = async (): Promise<void> => {
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setSales([]);
    setExpenses([]);
    setPurchases([]);
    setCart([]);
    setDueCollections([]);
    setInvestments([]);
    setCapitalWithdrawals([]);
    setAdjustments([]);
    setTeamMembers([]);
    setEmployees([]);
    setPayrollPayments([]);
    setSalaryAdjustments([]);
    setGeneratedProductCodes([]);
    setProductQRCounts({});
    localStorage.setItem('biz_products', JSON.stringify([]));
    localStorage.setItem('biz_customers', JSON.stringify([]));
    localStorage.setItem('biz_suppliers', JSON.stringify([]));
    localStorage.setItem('biz_sales', JSON.stringify([]));
    localStorage.setItem('biz_expenses', JSON.stringify([]));
    localStorage.setItem('biz_purchases', JSON.stringify([]));
    localStorage.setItem('biz_investments', JSON.stringify([]));
    localStorage.setItem('biz_capital_withdrawals', JSON.stringify([]));
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'products', { items: [] });
      await saveUserCloudCollection(uid, 'sales', { items: [] });
      await saveUserCloudCollection(uid, 'customers', { items: [] });
      await saveUserCloudCollection(uid, 'suppliers', { items: [] });
      await saveUserCloudCollection(uid, 'expenses', { items: [] });
      await saveUserCloudCollection(uid, 'purchases', { items: [] });
      await saveUserCloudCollection(uid, 'investments', { items: [] });
      await saveUserCloudCollection(uid, 'capitalWithdrawals', { items: [] });
      await saveUserCloudCollection(uid, 'adjustments', { items: [] });
      await saveUserCloudCollection(uid, 'dueCollections', { items: [] });
      await saveUserCloudCollection(uid, 'team', { items: [] });
      await saveUserCloudCollection(uid, 'payroll', { employees: [], payments: [], adjustments: [] });
      await saveUserCloudCollection(uid, 'qrTracking', { generatedCodes: [], productQRCounts: {} });
    }
    logActivity('Reset All Data', 'সকল ডাটা ০ তে রিসেট করা হয়েছে');
  };

  const loadSampleDemoData = async (): Promise<void> => {
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setPurchases(initialPurchases);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'products', { items: initialProducts });
      await saveUserCloudCollection(uid, 'sales', { items: initialSales });
      await saveUserCloudCollection(uid, 'customers', { items: initialCustomers });
      await saveUserCloudCollection(uid, 'suppliers', { items: initialSuppliers });
      await saveUserCloudCollection(uid, 'expenses', { items: initialExpenses });
      await saveUserCloudCollection(uid, 'purchases', { items: initialPurchases });
    }
    logActivity('Loaded Demo Data', 'স্যাম্পল ডেমো ডাটা লোড করা হয়েছে');
  };

  // Expenses & Purchases
  const addExpense = async (expData: Omit<Expense, 'id'>): Promise<Expense> => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
    };
    const next = [newExp, ...expenses];
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'expenses', { items: next });
    }

    setExpenses(next);
    try {
      localStorage.setItem('biz_expenses', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_expenses_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Added Expense', 'নতুন খরচ এন্ট্রি করা হয়েছে', `${expData.title} (${formatCurrency(expData.amount)})`);
    return newExp;
  };

  const updateExpense = async (id: string, expData: Partial<Expense>): Promise<void> => {
    const next = expenses.map((e) => (e.id === id ? { ...e, ...expData } : e));
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'expenses', { items: next });
    }

    setExpenses(next);
    try {
      localStorage.setItem('biz_expenses', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_expenses_${uid}`, JSON.stringify(next));
    } catch (e) {}

    const updated = next.find((e) => e.id === id);
    if (updated) {
      logActivity('Updated Expense', 'খরচ এন্ট্রি আপডেট করা হয়েছে', `${updated.title} (${formatCurrency(updated.amount)})`);
    }
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const removed = expenses.find((e) => e.id === id);
    const next = expenses.filter((e) => e.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'expenses', { items: next });
    }

    setExpenses(next);
    try {
      localStorage.setItem('biz_expenses', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_expenses_${uid}`, JSON.stringify(next));
    } catch (e) {}

    if (removed) {
      logActivity('Deleted Expense', 'খরচ এন্ট্রি মুছে ফেলা হয়েছে', `${removed.title} (${formatCurrency(removed.amount)})`);
    }
  };

  const addPurchase = async (pData: Omit<Purchase, 'id' | 'purchaseNo'>): Promise<Purchase> => {
    const purchaseNo = `PUR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newPurchase: Purchase = {
      ...pData,
      id: `pur-${Date.now()}`,
      purchaseNo,
    };

    // Auto increase stock for purchased items
    let nextProducts = [...products];
    pData.items.forEach((item) => {
      nextProducts = nextProducts.map((p) => {
        if (p.id === item.productId) {
          const newStock = p.currentStock + item.quantity;
          let status = p.status;
          if (newStock === 0) status = 'out_of_stock';
          else if (newStock <= p.minStockAlert) status = 'low';
          else status = 'active';

          return { ...p, currentStock: newStock, buyingPrice: item.buyingPrice, status };
        }
        return p;
      });
    });

    // Update supplier due
    let nextSuppliers = suppliers;
    if (pData.supplierId) {
      nextSuppliers = suppliers.map((s) => {
        if (s.id === pData.supplierId) {
          return {
            ...s,
            dueAmount: s.dueAmount + pData.dueAmount,
            totalPurchasesCount: s.totalPurchasesCount + 1,
          };
        }
        return s;
      });
    }

    const nextPurchases = [newPurchase, ...purchases];

    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      console.log(`[CloudSync] Persisting purchase ${purchaseNo} to Firestore...`);
      await saveUserCloudCollectionsBatch(uid, {
        products: { items: nextProducts },
        suppliers: { items: nextSuppliers },
        purchases: { items: nextPurchases },
      });
      console.log(`[CloudSync] Purchase ${purchaseNo} persisted.`);
    }

    setProducts(nextProducts);
    setSuppliers(nextSuppliers);
    setPurchases(nextPurchases);
    try {
      localStorage.setItem('biz_products', JSON.stringify(nextProducts));
      if (uid) localStorage.setItem(`biz_products_${uid}`, JSON.stringify(nextProducts));
      localStorage.setItem('biz_purchases', JSON.stringify(nextPurchases));
      if (uid) localStorage.setItem(`biz_purchases_${uid}`, JSON.stringify(nextPurchases));
      localStorage.setItem('biz_suppliers', JSON.stringify(nextSuppliers));
      if (uid) localStorage.setItem(`biz_suppliers_${uid}`, JSON.stringify(nextSuppliers));
    } catch (e) {}

    logActivity('Recorded Purchase', 'নতুন পারচেজ এন্ট্রি করা হয়েছে', `${purchaseNo} - Supplier: ${pData.supplierName}`);
    return newPurchase;
  };

  // Due Collection
  const collectDue = async (data: {
    type: 'customer' | 'supplier';
    entityId: string;
    amountPaid: number;
    paymentMethod: string;
    note?: string;
  }): Promise<DueCollection | undefined> => {
    const uid = user?.id || auth.currentUser?.uid;
    if (data.type === 'customer') {
      const target = customers.find((c) => c.id === data.entityId);
      if (!target) return;

      const previousDue = target.dueAmount;
      const remainingDue = Math.max(0, previousDue - data.amountPaid);

      const nextCustomers = customers.map((c) => (c.id === data.entityId ? { ...c, dueAmount: remainingDue } : c));

      const record: DueCollection = {
        id: `due-rec-${Date.now()}`,
        type: 'customer',
        entityId: data.entityId,
        entityName: target.name,
        amountPaid: data.amountPaid,
        previousDue,
        remainingDue,
        date: new Date().toISOString(),
        paymentMethod: data.paymentMethod,
        note: data.note,
        collectedBy: user ? user.ownerName : 'Admin',
      };
      const nextDueCollections = [record, ...dueCollections];

      if (uid) {
        await saveUserCloudCollectionsBatch(uid, {
          customers: { items: nextCustomers },
          dueCollections: { items: nextDueCollections },
        });
      }

      setCustomers(nextCustomers);
      setDueCollections(nextDueCollections);
      try {
        localStorage.setItem('biz_customers', JSON.stringify(nextCustomers));
        if (uid) localStorage.setItem(`biz_customers_${uid}`, JSON.stringify(nextCustomers));
      } catch (e) {}

      logActivity('Collected Customer Due', 'গ্রাহকের বকেয়া আদায় করা হয়েছে', `${target.name}: ${formatCurrency(data.amountPaid)}`);
      return record;
    } else {
      const target = suppliers.find((s) => s.id === data.entityId);
      if (!target) return;

      const previousDue = target.dueAmount;
      const remainingDue = Math.max(0, previousDue - data.amountPaid);

      const nextSuppliers = suppliers.map((s) => (s.id === data.entityId ? { ...s, dueAmount: remainingDue } : s));

      const record: DueCollection = {
        id: `due-rec-${Date.now()}`,
        type: 'supplier',
        entityId: data.entityId,
        entityName: target.name,
        amountPaid: data.amountPaid,
        previousDue,
        remainingDue,
        date: new Date().toISOString(),
        paymentMethod: data.paymentMethod,
        note: data.note,
        collectedBy: user ? user.ownerName : 'Admin',
      };
      const nextDueCollections = [record, ...dueCollections];

      if (uid) {
        await saveUserCloudCollectionsBatch(uid, {
          suppliers: { items: nextSuppliers },
          dueCollections: { items: nextDueCollections },
        });
      }

      setSuppliers(nextSuppliers);
      setDueCollections(nextDueCollections);
      try {
        localStorage.setItem('biz_suppliers', JSON.stringify(nextSuppliers));
        if (uid) localStorage.setItem(`biz_suppliers_${uid}`, JSON.stringify(nextSuppliers));
      } catch (e) {}

      logActivity('Paid Supplier Due', 'সরবরাহকারীকে বকেয়া পরিশোধ', `${target.name}: ${formatCurrency(data.amountPaid)}`);
      return record;
    }
  };

  // Capital & Investment Management
  const addInvestment = async (invData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Investment> => {
    const newInv: Investment = {
      ...invData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newInv, ...investments];
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'investments', { items: next });
    }

    setInvestments(next);
    try {
      localStorage.setItem('biz_investments', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_investments_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Added Investment', 'নতুন বিনিয়োগ যোগ করা হয়েছে', `${invData.investorName}: ${formatCurrency(invData.amount)}`);
    return newInv;
  };

  const updateInvestment = async (id: string, invData: Partial<Investment>): Promise<void> => {
    const next = investments.map((item) =>
      item.id === id ? { ...item, ...invData, updatedAt: new Date().toISOString() } : item
    );
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'investments', { items: next });
    }

    setInvestments(next);
    try {
      localStorage.setItem('biz_investments', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_investments_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Updated Investment', 'বিনিয়োগ তথ্য আপডেট করা হয়েছে', `ID: ${id}`);
  };

  const deleteInvestment = async (id: string): Promise<void> => {
    const next = investments.filter((item) => item.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'investments', { items: next });
    }

    setInvestments(next);
    try {
      localStorage.setItem('biz_investments', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_investments_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Deleted Investment', 'বিনিয়োগ রেকর্ড মুছে ফেলা হয়েছে', `ID: ${id}`);
  };

  const addCapitalWithdrawal = async (
    wData: Omit<CapitalWithdrawal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CapitalWithdrawal> => {
    const newWithdrawal: CapitalWithdrawal = {
      ...wData,
      id: `cap-wth-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newWithdrawal, ...capitalWithdrawals];
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'capitalWithdrawals', { items: next });
    }

    setCapitalWithdrawals(next);
    try {
      localStorage.setItem('biz_capital_withdrawals', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_capital_withdrawals_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Withdrew Capital', 'মূলধন উত্তোলন রেকর্ড করা হয়েছে', `${formatCurrency(wData.amount)} - ${wData.reason}`);
    return newWithdrawal;
  };

  const updateCapitalWithdrawal = async (id: string, wData: Partial<CapitalWithdrawal>): Promise<void> => {
    const next = capitalWithdrawals.map((item) =>
      item.id === id ? { ...item, ...wData, updatedAt: new Date().toISOString() } : item
    );
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'capitalWithdrawals', { items: next });
    }

    setCapitalWithdrawals(next);
    try {
      localStorage.setItem('biz_capital_withdrawals', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_capital_withdrawals_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Updated Capital Withdrawal', 'মূলধন উত্তোলন তথ্য আপডেট করা হয়েছে', `ID: ${id}`);
  };

  const deleteCapitalWithdrawal = async (id: string): Promise<void> => {
    const next = capitalWithdrawals.filter((item) => item.id !== id);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      await saveUserCloudCollection(uid, 'capitalWithdrawals', { items: next });
    }

    setCapitalWithdrawals(next);
    try {
      localStorage.setItem('biz_capital_withdrawals', JSON.stringify(next));
      if (uid) localStorage.setItem(`biz_capital_withdrawals_${uid}`, JSON.stringify(next));
    } catch (e) {}

    logActivity('Deleted Capital Withdrawal', 'মূলধন উত্তোলন রেকর্ড মুছে ফেলা হয়েছে', `ID: ${id}`);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    const uid = user?.id || auth.currentUser?.uid;
    const nextReadMap: Record<string, boolean> = { ...readNotificationIds, [id]: true };
    const updatedManual = manualNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));

    // 1. Immediately update React state for instant UI update & unread count badge reset
    setReadNotificationIds(nextReadMap);
    setManualNotifications(updatedManual);

    // 2. Persist to localStorage for current user
    const storageKey = 'biz_read_notifs_' + (uid || 'default');
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextReadMap));
      localStorage.setItem('biz_manual_notifications', JSON.stringify(updatedManual));
    } catch (e) {}

    // 3. Persist to Firestore backend (businessData/notifications + users doc backup)
    if (uid) {
      saveUserCloudCollection(uid, 'notifications', {
        manual: updatedManual,
        readMap: nextReadMap,
      }).catch((err) => {
        console.warn('[Notification] Cloud sync save notice:', err);
      });

      try {
        updateDoc(doc(db, 'users', uid), {
          [`readNotificationIds.${id}`]: true,
        }).catch(() => {});
      } catch (err) {}
    }
  };

  const markAllNotificationsRead = () => {
    const uid = user?.id || auth.currentUser?.uid;
    const nextReadMap: Record<string, boolean> = { ...readNotificationIds };

    // Mark every active notification as read in the map
    notifications.forEach((n) => {
      nextReadMap[n.id] = true;
    });
    manualNotifications.forEach((n) => {
      nextReadMap[n.id] = true;
    });

    const updatedManual = manualNotifications.map((n) => ({ ...n, read: true }));

    // 1. Immediately update state for instant 0 badge count & instant read styling
    setReadNotificationIds(nextReadMap);
    setManualNotifications(updatedManual);

    // 2. Persist to localStorage for current user
    const storageKey = 'biz_read_notifs_' + (uid || 'default');
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextReadMap));
      localStorage.setItem('biz_manual_notifications', JSON.stringify(updatedManual));
    } catch (e) {}

    // 3. Cloud Firestore persistence (businessData/notifications + users doc)
    if (uid) {
      saveUserCloudCollection(uid, 'notifications', {
        manual: updatedManual,
        readMap: nextReadMap,
      }).then(() => {
        console.log('[Notification] Successfully marked all notifications as read in cloud.');
      }).catch((err) => {
        console.warn('[Notification] Cloud sync save notice:', err);
      });

      try {
        updateDoc(doc(db, 'users', uid), {
          readNotificationIds: nextReadMap,
        }).catch(() => {});
      } catch (err) {}
    }
  };

  // Backup & Export
  const exportDataJSON = () => {
    const backupObj = {
      exportDate: new Date().toISOString(),
      user,
      settings,
      products,
      categories,
      brands,
      customers,
      suppliers,
      expenses,
      sales,
      purchases,
      dueCollections,
      investments,
      capitalWithdrawals,
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products && Array.isArray(parsed.products)) setProducts(parsed.products);
      if (parsed.customers && Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (parsed.suppliers && Array.isArray(parsed.suppliers)) setSuppliers(parsed.suppliers);
      if (parsed.expenses && Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
      if (parsed.sales && Array.isArray(parsed.sales)) setSales(parsed.sales);
      if (parsed.purchases && Array.isArray(parsed.purchases)) setPurchases(parsed.purchases);
      if (parsed.investments && Array.isArray(parsed.investments)) setInvestments(parsed.investments);
      if (parsed.capitalWithdrawals && Array.isArray(parsed.capitalWithdrawals)) setCapitalWithdrawals(parsed.capitalWithdrawals);
      logActivity('Imported Database Backup', 'ডাটাবেজ ব্যাকআপ ইমপোর্ট করা হয়েছে');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const saveDevices = async (updated: EmployeeDevice[]) => {
    setDevices(updated);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`biz_devices_${uid}`, JSON.stringify(updated));
      await saveUserCloudCollection(uid, 'devices', { items: updated });
    }
  };

  const currentDeviceId = getOrCreateDeviceId();
  const currentDevice = devices.find((d) => d.deviceId === currentDeviceId) || null;

  const isCurrentDeviceAuthorized =
    !user ||
    user?.role === 'Owner' ||
    user?.role === 'owner' ||
    user?.role === 'Manager' ||
    user?.role === 'manager' ||
    user?.role === 'Admin' ||
    user?.role === 'admin' ||
    user?.subscriptionPlan === 'Lifetime' ||
    (currentDevice ? currentDevice.status === 'Approved' : false);

  const requestDeviceAuthorization = async (params?: { deviceName?: string; notes?: string }): Promise<EmployeeDevice> => {
    const devInfo = getCurrentDeviceInfo();
    const customName = params?.deviceName || devInfo.deviceName;
    if (params?.deviceName) {
      setLocalDeviceName(params.deviceName);
    }
    const existingIndex = devices.findIndex((d) => d.deviceId === devInfo.deviceId);
    const isOwner = user?.role === 'Owner' || user?.role === 'owner';
    const newDevice: EmployeeDevice = {
      id: existingIndex >= 0 ? devices[existingIndex].id : `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deviceId: devInfo.deviceId,
      deviceName: customName,
      employeeId: user?.id || 'unknown',
      employeeName: user?.ownerName || user?.fullName || user?.email || 'Employee',
      employeeEmail: user?.email || '',
      employeeRole: user?.role || 'Staff',
      deviceType: devInfo.deviceType,
      browser: devInfo.browser,
      os: devInfo.os,
      screenResolution: devInfo.screenResolution,
      status: isOwner ? 'Approved' : 'Pending',
      requestedAt: existingIndex >= 0 ? devices[existingIndex].requestedAt : new Date().toISOString(),
      approvedAt: isOwner ? new Date().toISOString() : (existingIndex >= 0 ? devices[existingIndex].approvedAt : undefined),
      approvedBy: isOwner ? (user?.ownerName || 'Owner') : undefined,
      lastActiveAt: new Date().toISOString(),
      notes: params?.notes || (existingIndex >= 0 ? devices[existingIndex].notes : ''),
    };

    const nextDevices = existingIndex >= 0
      ? devices.map((d, i) => i === existingIndex ? newDevice : d)
      : [newDevice, ...devices];

    setDevices(nextDevices);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`biz_devices_${uid}`, JSON.stringify(nextDevices));
      await saveUserCloudCollection(uid, 'devices', { items: nextDevices });
    }
    return newDevice;
  };

  const approveDevice = async (deviceIdToApprove: string): Promise<void> => {
    const approver = user?.ownerName || user?.fullName || user?.email || 'Owner';
    const nextDevices = devices.map((d) =>
      d.deviceId === deviceIdToApprove || d.id === deviceIdToApprove
        ? {
            ...d,
            status: 'Approved' as const,
            approvedAt: new Date().toISOString(),
            approvedBy: approver,
            rejectionReason: undefined,
          }
        : d
    );
    setDevices(nextDevices);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`biz_devices_${uid}`, JSON.stringify(nextDevices));
      await saveUserCloudCollection(uid, 'devices', { items: nextDevices });
    }
    logActivity('Approved Device Access', 'ডিভাইস অ্যাক্সেস অনুমোদন করা হয়েছে', deviceIdToApprove);
  };

  const revokeDevice = async (deviceIdToRevoke: string, reason?: string): Promise<void> => {
    const nextDevices = devices.map((d) =>
      d.deviceId === deviceIdToRevoke || d.id === deviceIdToRevoke
        ? {
            ...d,
            status: 'Revoked' as const,
            rejectionReason: reason || 'Access revoked by store owner',
          }
        : d
    );
    setDevices(nextDevices);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`biz_devices_${uid}`, JSON.stringify(nextDevices));
      await saveUserCloudCollection(uid, 'devices', { items: nextDevices });
    }
    logActivity('Revoked Device Access', 'ডিভাইস অ্যাক্সেস বাতিল করা হয়েছে', deviceIdToRevoke);
  };

  const deleteDevice = async (deviceIdToDelete: string): Promise<void> => {
    const nextDevices = devices.filter((d) => d.deviceId !== deviceIdToDelete && d.id !== deviceIdToDelete);
    setDevices(nextDevices);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`biz_devices_${uid}`, JSON.stringify(nextDevices));
      await saveUserCloudCollection(uid, 'devices', { items: nextDevices });
    }
    logActivity('Deleted Device Record', 'ডিভাইস রেকর্ড মুছে ফেলা হয়েছে', deviceIdToDelete);
  };

  const renameDevice = async (deviceIdToRename: string, newName: string): Promise<void> => {
    const nextDevices = devices.map((d) =>
      d.deviceId === deviceIdToRename || d.id === deviceIdToRename
        ? { ...d, deviceName: newName.trim() }
        : d
    );
    setDevices(nextDevices);
    const uid = user?.id || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`biz_devices_${uid}`, JSON.stringify(nextDevices));
      await saveUserCloudCollection(uid, 'devices', { items: nextDevices });
    }
    if (deviceIdToRename === currentDeviceId) {
      setLocalDeviceName(newName.trim());
    }
  };

  // Calculations for Metrics
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySalesArr = sales.filter((s) => s.date.startsWith(todayStr));
  const todaySales = todaySalesArr.reduce((acc, s) => acc + s.total, 0);

  // ONLY new due created today from today's sales (previous dues and paid dues excluded)
  const todayDue = todaySalesArr.reduce((acc, s) => acc + (Number(s.dueAmount) || 0), 0);

  const todayPurchasesArr = purchases.filter((p) => p.date.startsWith(todayStr));
  const todayDueSuppliers = todayPurchasesArr.reduce((acc, p) => acc + (Number(p.dueAmount) || 0), 0);

  const todayBuyingCost = todaySalesArr.reduce((acc, s) => {
    const itemsBuyingTotal = s.items.reduce((sum, item) => sum + item.buyingPrice * item.quantity, 0);
    return acc + itemsBuyingTotal;
  }, 0);

  const todayGrossProfit = todaySales - todayBuyingCost;

  const todayExpense = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const todayNetResult = todayGrossProfit - todayExpense;
  const todayProfit = todayNetResult > 0 ? todayNetResult : 0;
  const todayLoss = todayNetResult < 0 ? Math.abs(todayNetResult) : 0;

  const totalStockQty = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalInventoryCostValue = products.reduce((acc, p) => acc + p.buyingPrice * p.currentStock, 0);
  const totalInventorySellingValue = products.reduce((acc, p) => acc + p.sellingPrice * p.currentStock, 0);

  const totalDueCustomers = customers.reduce((acc, c) => acc + c.dueAmount, 0);
  const totalDueSuppliers = suppliers.reduce((acc, s) => acc + s.dueAmount, 0);

  const currentMonthStr = todayStr.substring(0, 7);
  const monthSalesArr = sales.filter((s) => s.date.startsWith(currentMonthStr));
  const monthlySales = monthSalesArr.reduce((acc, s) => acc + s.total, 0);
  const monthlyExpense = expenses
    .filter((e) => e.date.startsWith(currentMonthStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const monthBuyingCost = monthSalesArr.reduce((acc, s) => {
    return acc + s.items.reduce((sum, i) => sum + i.buyingPrice * i.quantity, 0);
  }, 0);

  const monthGrossProfit = monthlySales - monthBuyingCost;
  const monthNetResult = monthGrossProfit - monthlyExpense;
  const monthlyProfit = monthNetResult > 0 ? monthNetResult : 0;
  const monthlyLoss = monthNetResult < 0 ? Math.abs(monthNetResult) : 0;

  const totalRevenueAllTime = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenseAllTime = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalBalance = Math.max(0, totalRevenueAllTime - totalExpenseAllTime);

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;

  const expiredCount = products.filter((p) => {
    if (!p.expiryDate) return false;
    return new Date(p.expiryDate) < new Date();
  }).length;

  // Capital & Investment calculations (kept strictly isolated from sales, expenses, and profit/loss)
  const totalInvestedCapital = investments.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
  const totalWithdrawnCapital = capitalWithdrawals.reduce((acc, w) => acc + (Number(w.amount) || 0), 0);
  const currentCapital = totalInvestedCapital - totalWithdrawnCapital;
  const investmentCount = investments.length;
  const withdrawalCount = capitalWithdrawals.length;

  // Update Dashboard Customization Preferences
  const updateDashboardPreferences = async (newPrefs: Partial<DashboardPreferences>) => {
    const updated: DashboardPreferences = {
      ...dashboardPreferences,
      ...newPrefs,
    };
    setDashboardPreferences(updated);
    localStorage.setItem('biz_dashboard_preferences', JSON.stringify(updated));
    if (user?.id) {
      localStorage.setItem(`biz_dashboard_preferences_${user.id}`, JSON.stringify(updated));
      setUser((prev) => (prev ? { ...prev, dashboardPreferences: updated } : prev));
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { dashboardPreferences: updated });
      } catch (err) {
        console.warn('Could not save dashboardPreferences to Firestore:', err);
      }
    }
  };

  // ==========================================
  // ONLINE BUSINESS MODE HANDLERS & LOGIC
  // ==========================================
  const onlineSettings = settings.onlineBusiness || defaultOnlineBusinessSettings;
  const isOnlineBusinessActive = Boolean(
    onlineSettings.enabled && isOnlineBusinessEligible(user).eligible
  );

  const toggleOnlineBusinessMode = async (
    enabled: boolean
  ): Promise<{ success: boolean; error?: string; reason?: 'free' | 'expired' | 'unauthorized' }> => {
    if (enabled) {
      const eligibility = isOnlineBusinessEligible(user);
      if (!eligibility.eligible) {
        return {
          success: false,
          reason: eligibility.reason,
          error:
            eligibility.reason === 'free'
              ? 'Online Business Mode requires a Pro or Premium subscription plan.'
              : 'Your active subscription does not permit Online Business Mode.',
        };
      }
    }

    const updatedOnlineSettings: OnlineBusinessSettings = {
      ...onlineSettings,
      enabled,
    };

    const updatedSettings = {
      ...settings,
      onlineBusiness: updatedOnlineSettings,
    };

    setSettings(updatedSettings);
    localStorage.setItem('biz_settings', JSON.stringify(updatedSettings));

    const currentUserId = user?.id || auth.currentUser?.uid;
    if (currentUserId) {
      localStorage.setItem(`biz_settings_${currentUserId}`, JSON.stringify(updatedSettings));
      try {
        await saveUserCloudCollection(currentUserId, 'onlineSettings', updatedOnlineSettings);
      } catch (err) {
        console.warn('Could not push onlineSettings to cloud immediately, queuing offline sync:', err);
      }

      await syncQueueService.enqueue('UPDATE_ONLINE_SETTINGS', updatedOnlineSettings);
    }

    return { success: true };
  };

  const updateOnlineSettings = async (newSettings: Partial<OnlineBusinessSettings>) => {
    const updatedOnlineSettings: OnlineBusinessSettings = {
      ...onlineSettings,
      ...newSettings,
    };

    const updatedSettings = {
      ...settings,
      onlineBusiness: updatedOnlineSettings,
    };

    setSettings(updatedSettings);
    localStorage.setItem('biz_settings', JSON.stringify(updatedSettings));

    const currentUserId = user?.id || auth.currentUser?.uid;
    if (currentUserId) {
      localStorage.setItem(`biz_settings_${currentUserId}`, JSON.stringify(updatedSettings));
      try {
        await saveUserCloudCollection(currentUserId, 'onlineSettings', updatedOnlineSettings);
      } catch (err) {
        console.warn('Cloud sync offline queue used for onlineSettings');
      }

      await syncQueueService.enqueue('UPDATE_ONLINE_SETTINGS', updatedOnlineSettings);
    }
  };

  const createOnlineCustomer = async (
    customerData: Partial<OnlineCustomer>
  ): Promise<OnlineCustomer> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const newCustomer: OnlineCustomer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: customerData.name || 'Unnamed Customer',
      phone: customerData.phone || '',
      email: customerData.email,
      address: customerData.address || '',
      city: customerData.city || 'Inside City',
      totalOrders: customerData.totalOrders || 0,
      totalSpent: customerData.totalSpent || 0,
      lastOrderDate: customerData.lastOrderDate,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCustomer, ...onlineCustomers];
    setOnlineCustomers(updated);
    localStorage.setItem(`biz_online_customers_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineCustomers', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineCustomers', { items: updated });
      } catch (e) {}

      await syncQueueService.enqueue('CREATE_ONLINE_CUSTOMER', newCustomer);
    }

    return newCustomer;
  };

  const updateOnlineCustomer = async (
    customerId: string,
    updates: Partial<OnlineCustomer>
  ) => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = onlineCustomers.map((c) =>
      c.id === customerId ? { ...c, ...updates } : c
    );
    setOnlineCustomers(updated);
    localStorage.setItem(`biz_online_customers_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineCustomers', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineCustomers', { items: updated });
      } catch (e) {}
    }
  };

  const createOnlineOrder = async (
    orderData: Partial<OnlineOrder>
  ): Promise<OnlineOrder> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Normalize and compute items list with valid numbers
    const items: OnlineOrderItem[] = (orderData.items || []).map((item) => {
      const buyingPrice = Number(item.buyingPrice) || 0;
      const sellingPrice = Number(item.sellingPrice) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const total = Number(item.total) > 0 ? Number(item.total) : sellingPrice * quantity;
      return {
        ...item,
        buyingPrice,
        sellingPrice,
        quantity,
        total,
      };
    });

    const itemsSum = items.reduce((sum, item) => sum + item.total, 0);
    const subtotal = orderData.subtotal !== undefined && Number(orderData.subtotal) > 0
      ? Number(orderData.subtotal)
      : itemsSum;

    const deliveryCharge = Number(orderData.deliveryCharge) || 0;
    const deliveryPayer = orderData.deliveryPayer || 'Customer';
    const discount = Number(orderData.discount) || 0;

    // Strict Calculation:
    // When delivery is paid by Customer: Grand Total = Subtotal + Delivery Charge - Discount
    // When delivery is paid by Owner: Grand Total = Subtotal - Discount
    const calculatedGrandTotal = deliveryPayer === 'Customer'
      ? Math.max(0, subtotal + deliveryCharge - discount)
      : Math.max(0, subtotal - discount);

    const grandTotal = calculatedGrandTotal;
    const ownerDeliveryExpense = deliveryPayer === 'Owner' ? deliveryCharge : 0;
    const codAmount = orderData.paymentMethod === 'COD' || !orderData.paymentMethod ? grandTotal : 0;
    const courierCost = orderData.courierCost !== undefined
      ? Number(orderData.courierCost)
      : (deliveryPayer === 'Owner' ? deliveryCharge : (orderData.deliveryCity === 'Outside City' ? 150 : 80));

    const newOrder: OnlineOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      orderNo: orderData.orderNo || orderNumber,
      userId: currentUserId,
      customerId: orderData.customerId,
      customerName: orderData.customerName || 'Customer',
      customerPhone: orderData.customerPhone || '',
      customerEmail: orderData.customerEmail,
      deliveryAddress: orderData.deliveryAddress || '',
      deliveryCity: orderData.deliveryCity || 'Inside City',
      items,
      subtotal,
      deliveryCharge,
      deliveryPayer,
      courierCost,
      discount,
      grandTotal,
      ownerDeliveryExpense,
      paymentMethod: orderData.paymentMethod || 'COD',
      paymentStatus: orderData.paymentStatus || 'Pending',
      status: orderData.status || 'Pending',
      courierName: orderData.courierName,
      trackingNumber: orderData.trackingNumber,
      notes: orderData.notes,
      codAmount: orderData.codAmount !== undefined ? Number(orderData.codAmount) : codAmount,
      codCollected: orderData.codCollected || false,
      codCollectedAmount: orderData.codCollectedAmount,
      codCollectedAt: orderData.codCollectedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Update product inventory stocks for each item sold
    if (newOrder.items && newOrder.items.length > 0) {
      // Deduct from online products catalog
      const updatedOnlineProducts = onlineProducts.map((prod) => {
        const itemSold = newOrder.items.find((it) => it.productId === prod.id);
        if (itemSold) {
          const newStock = Math.max(0, (prod.stock || 0) - itemSold.quantity);
          return { ...prod, stock: newStock };
        }
        return prod;
      });
      setOnlineProducts(updatedOnlineProducts);
      localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(updatedOnlineProducts));
      if (currentUserId !== 'default') {
        saveUserCloudCollection(currentUserId, 'onlineProducts', { items: updatedOnlineProducts }).catch(() => {});
      }

      // Deduct from offline POS products if matching ID exists
      const updatedProducts = (products || []).map((prod) => {
        const itemSold = newOrder.items.find((it) => it.productId === prod.id);
        if (itemSold) {
          const curStock = prod.currentStock !== undefined ? (Number(prod.currentStock) || 0) : (Number((prod as any).stock) || 0);
          const newQty = Math.max(0, curStock - itemSold.quantity);
          return { ...prod, currentStock: newQty };
        }
        return prod;
      });
      setProducts(updatedProducts);
      localStorage.setItem(`biz_products_${currentUserId}`, JSON.stringify(updatedProducts));
      if (currentUserId !== 'default') {
        saveUserCloudCollection(currentUserId, 'products', { items: updatedProducts }).catch(() => {});
      }
    }

    // 2. Auto catalog customer in onlineCustomers if not present or update stats
    const existingCustomer = orderData.customerId
      ? (onlineCustomers || []).find((c) => c.id === orderData.customerId)
      : (onlineCustomers || []).find((c) => c.phone === newOrder.customerPhone);

    if (existingCustomer) {
      newOrder.customerId = existingCustomer.id;
      await updateOnlineCustomer(existingCustomer.id, {
        totalOrders: (Number(existingCustomer.totalOrders) || 0) + 1,
        totalSpent: (Number(existingCustomer.totalSpent) || 0) + newOrder.grandTotal,
        lastOrderDate: new Date().toISOString(),
        address: newOrder.deliveryAddress || existingCustomer.address,
        city: newOrder.deliveryCity || existingCustomer.city,
      });
    } else if (newOrder.customerName && newOrder.customerPhone) {
      const createdCust = await createOnlineCustomer({
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        email: newOrder.customerEmail,
        address: newOrder.deliveryAddress,
        city: newOrder.deliveryCity,
        totalOrders: 1,
        totalSpent: newOrder.grandTotal,
        lastOrderDate: new Date().toISOString(),
      });
      newOrder.customerId = createdCust.id;
    }

    // 3. Save Order in state, IndexedDB, and Cloud Sync
    const updatedOrders = [newOrder, ...(onlineOrders || [])];
    setOnlineOrders(updatedOrders);
    localStorage.setItem(`biz_online_orders_${currentUserId}`, JSON.stringify(updatedOrders));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineOrders', updatedOrders);
    } catch (e) {
      console.warn('[OfflineDB] Could not cache onlineOrders:', e);
    }

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineOrders', { items: updatedOrders });
      } catch (cloudErr: any) {
        console.error('[CreateOnlineOrder] Cloud sync failed:', cloudErr);
        throw new Error(`Failed to save order to database: ${cloudErr?.message || cloudErr}`);
      }

      await syncQueueService.enqueue('CREATE_ONLINE_ORDER', newOrder);
    }

    return newOrder;
  };

  const updateOnlineOrder = async (
    orderId: string,
    updates: Partial<OnlineOrder>
  ) => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = onlineOrders.map((o) =>
      o.id === orderId ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
    );
    setOnlineOrders(updated);
    localStorage.setItem(`biz_online_orders_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineOrders', updated);
    } catch (e) {}

    const targetOrder = updated.find((o) => o.id === orderId);
    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineOrders', { items: updated });
      } catch (e) {}

      if (targetOrder) {
        await syncQueueService.enqueue('UPDATE_ONLINE_ORDER', targetOrder);
      }
    }
  };

  const updateOnlineOrderStatus = async (
    orderId: string,
    status: OnlineOrderStatus,
    optionsOrReason?: string | {
      reason?: string;
      cancellationReason?: string;
      courierCost?: number;
      cancellationCost?: number;
      totalLoss?: number;
      cancelledBy?: string;
      cancellationStage?: string;
      returnReason?: string;
      returnedBy?: string;
      returnCourierCost?: number;
      totalReturnLoss?: number;
      notes?: string;
    }
  ) => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const existing = onlineOrders.find((o) => o.id === orderId);
    if (!existing) return;

    const previousStatus = existing.status;
    const isAlreadyCancelledOrReturned = previousStatus === 'Cancelled' || previousStatus === 'Returned';

    const opts = typeof optionsOrReason === 'string'
      ? { reason: optionsOrReason, notes: optionsOrReason }
      : (optionsOrReason || {});

    const updates: Partial<OnlineOrder> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'Confirmed') {
      updates.confirmedAt = existing.confirmedAt || new Date().toISOString();
    } else if (status === 'Processing') {
      updates.packagedAt = existing.packagedAt || new Date().toISOString();
    } else if (status === 'Shipped') {
      updates.shippedAt = existing.shippedAt || new Date().toISOString();
    } else if (status === 'Delivered') {
      updates.deliveredAt = new Date().toISOString();
      if (existing.paymentMethod !== 'COD') {
        updates.paymentStatus = 'Paid';
      }
    } else if (status === 'Cancelled') {
      updates.cancelledAt = new Date().toISOString();
      updates.cancellationReason = opts.cancellationReason || opts.reason || existing.cancellationReason || 'Order Cancelled';
      updates.cancelledBy = opts.cancelledBy || user?.ownerName || user?.name || user?.email || 'Admin';
      updates.cancellationStage = opts.cancellationStage || previousStatus;
      updates.paymentStatus = 'Cancelled';

      // Determine courier and cancellation cost incurred:
      const isAfterCourier = previousStatus === 'Shipped' || previousStatus === 'Processing' || opts.cancellationStage === 'Shipped' || opts.cancellationStage === 'Processing';
      let courierFee = 0;
      if (opts.courierCost !== undefined) {
        courierFee = Number(opts.courierCost);
      } else if (isAfterCourier) {
        courierFee = existing.courierCost !== undefined
          ? Number(existing.courierCost)
          : (existing.deliveryCharge || (existing.deliveryCity === 'Outside City' ? 150 : 80));
      }

      const cancelFee = opts.cancellationCost !== undefined ? Number(opts.cancellationCost) : courierFee;
      const totalLost = opts.totalLoss !== undefined
        ? Number(opts.totalLoss)
        : (cancelFee > 0 ? cancelFee : courierFee);

      updates.courierCost = courierFee;
      updates.cancellationCost = cancelFee;
      updates.totalLoss = totalLost;
      updates.financialImpact = totalLost > 0 ? -Math.abs(totalLost) : 0;

      // Restore inventory back to products if cancelling from an active state
      if (!isAlreadyCancelledOrReturned && existing.items && existing.items.length > 0) {
        const updatedOnlineProducts = onlineProducts.map((prod) => {
          const itemSold = existing.items.find((it) => it.productId === prod.id);
          if (itemSold) {
            return { ...prod, stock: (prod.stock || 0) + itemSold.quantity };
          }
          return prod;
        });
        setOnlineProducts(updatedOnlineProducts);
        localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(updatedOnlineProducts));
        if (currentUserId !== 'default') {
          saveUserCloudCollection(currentUserId, 'onlineProducts', { items: updatedOnlineProducts }).catch(() => {});
        }

        const updatedPosProducts = products.map((prod) => {
          const itemSold = existing.items.find((it) => it.productId === prod.id);
          if (itemSold) {
            return { ...prod, currentStock: prod.currentStock + itemSold.quantity };
          }
          return prod;
        });
        setProducts(updatedPosProducts);
        localStorage.setItem(`biz_products_${currentUserId}`, JSON.stringify(updatedPosProducts));
        if (currentUserId !== 'default') {
          saveUserCloudCollection(currentUserId, 'products', { items: updatedPosProducts }).catch(() => {});
        }
      }
    } else if (status === 'Returned') {
      updates.returnedAt = new Date().toISOString();
      updates.returnReason = opts.returnReason || opts.reason || existing.returnReason || 'Parcel returned by customer';
      updates.returnedBy = opts.returnedBy || user?.ownerName || user?.name || user?.email || 'Admin';
      updates.paymentStatus = 'Refunded';

      const courierReturnCost = opts.returnCourierCost !== undefined
        ? Number(opts.returnCourierCost)
        : (opts.courierCost !== undefined
            ? Number(opts.courierCost)
            : (existing.courierCost !== undefined ? Number(existing.courierCost) : (existing.deliveryCharge || (existing.deliveryCity === 'Outside City' ? 150 : 80))));

      const totalReturnLoss = opts.totalReturnLoss !== undefined
        ? Number(opts.totalReturnLoss)
        : (opts.totalLoss !== undefined ? Number(opts.totalLoss) : courierReturnCost);

      updates.courierCost = courierReturnCost;
      updates.returnCourierCost = courierReturnCost;
      updates.totalReturnLoss = totalReturnLoss;
      updates.totalLoss = totalReturnLoss;
      updates.financialImpact = totalReturnLoss > 0 ? -Math.abs(totalReturnLoss) : 0;

      // Restore inventory if returning
      if (!isAlreadyCancelledOrReturned && existing.items && existing.items.length > 0) {
        const updatedOnlineProducts = onlineProducts.map((prod) => {
          const itemSold = existing.items.find((it) => it.productId === prod.id);
          if (itemSold) {
            return { ...prod, stock: (prod.stock || 0) + itemSold.quantity };
          }
          return prod;
        });
        setOnlineProducts(updatedOnlineProducts);
        localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(updatedOnlineProducts));
        if (currentUserId !== 'default') {
          saveUserCloudCollection(currentUserId, 'onlineProducts', { items: updatedOnlineProducts }).catch(() => {});
        }

        const updatedPosProducts = products.map((prod) => {
          const itemSold = existing.items.find((it) => it.productId === prod.id);
          if (itemSold) {
            return { ...prod, currentStock: prod.currentStock + itemSold.quantity };
          }
          return prod;
        });
        setProducts(updatedPosProducts);
        localStorage.setItem(`biz_products_${currentUserId}`, JSON.stringify(updatedPosProducts));
        if (currentUserId !== 'default') {
          saveUserCloudCollection(currentUserId, 'products', { items: updatedPosProducts }).catch(() => {});
        }
      }
    }

    await updateOnlineOrder(orderId, updates);
  };

  const deleteOnlineOrder = async (orderId: string) => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = onlineOrders.filter((o) => o.id !== orderId);
    setOnlineOrders(updated);
    localStorage.setItem(`biz_online_orders_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineOrders', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineOrders', { items: updated });
      } catch (e) {}
    }
  };

  const recordCodCollection = async (
    orderId: string,
    amount: number,
    courierNote?: string
  ) => {
    await updateOnlineOrder(orderId, {
      codCollected: true,
      codAmount: amount,
      codCollectedAt: new Date().toISOString(),
      paymentStatus: 'Paid',
      notes: courierNote || undefined,
    });
  };

  const createOnlineProduct = async (
    productData: Partial<OnlineProduct> & { name: string; sellingPrice: number }
  ): Promise<OnlineProduct> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const newProduct: OnlineProduct = {
      id: `onl_prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: productData.name,
      sku: productData.sku || `ONL-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: productData.barcode,
      category: productData.category || 'General',
      buyingPrice: Number(productData.buyingPrice) || 0,
      sellingPrice: Number(productData.sellingPrice),
      stock: Number(productData.stock) || 0,
      minStockAlert: Number(productData.minStockAlert) || 3,
      unit: productData.unit || 'Piece',
      description: productData.description,
      imageUrl: productData.imageUrl,
      status: productData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProduct, ...onlineProducts];
    setOnlineProducts(updated);
    localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineProducts', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineProducts', { items: updated });
      } catch (e) {}
    }

    return newProduct;
  };

  const updateOnlineProduct = async (
    productIdOrData: string | OnlineProduct,
    updates?: Partial<OnlineProduct>
  ) => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const targetId = typeof productIdOrData === 'string' ? productIdOrData : productIdOrData.id;
    const targetUpdates = typeof productIdOrData === 'string' ? (updates || {}) : productIdOrData;

    const updated = onlineProducts.map((p) =>
      p.id === targetId ? { ...p, ...targetUpdates, updatedAt: new Date().toISOString() } : p
    );
    setOnlineProducts(updated);
    localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineProducts', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineProducts', { items: updated });
      } catch (e) {}
    }
  };

  const deleteOnlineProduct = async (productId: string) => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = onlineProducts.filter((p) => p.id !== productId);
    setOnlineProducts(updated);
    localStorage.setItem(`biz_online_products_${currentUserId}`, JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'onlineProducts', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'onlineProducts', { items: updated });
      } catch (e) {}
    }
  };

  // ==============================================================
  // PERSONAL LEDGER ("ব্যক্তিগত খাতা") CRUD & SETTLEMENT METHODS
  // 100% Isolated from business sales, metrics, stocks, & accounting
  // ==============================================================

  const addPersonalContact = async (contactData: Omit<PersonalContact, 'id' | 'createdAt'>): Promise<PersonalContact> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const newContact: PersonalContact = {
      id: `pcon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: contactData.name.trim(),
      phone: contactData.phone?.trim() || '',
      address: contactData.address?.trim() || '',
      photoUrl: contactData.photoUrl || '',
      notes: contactData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newContact, ...personalContacts];
    setPersonalContacts(updated);
    localStorage.setItem(`biz_personal_contacts_${currentUserId}`, JSON.stringify(updated));
    localStorage.setItem('biz_personal_contacts', JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'personalLedgerContacts', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'personalLedgerContacts', { items: updated });
      } catch (e) {}
    }

    return newContact;
  };

  const updatePersonalContact = async (id: string, updates: Partial<PersonalContact>): Promise<void> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = personalContacts.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    setPersonalContacts(updated);
    localStorage.setItem(`biz_personal_contacts_${currentUserId}`, JSON.stringify(updated));
    localStorage.setItem('biz_personal_contacts', JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'personalLedgerContacts', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'personalLedgerContacts', { items: updated });
      } catch (e) {}
    }
  };

  const deletePersonalContact = async (id: string): Promise<void> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updatedContacts = personalContacts.filter((c) => c.id !== id);
    const updatedTxs = personalTransactions.filter((tx) => tx.contactId !== id);

    setPersonalContacts(updatedContacts);
    setPersonalTransactions(updatedTxs);

    localStorage.setItem(`biz_personal_contacts_${currentUserId}`, JSON.stringify(updatedContacts));
    localStorage.setItem('biz_personal_contacts', JSON.stringify(updatedContacts));
    localStorage.setItem(`biz_personal_transactions_${currentUserId}`, JSON.stringify(updatedTxs));
    localStorage.setItem('biz_personal_transactions', JSON.stringify(updatedTxs));

    try {
      await offlineDb.setCollection(currentUserId, 'personalLedgerContacts', updatedContacts);
      await offlineDb.setCollection(currentUserId, 'personalLedgerTransactions', updatedTxs);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'personalLedgerContacts', { items: updatedContacts });
        await saveUserCloudCollection(currentUserId, 'personalLedgerTransactions', { items: updatedTxs });
      } catch (e) {}
    }
  };

  const addPersonalTransaction = async (
    txData: Omit<PersonalTransaction, 'id' | 'createdAt'>
  ): Promise<PersonalTransaction> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const newTx: PersonalTransaction = {
      id: `ptx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      contactId: txData.contactId,
      contactName: txData.contactName,
      contactPhone: txData.contactPhone || '',
      type: txData.type,
      amount: Number(txData.amount) || 0,
      date: txData.date || new Date().toISOString().split('T')[0],
      dueDate: txData.dueDate || undefined,
      notes: txData.notes || '',
      attachmentUrl: txData.attachmentUrl || '',
      paymentMethod: txData.paymentMethod || 'Cash',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTx, ...personalTransactions];
    setPersonalTransactions(updated);
    localStorage.setItem(`biz_personal_transactions_${currentUserId}`, JSON.stringify(updated));
    localStorage.setItem('biz_personal_transactions', JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'personalLedgerTransactions', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'personalLedgerTransactions', { items: updated });
      } catch (e) {}
    }

    return newTx;
  };

  const updatePersonalTransaction = async (id: string, updates: Partial<PersonalTransaction>): Promise<void> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = personalTransactions.map((tx) =>
      tx.id === id ? { ...tx, ...updates, updatedAt: new Date().toISOString() } : tx
    );
    setPersonalTransactions(updated);
    localStorage.setItem(`biz_personal_transactions_${currentUserId}`, JSON.stringify(updated));
    localStorage.setItem('biz_personal_transactions', JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'personalLedgerTransactions', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'personalLedgerTransactions', { items: updated });
      } catch (e) {}
    }
  };

  const deletePersonalTransaction = async (id: string): Promise<void> => {
    const currentUserId = user?.id || auth.currentUser?.uid || 'default';
    const updated = personalTransactions.filter((tx) => tx.id !== id);
    setPersonalTransactions(updated);
    localStorage.setItem(`biz_personal_transactions_${currentUserId}`, JSON.stringify(updated));
    localStorage.setItem('biz_personal_transactions', JSON.stringify(updated));

    try {
      await offlineDb.setCollection(currentUserId, 'personalLedgerTransactions', updated);
    } catch (e) {}

    if (currentUserId !== 'default') {
      try {
        await saveUserCloudCollection(currentUserId, 'personalLedgerTransactions', { items: updated });
      } catch (e) {}
    }
  };

  const settlePersonalBalance = async (params: {
    contactId: string;
    amount: number;
    settlementType: 'RECEIVE_FROM_CONTACT' | 'PAY_TO_CONTACT';
    paymentMethod?: string;
    notes?: string;
    date?: string;
  }): Promise<PersonalTransaction> => {
    const contact = personalContacts.find((c) => c.id === params.contactId);
    const contactName = contact ? contact.name : 'Unknown';
    const contactPhone = contact ? contact.phone : '';

    const txType: PersonalTransactionType =
      params.settlementType === 'RECEIVE_FROM_CONTACT' ? 'SETTLEMENT_RECEIVED' : 'SETTLEMENT_PAID';

    return await addPersonalTransaction({
      contactId: params.contactId,
      contactName,
      contactPhone,
      type: txType,
      amount: Math.abs(params.amount),
      date: params.date || new Date().toISOString().split('T')[0],
      notes: params.notes || (params.settlementType === 'RECEIVE_FROM_CONTACT' ? 'আদায় গ্রহণ' : 'পরিশোধ প্রদান'),
      paymentMethod: params.paymentMethod || 'Cash',
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isEmailVerified,
        login,
        signup,
        loginWithGoogle,
        sendLoginCode,
        verifyLoginCode,
        logout,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        updateProfile,
        updateUser,
        uploadProfilePhoto,
        removeProfilePhoto,
        allUsers,
        accountBlocked,
        clearAccountBlocked,
        updateUserRole,
        sendSupabasePasswordReset,
        suspendUser,
        activateUser,
        blockUser,
        unblockUser,
        deleteUser,
        resetUserPassword,
        updateUserPlan,
        updateUserData,
        refreshUsers,
        subscriptionRequests,
        requestSubscription,
        activateUserSubscription,
        calculateSubscriptionExpiry,
        approveSubscriptionRequest,
        rejectSubscriptionRequest,
        cancelSubscriptionRequest,
        cancelUserSubscription,
        switchActivePlan,
        cancelActivePendingRequest,
        settings,
        updateSettings,
        language,
        setLanguage,
        theme,
        setTheme,
        toggleTheme,
        t,
        formatNumber,
        formatCurrency,
        formatMoney,
        convertMoney,
        getExchangeRate,
        storeBaseCurrency,
        displayCurrency,
        displayCurrencySymbol,
        exchangeRates,
        isExchangeRatesLoading,
        formatDate,
        dashboardPreferences,
        updateDashboardPreferences,
        activeTab,
        setActiveTab,
        globalSearch,
        setGlobalSearch,
        products,
        categories,
        brands,
        addCategory,
        deleteCategory,
        addBrand,
        deleteBrand,
        customers,
        suppliers,
        expenses,
        sales,
        purchases,
        notifications,
        activityLogs,
        adjustments,
        dueCollections,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        checkoutPOS,
        addProduct,
        updateProduct,
        deleteProduct,
        clearAllProducts,
        generatedProductCodes,
        recordGeneratedCode,
        isCodeGenerated,
        removeGeneratedCode,
        getGeneratedQRCount,
        recordGeneratedQRCodes,
        adjustStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        resetAllDataToZero,
        loadSampleDemoData,
        addExpense,
        updateExpense,
        deleteExpense,
        addPurchase,
        investments,
        capitalWithdrawals,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addCapitalWithdrawal,
        updateCapitalWithdrawal,
        deleteCapitalWithdrawal,
        collectDue,
        markNotificationRead,
        markAllNotificationsRead,
        exportDataJSON,
        importDataJSON,
        teamMembers,
        saveTeamMembers,
        devices,
        saveDevices,
        requestDeviceAuthorization,
        approveDevice,
        revokeDevice,
        deleteDevice,
        renameDevice,
        currentDeviceId,
        currentDevice,
        isCurrentDeviceAuthorized,
        employees,
        saveEmployees,
        payrollPayments,
        savePayrollPayments,
        salaryAdjustments,
        saveSalaryAdjustments,
        auditLogs,
        saveAuditLogs,
        loyaltySettings,
        saveLoyaltySettings,
        isCloudSynced,
        onlineProducts,
        onlineOrders,
        onlineCustomers,
        onlineSettings,
        isOnlineBusinessActive,
        toggleOnlineBusinessMode,
        updateOnlineSettings,
        createOnlineProduct,
        updateOnlineProduct,
        deleteOnlineProduct,
        createOnlineOrder,
        updateOnlineOrder,
        updateOnlineOrderStatus,
        deleteOnlineOrder,
        recordCodCollection,
        createOnlineCustomer,
        updateOnlineCustomer,
        personalContacts,
        personalTransactions,
        addPersonalContact,
        updatePersonalContact,
        deletePersonalContact,
        addPersonalTransaction,
        updatePersonalTransaction,
        deletePersonalTransaction,
        settlePersonalBalance,
        metrics: {
          todaySales,
          todayExpense,
          todayBuyingCost,
          todayGrossProfit,
          todayProfit,
          todayLoss,
          todayDue,
          todayDueSuppliers,
          totalBalance,
          totalStockQty,
          totalInventoryCostValue,
          totalInventorySellingValue,
          totalDueCustomers,
          totalDueSuppliers,
          monthlySales,
          monthlyExpense,
          monthBuyingCost,
          monthGrossProfit,
          monthlyProfit,
          monthlyLoss,
          lowStockCount,
          expiredCount,
          totalInvestedCapital,
          totalWithdrawnCapital,
          currentCapital,
          investmentCount,
          withdrawalCount,
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
