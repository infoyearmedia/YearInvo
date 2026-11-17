import { BillingCycle } from '../types';

export type PaddleBillingDuration = 'monthly' | '6_month' | 'yearly' | '5_year';

export interface PaddlePlanMapping {
  plan: 'Pro' | 'Premium';
  billingCycle: BillingCycle;
  billingDuration: PaddleBillingDuration;
  priceId: string;
}

const getMetaEnv = (): Record<string, string> => {
  try {
    return ((import.meta as any).env as Record<string, string>) || {};
  } catch (e) {
    return {};
  }
};

const metaEnv = getMetaEnv();

const getEnv = (metaVal: string | undefined, processKey: string, fallback: string = ''): string => {
  let val = metaVal;
  if (!val && typeof process !== 'undefined' && process.env && process.env[processKey]) {
    val = process.env[processKey];
  }
  if (!val) {
    val = fallback;
  }
  return (val || '').trim().replace(/^["']|["']$/g, '').trim();
};

// 1. Paddle Environment ('production' | 'sandbox')
const rawEnv =
  getEnv(metaEnv.VITE_PADDLE_ENVIRONMENT, 'VITE_PADDLE_ENVIRONMENT', '') ||
  getEnv(metaEnv.PADDLE_ENVIRONMENT, 'PADDLE_ENVIRONMENT', '') ||
  (typeof process !== 'undefined' && process.env?.PADDLE_ENVIRONMENT) ||
  '';

const explicitToken =
  getEnv(metaEnv.VITE_PADDLE_CLIENT_TOKEN, 'VITE_PADDLE_CLIENT_TOKEN', '') ||
  getEnv(metaEnv.PADDLE_CLIENT_TOKEN, 'PADDLE_CLIENT_TOKEN', '') ||
  (typeof process !== 'undefined' && process.env?.PADDLE_CLIENT_TOKEN) ||
  '';

export const environment: 'sandbox' | 'production' =
  rawEnv === 'sandbox' || (explicitToken.startsWith('test_') && rawEnv !== 'production')
    ? 'sandbox'
    : 'production';

// 2. Paddle Client-side Token (Public - never secret keys)
export const clientToken = explicitToken || '';

// 3. Exactly EIGHT Paid Price IDs Configuration
// PRO (Monthly, 6 Months, Yearly, 5 Years)
const proMonthlyPriceId =
  getEnv(metaEnv.VITE_PADDLE_PRO_MONTHLY_PRICE_ID, 'PADDLE_PRO_MONTHLY_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PRO_MONTHLY_PRICE_ID, 'VITE_PADDLE_PRO_MONTHLY_PRICE_ID', '') ||
  '';

const pro6MonthPriceId =
  getEnv(metaEnv.VITE_PADDLE_PRO_6_MONTH_PRICE_ID, 'PADDLE_PRO_6_MONTH_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PRO_6_MONTH_PRICE_ID, 'VITE_PADDLE_PRO_6_MONTH_PRICE_ID', '') ||
  '';

const proYearlyPriceId =
  getEnv(metaEnv.VITE_PADDLE_PRO_YEARLY_PRICE_ID, 'PADDLE_PRO_YEARLY_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PRO_YEARLY_PRICE_ID, 'VITE_PADDLE_PRO_YEARLY_PRICE_ID', '') ||
  '';

const pro5YearPriceId =
  getEnv(metaEnv.VITE_PADDLE_PRO_5_YEAR_PRICE_ID, 'PADDLE_PRO_5_YEAR_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PRO_5_YEAR_PRICE_ID, 'VITE_PADDLE_PRO_5_YEAR_PRICE_ID', '') ||
  '';

// PREMIUM (Monthly, 6 Months, Yearly, 5 Years)
const premiumMonthlyPriceId =
  getEnv(metaEnv.VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID, 'PADDLE_PREMIUM_MONTHLY_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PREMIUM_MONTHLY_PRICE_ID, 'VITE_PADDLE_PREMIUM_MONTHLY_PRICE_ID', '') ||
  '';

const premium6MonthPriceId =
  getEnv(metaEnv.VITE_PADDLE_PREMIUM_6_MONTH_PRICE_ID, 'PADDLE_PREMIUM_6_MONTH_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PREMIUM_6_MONTH_PRICE_ID, 'VITE_PADDLE_PREMIUM_6_MONTH_PRICE_ID', '') ||
  '';

const premiumYearlyPriceId =
  getEnv(metaEnv.VITE_PADDLE_PREMIUM_YEARLY_PRICE_ID, 'PADDLE_PREMIUM_YEARLY_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PREMIUM_YEARLY_PRICE_ID, 'VITE_PADDLE_PREMIUM_YEARLY_PRICE_ID', '') ||
  '';

const premium5YearPriceId =
  getEnv(metaEnv.VITE_PADDLE_PREMIUM_5_YEAR_PRICE_ID, 'PADDLE_PREMIUM_5_YEAR_PRICE_ID', '') ||
  getEnv(metaEnv.PADDLE_PREMIUM_5_YEAR_PRICE_ID, 'VITE_PADDLE_PREMIUM_5_YEAR_PRICE_ID', '') ||
  '';

// Card checkout is only possible once at least one real Paddle price ID
// (pri_...) is configured in env. Until then checkout stays disabled and
// manual local payment is the only path (see SubscriptionView).
const hasAnyPaddlePriceId = [
  proMonthlyPriceId,
  pro6MonthPriceId,
  proYearlyPriceId,
  pro5YearPriceId,
  premiumMonthlyPriceId,
  premium6MonthPriceId,
  premiumYearlyPriceId,
  premium5YearPriceId,
].some((id) => Boolean(id) && id.startsWith('pri_'));

export const PADDLE_CONFIG = {
  environment,
  clientToken,
  checkoutEnabled: hasAnyPaddlePriceId as boolean,
  checkoutStatusReason: (hasAnyPaddlePriceId
    ? ''
    : 'Card checkout is not available yet — no Paddle price IDs are configured. Please pay manually (bKash / Nagad / Rocket / bank) and submit your transaction ID below for approval.') as string,

  priceIds: {
    // Pro Tier (4 Durations)
    proMonthly: proMonthlyPriceId,
    pro6Month: pro6MonthPriceId,
    proYearly: proYearlyPriceId,
    pro5Year: pro5YearPriceId,

    // Aliases for compatibility
    proBase: proMonthlyPriceId,
    proSixMonth: pro6MonthPriceId,
    proFiveYear: pro5YearPriceId,

    // Premium Tier (4 Durations)
    premiumMonthly: premiumMonthlyPriceId,
    premium6Month: premium6MonthPriceId,
    premiumYearly: premiumYearlyPriceId,
    premium5Year: premium5YearPriceId,

    // Aliases for compatibility
    premiumBase: premiumMonthlyPriceId,
    premiumSixMonth: premium6MonthPriceId,
    premiumFiveYear: premium5YearPriceId,
  },
};

/**
 * Runtime config sync REMOVED (audit: dead backend). The old implementation
 * fetched /api/paddle/config, which never runs — the Vercel build is static
 * Vite, so the endpoint returns index.html. This is now a no-op that keeps
 * the build-time env config in PADDLE_CONFIG as-is.
 */
export const syncPaddleRuntimeConfig = async (_forceRefresh = false): Promise<typeof PADDLE_CONFIG> => {
  return PADDLE_CONFIG;
};

/**
 * Returns the exact Paddle Price ID for a given plan and billing cycle/duration.
 */
export const getPaddlePriceId = (
  plan: 'Pro' | 'Business' | 'Premium' | 'Lifetime' | string,
  billingCycle: BillingCycle | string
): string => {
  const normPlan = plan === 'Premium' || plan === 'Business' || plan === 'Lifetime' ? 'Premium' : 'Pro';
  const normCycle = (billingCycle || 'monthly').toString().toLowerCase();

  const isSixMonths = normCycle === 'six_months' || normCycle === '6_month' || normCycle === '6months';
  const isYearly = normCycle === 'yearly' || normCycle === '1_year' || normCycle === 'annual';
  const isFiveYear = normCycle === 'five_year' || normCycle === '5_year' || normCycle === '5years';

  if (normPlan === 'Premium') {
    if (isFiveYear) return PADDLE_CONFIG.priceIds.premium5Year || PADDLE_CONFIG.priceIds.premiumFiveYear;
    if (isYearly) return PADDLE_CONFIG.priceIds.premiumYearly;
    if (isSixMonths) return PADDLE_CONFIG.priceIds.premium6Month || PADDLE_CONFIG.priceIds.premiumSixMonth;
    return PADDLE_CONFIG.priceIds.premiumMonthly || PADDLE_CONFIG.priceIds.premiumBase;
  }

  // Pro Plan
  if (isFiveYear) return PADDLE_CONFIG.priceIds.pro5Year || PADDLE_CONFIG.priceIds.proFiveYear;
  if (isYearly) return PADDLE_CONFIG.priceIds.proYearly;
  if (isSixMonths) return PADDLE_CONFIG.priceIds.pro6Month || PADDLE_CONFIG.priceIds.proSixMonth;
  return PADDLE_CONFIG.priceIds.proMonthly || PADDLE_CONFIG.priceIds.proBase;
};

/**
 * Determines plan name and billing cycle/duration from a given Paddle Price ID.
 */
export const getPlanAndCycleFromPriceId = (
  priceId: string
): {
  plan: 'Pro' | 'Premium';
  billingCycle: BillingCycle;
  billingDuration: PaddleBillingDuration;
} => {
  const cleanId = (priceId || '').trim();
  const { priceIds } = PADDLE_CONFIG;

  // Check Premium Price IDs
  if (cleanId && (
    cleanId === priceIds.premium5Year ||
    cleanId === priceIds.premiumFiveYear ||
    cleanId === priceIds.premiumYearly ||
    cleanId === priceIds.premium6Month ||
    cleanId === priceIds.premiumSixMonth ||
    cleanId === priceIds.premiumMonthly ||
    cleanId === priceIds.premiumBase
  )) {
    if (cleanId === priceIds.premium5Year || cleanId === priceIds.premiumFiveYear) {
      return { plan: 'Premium', billingCycle: 'five_year', billingDuration: '5_year' };
    }
    if (cleanId === priceIds.premiumYearly) {
      return { plan: 'Premium', billingCycle: 'yearly', billingDuration: 'yearly' };
    }
    if (cleanId === priceIds.premium6Month || cleanId === priceIds.premiumSixMonth) {
      return { plan: 'Premium', billingCycle: 'six_months', billingDuration: '6_month' };
    }
    return { plan: 'Premium', billingCycle: 'monthly', billingDuration: 'monthly' };
  }

  // Check Pro Price IDs
  if (cleanId && (
    cleanId === priceIds.pro5Year ||
    cleanId === priceIds.proFiveYear ||
    cleanId === priceIds.proYearly ||
    cleanId === priceIds.pro6Month ||
    cleanId === priceIds.proSixMonth ||
    cleanId === priceIds.proMonthly ||
    cleanId === priceIds.proBase
  )) {
    if (cleanId === priceIds.pro5Year || cleanId === priceIds.proFiveYear) {
      return { plan: 'Pro', billingCycle: 'five_year', billingDuration: '5_year' };
    }
    if (cleanId === priceIds.proYearly) {
      return { plan: 'Pro', billingCycle: 'yearly', billingDuration: 'yearly' };
    }
    if (cleanId === priceIds.pro6Month || cleanId === priceIds.proSixMonth) {
      return { plan: 'Pro', billingCycle: 'six_months', billingDuration: '6_month' };
    }
    return { plan: 'Pro', billingCycle: 'monthly', billingDuration: 'monthly' };
  }

  // Fallback defaults
  return { plan: 'Pro', billingCycle: 'monthly', billingDuration: 'monthly' };
};
