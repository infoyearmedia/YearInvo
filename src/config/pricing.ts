/**
 * Centralized Subscription Pricing Configuration & Engine for YearInvo
 * 
 * Single Source of Truth for:
 * - 3 Exact Plans: Free Trial (30 days / 1 month), Pro, Premium
 * - 3 Supported Billing Periods: 1 Month (monthly), 6 Months (six_months), 1 Year (yearly)
 * - Bangladesh (BDT) Local Pricing & Discounts (Pro: ৳100/mo, ৳540 6mo = 10% off, ৳1,020 1yr = 15% off, ৳4,500 5yr = 25% off; Premium: ৳250/mo, ৳1,275 6mo = 15% off, ৳2,550 1yr = 15% off, ৳11,250 5yr = 25% off)
 * - International (USD) Base Pricing & Discounts (Pro: $1.50/mo, $7.65 6mo = 15% off, $15.30 1yr = 15% off, $67.50 5yr = 25% off; Premium: $3.50/mo, $17.85 6mo = 15% off, $35.70 1yr = 15% off, $157.50 5yr = 25% off)
 * - Every long-cycle total below is exactly monthly x months x (1 - discount), so the
 *   advertised discount labels (15% yearly, 25% five-year) are always true.
 * - Dynamic Live Currency Conversion Engine for any display currency
 * - Authoritative Plan Limits and Feature Restrictions
 */

import { BillingCycle, SubscriptionPlan, Language } from '../types';
import {
  convertCurrency,
  formatMoney,
  normalizeCurrencyCode,
  getCurrencySymbol,
} from '../services/currencyService';

export type { BillingCycle, SubscriptionPlan };

export interface PlanPricingDefinition {
  monthly: number;
  monthlyRenewal?: number;
  monthlyIntro?: number;
  sixMonths: number;
  sixMonthsDiscountPercent: number;
  yearly: number;
  yearlyDiscountPercent: number;
  fiveYear?: number;
  fiveYearDiscountPercent?: number;
}

export interface RegionalPricingConfig {
  currency: string;
  currencySymbol: string;
  pro: PlanPricingDefinition;
  premium: PlanPricingDefinition;
}

export const PRICING_CONFIG = {
  bangladesh: {
    currency: 'BDT',
    currencySymbol: '৳',
    pro: {
      monthly: 100, // ৳100 / month, same every month (no intro/renewal jump)
      monthlyIntro: 100,
      monthlyRenewal: 100,
      sixMonths: 540, // ৳540 = 10% off 6 x ৳100 (৳600)
      sixMonthsDiscountPercent: 10,
      yearly: 1020, // ৳1,020 = 15% off 12 x ৳100 (৳1,200), i.e. ৳85/mo
      yearlyDiscountPercent: 15,
      fiveYear: 4500, // ৳4,500 = 25% off 60 x ৳100 (৳6,000), i.e. ৳75/mo
      fiveYearDiscountPercent: 25,
    },
    premium: {
      monthly: 250, // ৳250 / month
      monthlyIntro: 250,
      monthlyRenewal: 250,
      sixMonths: 1275, // ৳1,275 = 15% off 6 x ৳250 (৳1,500)
      sixMonthsDiscountPercent: 15,
      yearly: 2550, // ৳2,550 = 15% off 12 x ৳250 (৳3,000), i.e. ৳212.50/mo
      yearlyDiscountPercent: 15,
      fiveYear: 11250, // ৳11,250 = 25% off 60 x ৳250 (৳15,000), i.e. ৳187.50/mo
      fiveYearDiscountPercent: 25,
    },
  },
  international: {
    currency: 'USD',
    currencySymbol: '$',
    baseCurrency: 'USD',
    pro: {
      monthly: 1.50, // $1.50 / month, same every month
      monthlyIntro: 1.50,
      monthlyRenewal: 1.50,
      sixMonths: 7.65, // $7.65 = 15% off 6 x $1.50 ($9.00)
      sixMonthsDiscountPercent: 15,
      yearly: 15.30, // $15.30 = 15% off 12 x $1.50 ($18.00), i.e. $1.28/mo
      yearlyDiscountPercent: 15,
      fiveYear: 67.50, // $67.50 = 25% off 60 x $1.50 ($90.00), i.e. $1.13/mo
      fiveYearDiscountPercent: 25,
    },
    premium: {
      monthly: 3.50, // $3.50 / month
      monthlyIntro: 3.50,
      monthlyRenewal: 3.50,
      sixMonths: 17.85, // $17.85 = 15% off 6 x $3.50 ($21.00)
      sixMonthsDiscountPercent: 15,
      yearly: 35.70, // $35.70 = 15% off 12 x $3.50 ($42.00), i.e. $2.98/mo
      yearlyDiscountPercent: 15,
      fiveYear: 157.50, // $157.50 = 25% off 60 x $3.50 ($210.00), i.e. $2.63/mo
      fiveYearDiscountPercent: 25,
    },
  },
};

