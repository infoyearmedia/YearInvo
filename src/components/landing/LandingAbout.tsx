import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  LineChart,
  BookOpen,
  Users,
  ShieldCheck,
  Headphones,
  Check,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

interface LandingAboutProps {
  onOpenSignup: (plan?: 'free' | 'pro' | 'premium') => void;
}

export const LandingAbout: React.FC<LandingAboutProps> = ({ onOpenSignup }) => {
  const { language } = useApp();
  const isBn = language === 'bn';

  const ownerCards = [
    {
      icon: Building2,
      title: isBn ? 'সব শাখা এক চোখে' : 'All branches at a glance',
      desc: isBn ? 'প্রতিটি শাখার বিক্রি ও স্টক এক ড্যাশবোর্ডে দেখুন।' : 'Sales and stock of every branch on one dashboard.',
    },
    {
      icon: LineChart,
      title: isBn ? 'লাভ-ক্ষতির রিপোর্ট' : 'Profit & loss reports',
      desc: isBn ? 'দৈনিক ও মাসিক আসল লাভের হিসাব অটোমেটিক।' : 'Daily and monthly true profit, calculated automatically.',
    },
    {
      icon: BookOpen,
      title: isBn ? 'বকেয়া খাতার সারসংক্ষেপ' : 'Due khata overview',
      desc: isBn ? 'কে কত বাকি রেখেছে, এক নজরে পুরো চিত্র।' : 'Who owes what — the full picture in one view.',
    },
    {
      icon: Users,
      title: isBn ? 'স্টাফ রোল ও অনুমতি' : 'Staff roles & permissions',
      desc: isBn ? 'কে কী দেখবে আর কী করতে পারবে, আপনি ঠিক করুন।' : 'You decide who sees what and who can do what.',
    },
    {
      icon: ShieldCheck,
      title: isBn ? 'নিরাপদ ক্লাউড ব্যাকআপ' : 'Secure cloud backup',
      desc: isBn ? 'সুপাবেস এনক্রিপশনে আপনার হিসাব নিরাপদে সংরক্ষিত।' : 'Your accounts stay safe with Supabase-encrypted cloud storage.',
    },
    {
      icon: Headphones,
      title: isBn ? 'প্রায়োরিটি সাপোর্ট' : 'Priority support',
      desc: isBn ? 'Premium প্ল্যানে ফোন ও হোয়াটসঅ্যাপে অগ্রাধিকার সহায়তা।' : 'Priority phone & WhatsApp help on the Premium plan.',
    },
  ];

  const mobileChecks = isBn
    ? ['যেকোনো ফোনের ব্রাউজারে চলে — অ্যাপ নামাতে হয় না', 'এক হাতে POS বিলিং ও স্টক চেক', 'মোবাইল ও পিসিতে অটো ক্লাউড সিঙ্ক', 'ফোন থেকে থার্মাল প্রিন্টারে রসিদ প্রিন্ট']
    : ['Runs in any phone browser — no app download needed', 'One-handed POS billing and stock checks', 'Automatic cloud sync between phone and PC', 'Print thermal receipts from your phone'];

  const startSteps = [
    {
      n: '1',
      title: isBn ? 'ফোনে সাইটটি খুলুন' : 'Open the site on your phone',
      desc: isBn ? 'যেকোনো ব্রাউজার থেকে YearInvo খুলুন।' : 'Open YearInvo from any browser.',
    },
    {
      n: '2',
      title: isBn ? 'ফ্রি স্টোর তৈরি করুন' : 'Create your free store',
      desc: isBn ? '১ মাসের ফ্রি ট্রায়াল — ক্রেডিট কার্ড লাগে না।' : '1 month free trial — no credit card needed.',
    },
    {
      n: '3',
      title: isBn ? 'বিক্রি শুরু করুন' : 'Start selling',
      desc: isBn ? 'প্রোডাক্ট যোগ করুন, বারকোড প্রিন্ট করুন, বিল করুন।' : 'Add products, print barcodes, and start billing.',
    },
  ];

  return (
    <>
      {/* ========================================================= */}
      {/* FOR OWNERS — dark navy band                               */}
      {/* ========================================================= */}
      <section id="about" className="hero-grid-bg py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left: heading + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-5 space-y-5"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
                {isBn ? 'দোকান মালিকদের জন্য' : 'For Owners'}
              </span>
              <h2 className="text-3xl sm:text-[40px] font-extrabold text-white tracking-tight leading-tight">
                {isBn
                  ? 'দোকানের পুরো চিত্র, আপনার হাতের মুঠোয়'
                  : 'See your whole business, in one place'}
              </h2>
              <p className="text-base text-slate-400 leading-relaxed">
                {isBn
                  ? 'YearInvo by Year Media — খুচরা দোকান, সুপারমার্কেট ও পাইকারি ব্যবসার জন্য আধুনিক ক্লাউড POS ও ইনভেন্টরি প্ল্যাটফর্ম। খাতাপত্রের ঝামেলা ছাড়াই বিক্রি, স্টক ও বকেয়ার হিসাব।'
                  : 'YearInvo by Year Media is a modern cloud POS and inventory platform for retail shops, supermarkets, and wholesale businesses — sales, stock, and dues without the paper khata.'}
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenSignup('free')}
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>{isBn ? 'ফ্রি শুরু করুন' : 'Start Free'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {/* Right: 2×3 grid of dark translucent cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ownerCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2.5 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{c.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MOBILE APP — works on any phone browser                   */}
      {/* ========================================================= */}
      <section className="py-20 sm:py-24 bg-white dark:bg-[#09090b] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: checks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                {isBn ? 'মোবাইল অ্যাপ' : 'Mobile App'}
              </span>
              <h2 className="text-3xl sm:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {isBn ? 'পুরো দোকান, আপনার পকেটে' : 'Your whole store, in your pocket'}
              </h2>
              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                {isBn
                  ? 'দোকানে না থাকলেও বিক্রি, স্টক আর বকেয়া দেখুন ফোন থেকে। আলাদা অ্যাপ নামানোর দরকার নেই — ব্রাউজারেই চলে।'
                  : 'Check sales, stock, and dues from your phone, even away from the shop. No separate app to install — it runs in the browser.'}
              </p>
              <div className="space-y-3 pt-1">
                {mobileChecks.map((c) => (
                  <div key={c} className="flex items-start gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: HOW TO START panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {isBn ? 'কীভাবে শুরু করবেন' : 'How to start'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn ? '৩টি সহজ ধাপ' : '3 simple steps'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {startSteps.map((s) => (
                  <div key={s.n} className="flex items-start gap-3.5">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-extrabold flex items-center justify-center shrink-0">
                      {s.n}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenSignup('free')}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isBn ? 'ফ্রি স্টোর তৈরি করুন' : 'Create Your Free Store'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};
