import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Zap,
  ShoppingCart,
  Package,
  Boxes,
  QrCode,
  FileSpreadsheet,
  Users,
} from 'lucide-react';

export const LandingFeatures: React.FC = () => {
  const { language } = useApp();
  const isBn = language === 'bn';

  const featuresList = [
    {
      id: 'quicksale',
      title: isBn ? 'কুইক সেল ও ক্যাশ কাউন্টার' : 'Quick Sale & Cash Register',
      desc: isBn
        ? 'মাত্র ৩ ক্লিকে ক্যাশ, কার্ড বা মোবাইল ব্যাংকিংয়ে সেল সম্পন্ন করুন। দ্রুততম ডিজিটাল কাস্টমার রসিদ।'
        : 'Process cash, card, or mobile wallet sales in 3 clicks. Instant digital customer receipts.',
      icon: Zap,
      tile: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      badge: isBn ? 'ইনস্ট্যান্ট' : 'Instant',
      wide: true,
    },
    {
      id: 'pos',
      title: isBn ? 'হাই-স্পীড POS টার্মিনাল' : 'High-Speed POS Terminal',
      desc: isBn
        ? 'ইউএসবি বা ব্লুটুথ বারকোড স্ক্যানার দিয়ে স্ক্যান করুন, ডিসকাউন্ট যুক্ত করুন এবং থার্মাল রসিদ প্রিন্ট করুন।'
        : 'Scan barcodes with handheld scanners, apply custom line-item discounts, and print thermal invoices.',
      icon: ShoppingCart,
      tile: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400',
      badge: 'POS Ready',
      wide: false,
    },
    {
      id: 'product',
      title: isBn ? 'প্রোডাক্ট ও ভ্যারিয়েন্ট ক্যাটালগ' : 'Product & Variant Catalog',
      desc: isBn
        ? 'সাইজ, কালার, ক্যাটাগরি ও ব্র্যান্ড অনুযায়ী হাজার হাজার প্রোডাক্টের ক্যাটালগ তৈরি ও ট্র্যাক করুন।'
        : 'Manage thousands of items with custom SKU, category, brand, cost price, and selling price.',
      icon: Package,
      tile: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
      wide: false,
    },
    {
      id: 'stock',
      title: isBn ? 'স্মার্ট স্টক ও লো-স্টক অ্যালার্ট' : 'Smart Stock & Reorder Alerts',
      desc: isBn
        ? 'স্টক কমে গেলে বা শূন্য হলে সিস্টেম আপনাকে সতর্ক করবে। কোনো প্রোডাক্ট যেন হঠাৎ শেষ না হয়ে যায়।'
        : 'Automatic alerts when inventory reaches minimum threshold. Never run out of top sellers.',
      icon: Boxes,
      tile: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      wide: false,
    },
    {
      id: 'barcode',
      title: isBn ? 'বারকোড ও QR স্টিকার জেনারেটর' : 'Barcode & QR Sticker Generator',
      desc: isBn
        ? 'Code128 স্ট্যান্ডার্ডে নিজের দোকানের প্রোডাক্ট বারকোড তৈরি করুন এবং থার্মাল স্টিকারে প্রিন্ট করুন।'
        : 'Generate Code128 barcode labels with store name and price. Print on thermal sticker rolls.',
      icon: QrCode,
      tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      badge: 'Thermal Print',
      wide: false,
    },
    {
      id: 'reports',
      title: isBn ? 'সেলস ও খরচের রিপোর্ট' : 'Sales & Expense Reports',
      desc: isBn
        ? 'দৈনিক, সাপ্তাহিক ও মাসিক বিক্রয়, লাভ এবং খরচের নিখুঁত রিপোর্ট PDF বা Excel ফাইল হিসেবে ডাউনলোড করুন।'
        : 'Detailed daily, weekly, and monthly sales summaries with expense categorization and Excel export.',
      icon: FileSpreadsheet,
      tile: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
      wide: false,
    },
    {
      id: 'customers',
      title: isBn ? 'কাস্টমার ডিরেক্টরি ও বাকী খাতা' : 'Customer Directory & Due Khata',
      desc: isBn
        ? 'গ্রাহকদের বাকীর হিসাব নির্ভুল রাখুন। বকেয়া পরিশোধ এবং ডিজিটাল রসিদ পাঠানোর সুবিধা।'
        : 'Track customer ledger, pending due balance, partial payment logs, and transaction history.',
      icon: Users,
      tile: 'bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400',
      wide: false,
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-24 bg-white dark:bg-[#09090b] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 max-w-2xl mx-auto"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            {isBn ? 'প্ল্যাটফর্ম' : 'Platform'}
          </span>
          <h2 className="text-3xl sm:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {isBn
              ? 'আপনার দোকানের সবকিছু, এক জায়গায়'
              : 'Everything your store runs on'}
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 font-normal">
            {isBn
              ? 'খাতাপত্রের ঝামেলা বাদ দিয়ে কম্পিউটার বা মোবাইলেই দোকান পরিচালনা করুন।'
              : 'Replace outdated paper notebooks with smart automated inventory, POS billing, and real-time cloud reporting.'}
          </p>
        </motion.div>

        {/* Asymmetric 7-card grid: featured wide card + 6 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {featuresList.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-default space-y-4 ${
                  feat.wide ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-xl ${feat.tile} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {feat.badge && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {feat.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                {/* Mini-UI panel */}
                {feat.id === 'quicksale' && (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 p-3.5 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">{isBn ? 'পোলো শার্ট × ১' : 'Polo Shirt × 1'}</span><span className="font-bold text-slate-900 dark:text-white">৳850</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">{isBn ? 'ইয়ারবাডস × ১' : 'Earbuds × 1'}</span><span className="font-bold text-slate-900 dark:text-white">৳1,650</span></div>
                    <div className="flex justify-between text-xs pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
                      <span className="font-bold text-slate-700 dark:text-slate-200">{isBn ? 'মোট' : 'Total'}</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">৳2,500</span>
                    </div>
                  </div>
                )}
                {feat.id === 'pos' && (
                  <div className="flex flex-wrap gap-1.5">
                    {['Scan', 'Bill', 'Print'].map((s) => (
                      <span key={s} className="px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                )}
                {feat.id === 'stock' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-bold"><span className="text-slate-500">{isBn ? 'ইয়ারবাডস' : 'Earbuds'}</span><span className="text-amber-600">3 {isBn ? 'টি বাকি' : 'left'}</span></div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden"><div className="bg-amber-500 h-full w-[12%]" /></div>
                  </div>
                )}
                {feat.id === 'barcode' && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 px-3 py-2 text-center">
                    <span className="font-mono text-xs font-bold tracking-tighter text-slate-600 dark:text-slate-300">|||| | |||| | ||| | ||||</span>
                  </div>
                )}
                {feat.id === 'reports' && (
                  <div className="flex items-end gap-1.5 h-10">
                    {[40, 65, 50, 80, 58, 95].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t ${i === 5 ? 'bg-indigo-500' : 'bg-indigo-200 dark:bg-indigo-900'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                )}
                {feat.id === 'customers' && (
                  <div className="flex justify-between items-center rounded-xl bg-teal-50 dark:bg-teal-950/40 px-3 py-2 text-xs">
                    <span className="font-bold text-teal-700 dark:text-teal-300">{isBn ? 'বকেয়া খাতা' : 'Due Khata'}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">৳12,400</span>
                  </div>
                )}
                {feat.id === 'product' && (
                  <div className="flex flex-wrap gap-1.5">
                    {['SKU', 'Size', 'Color', 'Brand'].map((s) => (
                      <span key={s} className="px-2 py-1 rounded-md bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
