import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  ArrowRight,
  Check,
  Store,
  Building2,
  Truck,
  ShoppingCart,
  Boxes,
  Users,
  UserPlus,
  QrCode,
  TrendingUp,
} from 'lucide-react';

export const LandingShowcase: React.FC = () => {
  const { language, convertMoney, displayCurrencySymbol } = useApp();
  const isBn = language === 'bn';
  const money = (bdtAmount: number) =>
    `${displayCurrencySymbol}${convertMoney(bdtAmount, 'BDT').toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const solutions = [
    {
      icon: Store,
      tile: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      title: isBn ? 'খুচরা দোকান' : 'Retail Shops',
      desc: isBn
        ? 'ছোট দোকানের জন্য দ্রুত বিলিং, বারকোড প্রিন্ট ও বকেয়া খাতা — সবকিছু এক স্ক্রিনে।'
        : 'Fast billing, barcode printing, and due khata for small shops — everything on one screen.',
      tags: isBn ? ['POS বিলিং', 'বারকোড', 'বকেয়া খাতা'] : ['POS Billing', 'Barcode', 'Due Khata'],
    },
    {
      icon: Building2,
      tile: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
      title: isBn ? 'সুপারশপ ও চেইন' : 'Supershops & Chains',
      desc: isBn
        ? 'একাধিক শাখা, স্টাফ রোল ও এআই ইনসাইট — বড় দোকানের পুরো অপারেশন এক জায়গায়।'
        : 'Multi-branch control, staff roles, and AI insights — the whole operation in one place.',
      tags: isBn ? ['মাল্টি-ব্রাঞ্চ', 'স্টাফ রোল', 'এআই ইনসাইট'] : ['Multi-Branch', 'Staff Roles', 'AI Insights'],
    },
    {
      icon: Truck,
      tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: isBn ? 'পাইকারি ও সাপ্লায়ার' : 'Wholesale & Suppliers',
      desc: isBn
        ? 'কেনার ইনভয়েস, সাপ্লায়ার বকেয়া ও স্টক ভ্যালুয়েশন — পাইকারি হিসাব নির্ভুল রাখুন।'
        : 'Purchase invoices, supplier balances, and stock valuation — keep wholesale accounts exact.',
      tags: isBn ? ['পারচেজ', 'সাপ্লায়ার লেজার', 'স্টক ভ্যালু'] : ['Purchases', 'Supplier Ledger', 'Stock Value'],
    },
  ];

  const featureRows = [
    {
      eyebrow: isBn ? 'POS বিলিং' : 'POS Billing',
      title: isBn ? 'কাউন্টারে বিল করুন সেকেন্ডে' : 'Bill faster at the counter',
      desc: isBn
        ? 'বারকোড স্ক্যান করুন, ডিসকাউন্ট দিন, ক্যাশ বা বিকাশে পেমেন্ট নিন — রসিদ প্রিন্ট হবে সাথে সাথেই।'
        : 'Scan a barcode, add a discount, take cash or bKash — the receipt prints before the customer blinks.',
      checks: isBn
        ? ['৩ ক্লিকে সম্পূর্ণ বিল', 'ক্যাশ, কার্ড ও মোবাইল ব্যাংকিং', 'থার্মাল ও A4 রসিদ প্রিন্ট', 'অটো বকেয়া খাতা এন্ট্রি']
        : ['Complete a bill in 3 clicks', 'Cash, card & mobile banking', 'Thermal & A4 receipt printing', 'Automatic due khata entry'],
      icon: ShoppingCart,
      mock: 'pos' as const,
    },
    {
      eyebrow: isBn ? 'ইনভেন্টরি' : 'Inventory',
      title: isBn ? 'স্টক শেষ হওয়ার আগেই জানুন' : 'Never run out of stock',
      desc: isBn
        ? 'প্রতিটি বিক্রিতে স্টক অটো কমে যায়। কমে গেলে অ্যালার্ট আসে, আর রিস্টক করলেই হিসাব আপডেট।'
        : 'Every sale reduces stock automatically. Low-stock alerts arrive before you run out, and restocking updates the count.',
      checks: isBn
        ? ['অটো লো-স্টক অ্যালার্ট', 'মেয়াদোত্তীর্ণ প্রোডাক্ট সতর্কতা', 'স্টক ভ্যালুয়েশন রিপোর্ট', 'পারচেজ থেকে অটো রিস্টক']
        : ['Automatic low-stock alerts', 'Expired product warnings', 'Stock valuation reports', 'Auto restock from purchases'],
      icon: Boxes,
      mock: 'stock' as const,
    },
    {
      eyebrow: isBn ? 'বকেয়া খাতা' : 'Due Khata',
      title: isBn ? 'বাকির প্রতিটি টাকার হিসাব' : 'Every taka of due, tracked',
      desc: isBn
        ? 'কে কত বাকি, কবে দেবে, কত পরিশোধ করেছে — গ্রাহকের পুরো লেজার এক ক্লিকে দেখুন।'
        : 'Who owes what, when it is due, and what was paid — the full customer ledger in one click.',
      checks: isBn
        ? ['গ্রাহকভিত্তিক বকেয়া লেজার', 'আংশিক পেমেন্ট ট্র্যাকিং', 'ডিজিটাল রসিদ পাঠানো', 'সাপ্লায়ার বকেয়াও একই জায়গায়']
        : ['Per-customer due ledger', 'Partial payment tracking', 'Send digital receipts', 'Supplier dues in the same place'],
      icon: Users,
      mock: 'due' as const,
    },
  ];

  const steps = [
    {
      n: '01',
      icon: UserPlus,
      title: isBn ? 'ফ্রি স্টোর তৈরি করুন' : 'Create your free store',
      desc: isBn
        ? 'ইমেইল দিয়ে সাইন আপ করুন — ১ মাসের ফ্রি ট্রায়াল, কোনো ক্রেডিট কার্ড লাগে না।'
        : 'Sign up with your email — 1 month free trial, no credit card needed.',
    },
    {
      n: '02',
      icon: QrCode,
      title: isBn ? 'প্রোডাক্ট যোগ ও বারকোড প্রিন্ট' : 'Add products & print barcodes',
      desc: isBn
        ? 'প্রোডাক্টের নাম, দাম ও স্টক লিখুন, Code128 বারকোড স্টিকার প্রিন্ট করুন।'
        : 'Enter product names, prices, and stock, then print Code128 barcode stickers.',
    },
    {
      n: '03',
      icon: TrendingUp,
      title: isBn ? 'বিক্রি করুন ও লাভ দেখুন' : 'Sell and watch profit grow',
      desc: isBn
        ? 'প্রতিটি বিক্রি, বকেয়া ও লাভের হিসাব ড্যাশবোর্ডে লাইভ দেখুন।'
        : 'Every sale, due, and profit figure shows live on your dashboard.',
    },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* SOLUTIONS — pale blue-grey, 3 cards                       */}
      {/* ========================================================= */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC] dark:bg-[#0c0c0e] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 max-w-2xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {isBn ? 'সমাধান' : 'Solutions'}
            </span>
            <h2 className="text-3xl sm:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {isBn ? 'আপনার ব্যবসার ধরন অনুযায়ী সাজানো' : 'Built for the way you sell'}
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400">
              {isBn
                ? 'এক দোকান হোক বা চেইন শপ — YearInvo আপনার কাজের ধরনে মানিয়ে যায়।'
                : 'One shop or a whole chain — YearInvo fits how your business actually works.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {solutions.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] hover:-translate-y-1 transition-all"
                >
                  {/* Top mini-UI visual */}
                  <div className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.title}</span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="h-2.5 rounded bg-slate-200 dark:bg-slate-800 w-3/4" />
                      <div className="h-2.5 rounded bg-indigo-200 dark:bg-indigo-900 w-1/2" />
                      <div className="h-2.5 rounded bg-slate-200 dark:bg-slate-800 w-2/3" />
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className={`w-11 h-11 rounded-xl ${s.tile} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.tags.map((t) => (
                        <span key={t} className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">{t}</span>
                      ))}
                    </div>
                    <button
                      onClick={scrollToPricing}
                      className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all cursor-pointer"
                    >
                      {isBn ? 'দেখুন' : 'Explore'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FEATURES — alternating text / mockup rows                 */}
      {/* ========================================================= */}
      <section className="py-20 sm:py-24 bg-white dark:bg-[#09090b] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 max-w-2xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {isBn ? 'ফিচার' : 'Features'}
            </span>
            <h2 className="text-3xl sm:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {isBn ? 'দৈনন্দিন কাজ, আরও সহজ' : 'Everyday work, made easier'}
            </h2>
          </motion.div>

          {featureRows.map((row, i) => {
            const Icon = row.icon;
            const flip = i % 2 === 1;
            return (
              <div key={row.title} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5 }}
                  className={`space-y-5 ${flip ? 'lg:order-2' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">{row.eyebrow}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{row.title}</h3>
                  <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">{row.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                    {row.checks.map((c) => (
                      <div key={c} className="flex items-start gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Mockup */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${flip ? 'lg:order-1' : ''}`}
                >
                  {row.mock === 'pos' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
                      <div className="flex justify-between text-xs font-bold"><span className="text-slate-900 dark:text-white">{isBn ? 'আজকের বিল' : "Today's Bill"}</span><span className="text-emerald-600">✓ {isBn ? 'পরিশোধিত' : 'PAID'}</span></div>
                      {[['Polo Shirt', 850], ['Earbuds', 1650], ['Jeans', 1450]].map(([name, price]) => (
                        <div key={name as string} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                          <span>{name as string}</span><span className="font-bold text-slate-900 dark:text-white">{money(price as number)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white">
                        <span>{isBn ? 'মোট' : 'Total'}</span><span>{money(3950)}</span>
                      </div>
                    </div>
                  )}
                  {row.mock === 'stock' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm">
                      {[
                        { name: isBn ? 'পোলো শার্ট' : 'Polo Shirt', stock: 48, max: 60, tone: 'bg-emerald-500', label: isBn ? 'স্টকে আছে' : 'In stock' },
                        { name: isBn ? 'ইয়ারবাডস' : 'Earbuds', stock: 3, max: 30, tone: 'bg-amber-500', label: isBn ? 'কম স্টক' : 'Low stock' },
                        { name: isBn ? 'ওয়ালেট' : 'Wallet', stock: 19, max: 25, tone: 'bg-indigo-500', label: isBn ? 'ঠিক আছে' : 'OK' },
                      ].map((r) => (
                        <div key={r.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-800 dark:text-slate-200">{r.name}</span>
                            <span className="text-slate-500">{r.stock} · {r.label}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className={`${r.tone} h-full rounded-full`} style={{ width: `${(r.stock / r.max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {row.mock === 'due' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 shadow-sm">
                      {[
                        { name: isBn ? 'রহিম স্টোর' : 'Rahim Store', due: 4200, paid: true },
                        { name: isBn ? 'করিম ট্রেডার্স' : 'Karim Traders', due: 6800, paid: false },
                        { name: isBn ? 'সুমন মার্ট' : 'Suman Mart', due: 1400, paid: false },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-950/60 px-3 py-2.5 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white">{money(c.due)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.paid ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                              {c.paid ? (isBn ? 'পরিশোধিত' : 'Paid') : (isBn ? 'বাকি' : 'Due')}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* HOW IT WORKS — 3 cards, dashed connector                 */}
      {/* ========================================================= */}
      <section className="py-20 sm:py-24 bg-[#F8FAFC] dark:bg-[#0c0c0e] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 max-w-2xl mx-auto"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {isBn ? 'কীভাবে শুরু করবেন' : 'How it works'}
            </span>
            <h2 className="text-3xl sm:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {isBn ? '৩ ধাপে আপনার দোকান অনলাইনে' : 'Your store, live in 3 steps'}
            </h2>
          </motion.div>

          <div className="relative">
            {/* Dashed connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[16%] right-[16%] border-t-2 border-dashed border-slate-300 dark:border-slate-700" />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-3xl font-extrabold text-slate-200 dark:text-slate-700">{s.n}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
