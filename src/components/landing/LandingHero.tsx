import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { RetailInventoryAnimation } from './RetailInventoryAnimation';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Printer,
  ScanBarcode,
  FileText,
  Smartphone,
} from 'lucide-react';

interface LandingHeroProps {
  onOpenSignup: (plan?: 'free' | 'pro' | 'premium') => void;
  onOpenDemo: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onOpenSignup, onOpenDemo }) => {
  const { language } = useApp();
  const isBn = language === 'bn';

  // Hardware YearInvo genuinely works with — thermal + A4 printing, barcode
  // scanners, label printers, and any phone or PC (no special device needed).
  const hardwareItems = isBn
    ? ['থার্মাল প্রিন্টার', 'A4 প্রিন্ট', 'বারকোড স্ক্যানার', 'লেবেল প্রিন্টার', 'যেকোনো ফোন বা পিসি']
    : ['Thermal printers', 'A4 printing', 'Barcode scanners', 'Label printers', 'Any phone or PC'];

  return (
    <>
      <section id="home" className="relative hero-grid-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* LEFT: headline, subtext, CTAs */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">

              {/* Badge pill — dark translucent, green "New" chip */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-semibold text-slate-200"
              >
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold leading-none">
                  {isBn ? 'নতুন' : 'New'}
                </span>
                <span>
                  {isBn ? '১ মাসের ফ্রি ট্রায়াল' : '1 MONTH FREE TRIAL'}
                </span>
              </motion.div>

              {/* H1 — white, last line lavender → mint gradient */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-white tracking-tight leading-[1.08]"
              >
                {isBn ? (
                  <>
                    আধুনিক খুচরা দোকানের
                    <br />
                    স্মার্ট POS ও ইনভেন্টরি
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A5B4FC] to-[#5EEAD4]">
                      এক জায়গায়
                    </span>
                  </>
                ) : (
                  <>
                    Modern Retail POS &amp;
                    <br />
                    Smart Inventory
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A5B4FC] to-[#5EEAD4]">
                      in One Place
                    </span>
                  </>
                )}
              </motion.h1>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0"
              >
                {isBn
                  ? 'দ্রুত বিলিং, অটো স্টক অ্যালার্ট, কাস্টমার বকেয়া খাতা ট্র্যাকিং, বারকোড স্টিকার প্রিন্ট ও এআই বিজনেস ইনসাইট — আপনার সকল দোকানের হিসাব এক জায়গায়।'
                  : 'Fast billing, automated stock alerts, customer due khata tracking, thermal barcode sticker printing, and AI business insights — all in one powerful SaaS platform.'}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenSignup}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isBn ? 'ফ্রি শুরু করুন' : 'Get Started Free'}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onOpenDemo}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isBn ? 'লাইভ ডেমো দেখুন' : 'Explore Live Demo'}</span>
                </motion.button>
              </motion.div>

              {/* Muted bottom row */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="pt-1 text-xs font-semibold text-slate-500"
              >
                {isBn
                  ? '১ মাস ফ্রি ট্রায়াল  •  ক্রেডিট কার্ড লাগে না  •  ওয়েব ও যেকোনো ফোন'
                  : 'Free 1-month trial  •  No credit card  •  Web + any phone'}
              </motion.p>
            </div>

            {/* RIGHT: overlapping product mockups */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 relative flex justify-center"
            >
              <RetailInventoryAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* WORKS WITH YOUR HARDWARE strip */}
      <div className="bg-white dark:bg-[#09090b] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {isBn ? 'আপনার হার্ডওয়্যারের সাথে চলে' : 'Works with your hardware'}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {hardwareItems.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i === 0 && <Printer className="w-3.5 h-3.5 text-indigo-500" />}
                {i === 1 && <FileText className="w-3.5 h-3.5 text-indigo-500" />}
                {i === 2 && <ScanBarcode className="w-3.5 h-3.5 text-indigo-500" />}
                {i === 3 && <Printer className="w-3.5 h-3.5 text-indigo-500" />}
                {i === 4 && <Smartphone className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{item}</span>
                {i < hardwareItems.length - 1 && <span className="text-slate-300 dark:text-slate-700">•</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