export const pricingConfig = {
  bangladesh: {
    currency: 'BDT',
    proMonthly: PRICING_CONFIG.bangladesh.pro.monthly,
    premiumMonthly: PRICING_CONFIG.bangladesh.premium.monthly,
  },
  international: {
    baseCurrency: 'USD',
    proMonthly: PRICING_CONFIG.international.pro.monthly,
    premiumMonthly: PRICING_CONFIG.international.premium.monthly,
  },
} as const;

/**
 * Plan Feature Matrix & Limit Definitions
 */
export interface PlanLimits {
  plan: SubscriptionPlan;
  trialDays: number;
  maxProducts: number;
  maxStockTotal: number;
  maxSalesPerDay: number;
  // 10 Premium-only features (Strictly blocked in Free & Pro, enabled in Premium & Lifetime)
  isPosAllowed: boolean;
  isPersonalLedgerAllowed: boolean;
  isQrBarcodeAllowed: boolean;
  isTeamManagementAllowed: boolean;
  isPayrollAllowed: boolean;
  isSmartReorderAllowed: boolean;
  isAiInsightsAllowed: boolean;
  isCustomerLoyaltyAllowed: boolean;
  isAuditLogAllowed: boolean;
  isAdvancedPermissionsAllowed: boolean;
  isMultiBranchAllowed: boolean;
  isExpired?: boolean;
}

export const PLAN_LIMITS: Record<'Free' | 'Pro' | 'Premium', Omit<PlanLimits, 'plan'>> = {
  Free: {
    trialDays: 30, // 1 month free trial, as advertised on the landing page
    maxProducts: 5,
    maxStockTotal: 500,
    maxSalesPerDay: 50,
    isPosAllowed: false,
    isPersonalLedgerAllowed: false,
    isQrBarcodeAllowed: false,
    isTeamManagementAllowed: false,
    isPayrollAllowed: false,
    isSmartReorderAllowed: false,
    isAiInsightsAllowed: false,
    isCustomerLoyaltyAllowed: false,
    isAuditLogAllowed: false,
    isAdvancedPermissionsAllowed: false,
    isMultiBranchAllowed: false,
  },
  Pro: {
    trialDays: 0,
    maxProducts: Number.POSITIVE_INFINITY,
    maxStockTotal: Number.POSITIVE_INFINITY,
    maxSalesPerDay: Number.POSITIVE_INFINITY,
    // 10 Premium-only features are NOT available in Pro:
    isPosAllowed: false,
    isPersonalLedgerAllowed: false,
    isQrBarcodeAllowed: false,
    isTeamManagementAllowed: false,
    isPayrollAllowed: false,
    isSmartReorderAllowed: false,
    isAiInsightsAllowed: false,
    isCustomerLoyaltyAllowed: false,
    isAuditLogAllowed: false,
    isAdvancedPermissionsAllowed: false,
    isMultiBranchAllowed: false,
  },
  Premium: {
    trialDays: 0,
    maxProducts: Number.POSITIVE_INFINITY,
    maxStockTotal: Number.POSITIVE_INFINITY,
    maxSalesPerDay: Number.POSITIVE_INFINITY,
    // Premium includes everything in Pro PLUS all 10 Premium features:
    isPosAllowed: true,
    isPersonalLedgerAllowed: true,
    isQrBarcodeAllowed: true,
    isTeamManagementAllowed: true,
    isPayrollAllowed: true,
    isSmartReorderAllowed: true,
    isAiInsightsAllowed: true,
    isCustomerLoyaltyAllowed: true,
    isAuditLogAllowed: true,
    isAdvancedPermissionsAllowed: true,
    isMultiBranchAllowed: true,
  },
};

