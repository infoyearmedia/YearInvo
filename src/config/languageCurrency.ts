import { Language } from '../types';

export interface LanguageCurrencyPair {
  language: Language;
  languageName: string;
  languageNative: string;
  flag: string;
  currency: string; // Symbol: '৳', '$', '₹', '﷼', '€', '£'
  currencyCode: string; // 3-letter ISO: 'BDT', 'USD', 'INR', 'SAR', 'EUR', 'GBP'
  currencyLabel: string; // Display label: '৳ BDT', '$ USD', '₹ INR', '﷼ SAR', '€ EUR', '£ GBP'
}

/**
 * Language and currency are INDEPENDENT user settings.
 *
 * Changing the language must never change the currency, and changing the
 * currency must never change the language. The tables below are only:
 *  (a) the option catalogue for the language/currency dropdowns
 *      (SUPPORTED_LANGUAGE_CURRENCY_PAIRS), and
 *  (b) a way to derive INITIAL defaults for a brand-new signup
 *      (currency from country, language from browser) — see AppContext.
 * They must NOT be used inside any user-initiated change handler.
 * The two getMapped* helpers are kept only so existing call sites keep
 * compiling until their handlers are decoupled; they are deprecated and
 * no change handler should call them.
 */
export const SUPPORTED_LANGUAGE_CURRENCY_PAIRS: LanguageCurrencyPair[] = [
  {
    language: 'bn',
    languageName: 'Bengali',
    languageNative: 'বাংলা',
    flag: '🇧🇩',
    currency: '৳',
    currencyCode: 'BDT',
    currencyLabel: '৳ BDT',
  },
  {
    language: 'en',
    languageName: 'English',
    languageNative: 'English',
    flag: '🇬🇧',
    currency: '$',
    currencyCode: 'USD',
    currencyLabel: '$ USD',
  },
  {
    language: 'hi',
    languageName: 'Hindi',
    languageNative: 'हिन्दी',
    flag: '🇮🇳',
    currency: '₹',
    currencyCode: 'INR',
    currencyLabel: '₹ INR',
  },
  {
    language: 'ur',
    languageName: 'Urdu',
    languageNative: 'اردو',
    flag: '🇵🇰',
    currency: 'Rs',
    currencyCode: 'PKR',
    currencyLabel: 'Rs PKR',
  },
  {
    language: 'ar',
    languageName: 'Arabic',
    languageNative: 'العربية',
    flag: '🇸🇦',
    currency: '﷼',
    currencyCode: 'SAR',
    currencyLabel: '﷼ SAR',
  },
  {
    language: 'fr',
    languageName: 'French',
    languageNative: 'Français',
    flag: '🇫🇷',
    currency: '€',
    currencyCode: 'EUR',
    currencyLabel: '€ EUR',
  },
  {
    language: 'es',
    languageName: 'Spanish',
    languageNative: 'Español',
    flag: '🇪🇸',
    currency: '£',
    currencyCode: 'GBP',
    currencyLabel: '£ GBP',
  },
];

/**
 * 1:1 Map from Language to Currency Symbol
 */
export const LANGUAGE_TO_CURRENCY_MAP: Record<Language, string> = {
  bn: '৳',
  en: '$',
  hi: '₹',
  ur: 'Rs',
  ar: '﷼',
  fr: '€',
  es: '£',
};

/**
 * 1:1 Map from Currency Symbol/Code to Language
 */
export const CURRENCY_TO_LANGUAGE_MAP: Record<string, Language> = {
  // Bengali / BDT
  '৳': 'bn',
  'BDT': 'bn',
  
  // English / USD
  '$': 'en',
  'USD': 'en',
  
  // Hindi / INR
  '₹': 'hi',
  'INR': 'hi',

  // Urdu / PKR
  'Rs': 'ur',
  'PKR': 'ur',
  '₨': 'ur',
  
  // Arabic / SAR (and legacy AED alias)
  '﷼': 'ar',
  'SAR': 'ar',
  'د.إ': 'ar',
  'AED': 'ar',
  
  // French / EUR
  '€': 'fr',
  'EUR': 'fr',
  
  // Spanish / GBP
  '£': 'es',
  'GBP': 'es',
};

/**
 * @deprecated Do NOT call from a language-change handler. Language and
 * currency are independent: selecting a language must never rewrite the
 * currency. Kept only for initial-default derivation and so existing
 * imports keep compiling until their handlers are decoupled.
 */
export function getMappedCurrencyForLanguage(lang: Language): string {
  return LANGUAGE_TO_CURRENCY_MAP[lang] || '৳';
}

/**
 * @deprecated Do NOT call from a currency-change handler. Language and
 * currency are independent: selecting a currency must never rewrite the
 * language. Kept only for initial-default derivation and so existing
 * imports keep compiling until their handlers are decoupled.
 */
export function getMappedLanguageForCurrency(curr: string): Language {
  const clean = (curr || '').trim();
  return CURRENCY_TO_LANGUAGE_MAP[clean] || 'bn';
}
