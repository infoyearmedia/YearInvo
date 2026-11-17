import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LandingPage } from '../landing/LandingPage';
import { LanguageSelector } from '../common/LanguageSelector';
import { SUPPORTED_LANGUAGES, getDefaultLanguageForCountry } from '../../i18n/languages';
import { calculatePlanPricing } from '../../config/pricing';
import { normalizeCurrencyCode } from '../../services/currencyService';
import { Language } from '../../types';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Tag,
  X,
  ShoppingCart,
  Package,
  CreditCard,
  QrCode,
  TrendingUp,
  BarChart3,
  Sparkles,
  Zap,
  Store,
  Layers,
  Check,
  Crown,
  Eye,
  EyeOff,
} from 'lucide-react';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

export const LoginView: React.FC = () => {
  const { login, signup, loginWithGoogle, sendLoginCode, verifyLoginCode, sendSupabasePasswordReset, settings, language, setLanguage, t, enterDemoMode, exchangeRates } = useApp();

  const [mode, setMode] = useState<'landing' | 'login' | 'signup' | 'forgot'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Plan picked on the pricing page, pre-selected in the sign-up form.
  const [signupPlan, setSignupPlan] = useState<'free' | 'pro' | 'premium'>('free');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Signup form state matching user's requested specification
  const [yourName, setYourName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [storeType, setStoreType] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [signupCountry, setSignupCountry] = useState('Bangladesh');
  const [signupLanguage, setSignupLanguage] = useState<Language>(language || 'en');

  const handleCountryChange = (cName: string) => {
    setSignupCountry(cName);
  };

  const [error, setError] = useState('');

  // Email OTP code login state (Supabase built-in OTP)
  const [otpMode, setOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isBn = language === 'bn';

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (!res.success) {
      setError(res.message || (isBn ? 'Google দিয়ে লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Google sign-in failed. Please try again.'));
    }
    // On success the browser redirects to Google; the auth listener
    // completes the session when the user returns.
  };

  const handleSendLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpMsg('');
    if (!email.trim()) {
      setError(isBn ? 'অনুগ্রহ করে ইমেইল এড্রেস প্রদান করুন' : 'Please enter your email address');
      return;
    }
    setOtpLoading(true);
    const res = await sendLoginCode(email);
    setOtpLoading(false);
    if (!res.success) {
      setError(res.message || (isBn ? 'কোড পাঠানো যায়নি। আবার চেষ্টা করুন।' : 'Failed to send code. Please try again.'));
    } else {
      setOtpSent(true);
      setOtpMsg(isBn ? 'যাচাইকরণ কোড আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স চেক করুন।' : 'A verification code has been sent to your email. Please check your inbox.');
    }
  };

  const handleVerifyLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) {
      setError(isBn ? 'যাচাইকরণ কোডটি লিখুন' : 'Please enter the verification code');
      return;
    }
    setOtpLoading(true);
    const res = await verifyLoginCode(email, otpCode.trim());
    setOtpLoading(false);
    if (!res.success) {
      setError(res.message || (isBn ? 'ভুল কোড। আবার চেষ্টা করুন।' : 'Invalid code. Please try again.'));
    }
  };

  // Signup plan prices follow the selected currency — same pricing engine
  // as the landing pricing section (never a hardcoded ৳ amount).
  const displayCurrency = settings.currency || '৳';
  const isBDT = normalizeCurrencyCode(displayCurrency) === 'BDT';
  const monthlyPlanSub = (plan: 'Pro' | 'Premium') => {
    const c = calculatePlanPricing(plan, 'monthly', isBDT, displayCurrency, exchangeRates, language);
    return `${c.currencySymbol}${c.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo`;
  };

  const [authLoading, setAuthLoading] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');

    if (!forgotEmail.trim()) {
      setForgotError(isBn ? 'অনুগ্রহ করে ইমেইল এড্রেস প্রদান করুন' : 'Please enter your registered email address');
      return;
    }

    setForgotLoading(true);
    const res = await sendSupabasePasswordReset(forgotEmail);
    setForgotLoading(false);

    if (res.success) {
      setForgotMsg(res.message || (isBn ? 'পাসওয়ার্ড রিসেট ইমেইল সফলভাবে পাঠানো হয়েছে।' : 'Password reset link sent to your email.'));
    } else {
      setForgotError(res.message || 'Failed to send password reset email.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(isBn ? 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন' : 'Please enter email and password');
      return;
    }
    setAuthLoading(true);
    const res = await login(email, password);
    setAuthLoading(false);
    if (!res.success) {
      setError(res.message || 'Failed to sign in.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!yourName || !storeName || !storeType || !email || !password || !storePhone || !storeAddress) {
      setError(isBn ? 'অনুগ্রহ করে সকল তারকাচিহ্নিত (*) ঘরগুলো পূরণ করুন' : 'Please fill in all required fields marked with *');
      return;
    }

    setAuthLoading(true);
    const res = await signup({
      ownerName: yourName,
      brandName: storeName,
      email,
      password,
      mobile: storePhone,
      businessType: storeType,
      storeAddress: storeAddress,
      country: signupCountry,
      preferredLanguage: signupLanguage,
      affiliateCode: affiliateCode.trim() || undefined,
      affiliateProgram: affiliateCode.trim() ? 'Mazbi Affiliate Program' : undefined,
      // Remember the plan picked on the pricing page (Free by default).
      pendingPlan: signupPlan === 'pro' ? 'Pro' : signupPlan === 'premium' ? 'Premium' : 'Free',
    });
    setAuthLoading(false);

    if (!res.success) {
      setError(res.message || 'Failed to create account.');
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Full Professional Landing Page Experience */}
      <LandingPage
        onOpenLogin={() => {
          setError('');
          setMode('login');
        }}
        onOpenSignup={(plan) => {
          setError('');
          setSignupPlan(plan || 'free');
          setMode('signup');
        }}
        onOpenDemo={() => {
          setError('');
          enterDemoMode();
        }}
      />

      {/* ================= AUTH MODAL OVERLAY FOR SIGNUP / LOGIN ================= */}
      {mode !== 'landing' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl relative my-auto">
            {mode === 'login' ? (
              /* LOGIN MODE FORM */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <LanguageSelector variant="dropdown" />
                  <button
                    type="button"
                    onClick={() => setMode('landing')}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
                    title="Close / Back to Dashboard Overview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center mb-6 pr-16 pt-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('landing.signIn') || t('login')}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isBn
                      ? 'আপনার স্টোর পরিচালনা করতে লগইন করুন'
                      : 'Enter your login credentials to manage your store'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                {!otpMode ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="store@example.com"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotError('');
                          setForgotMsg('');
                          setForgotEmail(email);
                          setMode('forgot');
                        }}
                        className="text-[11px] font-medium text-indigo-600 hover:underline cursor-pointer"
                      >
                        {isBn ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors cursor-pointer"
                        title={showLoginPassword ? 'Hide password' : 'Show password'}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{authLoading ? (isBn ? 'লগইন হচ্ছে...' : 'Signing In...') : (isBn ? 'স্টোরে প্রবেশ করুন' : 'Sign In to Store')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                ) : (
                <form onSubmit={otpSent ? handleVerifyLoginCode : handleSendLoginCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="store@example.com"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  {otpMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      {otpMsg}
                    </div>
                  )}

                  {otpSent && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {isBn ? 'যাচাইকরণ কোড *' : 'Verification Code *'}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="12345678"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center tracking-[0.5em] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {otpLoading
                        ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...')
                        : otpSent
                        ? (isBn ? 'যাচাই করুন ও লগইন করুন' : 'Verify & Sign In')
                        : (isBn ? 'কোড পাঠান' : 'Send Code')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {otpSent && (
                    <button
                      type="button"
                      onClick={handleSendLoginCode}
                      disabled={otpLoading}
                      className="w-full text-xs font-bold text-indigo-600 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isBn ? 'কোড পাননি? আবার পাঠান' : "Didn't get the code? Resend"}
                    </button>
                  )}
                </form>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[11px] font-bold text-slate-400">{isBn ? 'অথবা' : 'or'}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>{googleLoading ? (isBn ? 'Google খুলছে...' : 'Opening Google...') : (isBn ? 'Google দিয়ে চালিয়ে যান' : 'Continue with Google')}</span>
                </button>

                {/* Email code login toggle */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setOtpMsg('');
                      setOtpSent(false);
                      setOtpCode('');
                      setOtpMode((prev) => !prev);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {otpMode
                      ? (isBn ? '← পাসওয়ার্ড দিয়ে লগইন করুন' : '← Back to password login')
                      : (isBn ? 'ইমেইল কোড দিয়ে লগইন করুন' : 'Login with email code instead')}
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setError('');
                      setMode('signup');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Need a new account? Sign Up Here
                  </button>
                </div>
              </div>
            ) : mode === 'forgot' ? (
              /* FORGOT PASSWORD MODE FORM */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                <button
                  type="button"
                  onClick={() => setMode('landing')}
                  className="absolute top-6 right-6 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
                  title="Close / Back to Overview"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6 pr-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-600/30 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {isBn ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Your Password'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isBn
                      ? 'আপনার রেজিস্টার্ড ইমেইল এড্রেস লিখুন। আমরা পাসওয়ার্ড রিসেট লিংক পাঠাবো।'
                      : 'Enter your registered email address to receive a password reset link.'}
                  </p>
                </div>

                {forgotError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    {forgotError}
                  </div>
                )}

                {forgotMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{forgotMsg}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'ইমেইল এড্রেস *' : 'Registered Email Address *'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 mt-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{forgotLoading ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'রিসেট লিংক পাঠান' : 'Send Password Reset Email')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMode('login');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {isBn ? '← লগইন পেজে ফিরে যান' : '← Back to Sign In'}
                  </button>
                </div>
              </div>
            ) : (
              /* SIGNUP MODE FORM - DIRECT ENTRY TO MAIN INTERFACE UPON SIGNUP */
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Language Selector & Close Button */}
                <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                  <LanguageSelector variant="dropdown" />
                  <button
                    type="button"
                    onClick={() => setMode('landing')}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
                    title="Close signup / Back to Dashboard Overview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Top Pill Badge — shows the plan picked on the pricing page */}
                <div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-600 text-[11px] font-extrabold uppercase tracking-wider inline-block">
                    {signupPlan === 'pro'
                      ? 'PRO PLAN'
                      : signupPlan === 'premium'
                      ? 'PREMIUM PLAN'
                      : 'FREE STARTER PLAN'}
                  </span>
                </div>

                {/* Plan Selector — pre-selected from the pricing page */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isBn ? 'আপনার প্ল্যান বেছে নিন' : 'Choose Your Plan'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'free', label: isBn ? 'ফ্রি' : 'Free', sub: isBn ? '১ মাস' : '1 Month' },
                        { id: 'pro', label: 'Pro', sub: monthlyPlanSub('Pro') },
                        { id: 'premium', label: 'Premium', sub: monthlyPlanSub('Premium') },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSignupPlan(p.id)}
                        className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          signupPlan === p.id
                            ? 'bg-indigo-600/10 border-indigo-600 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="block text-xs font-black">{p.label}</span>
                        <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{p.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Header Title & Subtitle */}
                <div className="pr-8">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Create your store
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                    Set up POS, invoices, and inventory in minutes. Choose your store type — we'll tailor the tools for you.
                  </p>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium space-y-1.5">
                    <p>{error}</p>
                    {error.includes('already exists') && (
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMode('login');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline block"
                      >
                        {isBn ? 'লগইন পেজে যান →' : 'Click here to Log In instead →'}
                      </button>
                    )}
                  </div>
                )}

                {/* Continue with Google — creates the account on first sign-in */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full py-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>{googleLoading ? (isBn ? 'Google খুলছে...' : 'Opening Google...') : (isBn ? 'Google দিয়ে অ্যাকাউন্ট তৈরি করুন' : 'Sign up with Google')}</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[11px] font-bold text-slate-400">{isBn ? 'অথবা ইমেইল দিয়ে' : 'or with email'}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  {/* 1. Your Name * */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                      required
                    />
                  </div>

                  {/* 2. Store Name * & 3. Store Type * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. Downtown Mart"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select Your Store Type *
                      </label>
                      <select
                        value={storeType}
                        onChange={(e) => setStoreType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
                        required
                      >
                        <option value="" disabled>Select store type</option>
                        <option value="General Retail & Grocery">Retail Store & POS Counter</option>
                        <option value="Supermarket & Departmental">Supermarket & Grocery</option>
                        <option value="Pharmacy & Healthcare">Pharmacy & Healthcare Store</option>
                        <option value="Electronics & Mobile">Electronics & Mobile Shop</option>
                        <option value="Clothing & Fashion Boutique">Fashion & Clothing Boutique</option>
                        <option value="Restaurant & Cafe">Restaurant, Cafe & Food Court</option>
                        <option value="Hardware & Sanitary">Hardware & Construction Supplies</option>
                        <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                        <option value="General Service Store">General Service & Other Business</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Email * & 5. Password * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors cursor-pointer"
                          title={showSignupPassword ? 'Hide password' : 'Show password'}
                          aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                        >
                          {showSignupPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 6. Store Phone Number * & 7. Store Address * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Store Phone Number *
                      </label>
                      <input
                        type="text"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        placeholder="+880 1XXX-XXXXXX"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Store Address *
                      </label>
                      <input
                        type="text"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        placeholder="123 Commercial Ave, City"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Country & Language Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Country *
                      </label>
                      <select
                        value={signupCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
                        required
                      >
                        <option value="Bangladesh">🇧🇩 Bangladesh</option>
                        <option value="India">🇮🇳 India</option>
                        <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                        <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                        <option value="United States">🇺🇸 United States</option>
                        <option value="France">🇫🇷 France</option>
                        <option value="Spain">🇪🇸 Spain</option>
                        <option value="Canada">🇨🇦 Canada</option>
                        <option value="Australia">🇦🇺 Australia</option>
                        <option value="Other International">🌍 Other International</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Preferred Language *
                      </label>
                      <select
                        value={signupLanguage}
                        onChange={(e) => {
                          const l = e.target.value as Language;
                          setSignupLanguage(l);
                          setLanguage(l);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
                        required
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.nativeName} ({lang.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 8. Affiliate Code (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Affiliate Code <span className="text-slate-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value)}
                      placeholder="e.g. MAZBI123"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                    {affiliateCode.trim().length > 0 && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Will automatically link your account to the Mazbi Affiliate Program</span>
                      </p>
                    )}
                  </div>

                  {/* Action Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm transition-all text-center shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{authLoading ? (isBn ? 'স্টোর তৈরি হচ্ছে...' : 'Creating Account...') : (isBn ? 'নতুন দোকান তৈরি করুন' : 'Create Your Store & Access Dashboard')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setMode('login');
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Already registered? Log In to existing account
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer (brand line only — the landing footer already shows the copyright) */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 space-y-1 mt-auto">
        <p>YearInvo by Year Media • Modern POS &amp; Inventory Management System</p>
      </footer>
    </div>
  );
};