export const getPlanLimits = (
  rawPlan: SubscriptionPlan | string | undefined | null,
  isExpired: boolean = false
): PlanLimits => {
  const norm = (
    rawPlan === 'Lifetime' || rawPlan === 'Business' || rawPlan === 'Premium'
      ? 'Premium'
      : rawPlan === 'Pro' || rawPlan === 'Tier2'
      ? 'Pro'
      : 'Free'
  ) as 'Free' | 'Pro' | 'Premium';

  const base = PLAN_LIMITS[norm];
  if (isExpired && norm !== 'Free') {
    return {
      plan: 'Free',
      ...PLAN_LIMITS.Free,
      isExpired: true,
    };
  }

  return {
    plan: norm,
    ...base,
    isExpired,
  };
};

export interface CalculatedPlanPrice {
  plan: 'Free' | 'Pro' | 'Premium';
  billingCycle: BillingCycle;
  baseCurrency: string; // 'BDT' or 'USD'
  displayCurrency: string; // The active viewing currency e.g. 'INR', 'EUR', 'USD', 'BDT'
  baseMonthly: number;
  months: number;
  originalBaseTotal: number;
  finalBaseTotal: number;
  displayTotal: number; // Converted numeric amount
  total: number; // alias to displayTotal
  finalTotal: number; // alias to displayTotal for backwards compatibility
  totalFormatted: string;
  savings: number;
  savingsFormatted: string;
  discountPercent: number; // e.g. 0, 15, 20, 28
  effectiveMonthly: number;
  effectiveMonthlyFormatted: string;
  currency: string;
  currencySymbol: string;
  isConverted: boolean;
  renewalNotice?: string;
}

/**
 * Formats numeric price cleanly with 2 decimals or integer if zero cents
 */
export const getPlanPriceFormatted = (amount: number, currency: string = 'USD'): string => {
  return formatMoney(amount, currency, currency);
};

/**
 * Checks whether a given country string represents Bangladesh
 */
export const isBangladeshCountry = (country?: string | null): boolean => {
  if (!country) return false;
  const c = country.trim().toLowerCase();
  return (
    c === 'bangladesh' ||
    c === 'bd' ||
    c === 'bgd' ||
    c === 'bangladesh (bd)' ||
    c === 'বাংলাদেশ'
  );
};

/**
 * Calculates accurate pricing for any plan and billing cycle.
 */
export const calculatePlanPricing = (
  plan: SubscriptionPlan | string,
  billingCycle: BillingCycle,
  isBangladeshOrCountry?: boolean | string,
  targetDisplayCurrency?: string,
  customRates?: Record<string, number> | null,
  lang: Language | string = 'en'
): CalculatedPlanPrice => {
  // Determine effective display currency
  let rawCurrency = targetDisplayCurrency;
  if (!rawCurrency && typeof isBangladeshOrCountry === 'string' && !isBangladeshCountry(isBangladeshOrCountry)) {
    rawCurrency = isBangladeshOrCountry;
  }
  if (!rawCurrency) {
    rawCurrency = (isBangladeshOrCountry === true || isBangladeshCountry(isBangladeshOrCountry as string)) ? 'BDT' : 'USD';
  }

  const displayCurrency = normalizeCurrencyCode(rawCurrency);
  const displaySymbol = getCurrencySymbol(displayCurrency);

  const isBDT = displayCurrency === 'BDT';
  const baseCurrency = isBDT ? PRICING_CONFIG.bangladesh.currency : PRICING_CONFIG.international.currency;

  const normPlan = (plan === 'Business' || plan === 'Premium' ? 'Premium' : plan === 'Pro' ? 'Pro' : 'Free') as
    | 'Free'
    | 'Pro'
    | 'Premium';

  const months = billingCycle === 'five_year' ? 60 : billingCycle === 'yearly' ? 12 : billingCycle === 'six_months' ? 6 : 1;

  if (normPlan === 'Free') {
    return {
      plan: 'Free',
      billingCycle,
      baseCurrency,
      displayCurrency,
      baseMonthly: 0,
      months,
      originalBaseTotal: 0,
      finalBaseTotal: 0,
      displayTotal: 0,
      total: 0,
      finalTotal: 0,
      totalFormatted: formatMoney(0, baseCurrency, displayCurrency, lang, undefined, customRates),
      savings: 0,
      savingsFormatted: formatMoney(0, baseCurrency, displayCurrency, lang, undefined, customRates),
      discountPercent: 0,
      effectiveMonthly: 0,
      effectiveMonthlyFormatted: formatMoney(0, baseCurrency, displayCurrency, lang, undefined, customRates),
      currency: displayCurrency,
      currencySymbol: displaySymbol,
      isConverted: false,
    };
  }

  const regional = isBDT ? PRICING_CONFIG.bangladesh : PRICING_CONFIG.international;
  const planDef = normPlan === 'Pro' ? regional.pro : regional.premium;
  const monthlyPrice = planDef.monthly;

  let discountPercent = 0;
  let finalBaseTotal = monthlyPrice;
  const baseMonthlyNominal = (planDef as any).monthlyRenewal || monthlyPrice;
  const originalBaseTotal = baseMonthlyNominal * months;

  if (billingCycle === 'monthly') {
    finalBaseTotal = monthlyPrice;
    discountPercent = 0;
  } else if (billingCycle === 'six_months') {
    finalBaseTotal = planDef.sixMonths;
    discountPercent = planDef.sixMonthsDiscountPercent;
  } else if (billingCycle === 'yearly') {
    finalBaseTotal = planDef.yearly;
    discountPercent = planDef.yearlyDiscountPercent;
  } else if (billingCycle === 'five_year') {
    finalBaseTotal = planDef.fiveYear || planDef.yearly * 4;
    discountPercent = planDef.fiveYearDiscountPercent || 25;
  }

  const baseSavings = Math.max(0, Math.round((originalBaseTotal - finalBaseTotal) * 100) / 100);

  // Convert from USD base currency to selected display currency using live rates (when not BDT and not USD)
  const isConverted = !isBDT && displayCurrency !== 'USD';
  const displayTotal = isConverted
    ? convertCurrency(finalBaseTotal, 'USD', displayCurrency, customRates)
    : finalBaseTotal;

  const displaySavings = isConverted
    ? convertCurrency(baseSavings, 'USD', displayCurrency, customRates)
    : baseSavings;

  const effectiveMonthly = Math.round((displayTotal / months) * 100) / 100;

  let renewalNotice: string | undefined = undefined;
  // No renewal jump: monthly price stays the same every month, so no notice.

  return {
    plan: normPlan,
    billingCycle,
    baseCurrency,
    displayCurrency,
    baseMonthly: monthlyPrice,
    months,
    originalBaseTotal,
    finalBaseTotal,
    displayTotal,
    total: displayTotal,
    finalTotal: displayTotal,
    totalFormatted: formatMoney(finalBaseTotal, baseCurrency, displayCurrency, lang, undefined, customRates),
    savings: displaySavings,
    savingsFormatted: formatMoney(baseSavings, baseCurrency, displayCurrency, lang, undefined, customRates),
    discountPercent,
    effectiveMonthly,
    effectiveMonthlyFormatted: formatMoney(finalBaseTotal / months, baseCurrency, displayCurrency, lang, undefined, customRates),
    currency: displayCurrency,
    currencySymbol: displaySymbol,
    isConverted,
    renewalNotice,
  };
};
