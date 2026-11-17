import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { getDisplayBrandName } from '../../utils/brand';
import {
  ShoppingCart,
  FileText,
  CheckCircle2,
  ScanBarcode,
  Cloud,
  ArrowRight,
} from 'lucide-react';

export const RetailInventoryAnimation: React.FC = () => {
  const { settings, language, convertMoney, displayCurrencySymbol } = useApp();
  const isBn = language === 'bn';
  // Convert a BDT amount to the selected display currency using the same
  // live exchange rates as the pricing section (not just the symbol).
  const money = (bdtAmount: number) =>
    `${displayCurrencySymbol}${convertMoney(bdtAmount, 'BDT').toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const brandName = getDisplayBrandName(settings.brandName) || 'Store';

  const items = [
    { name: 'Cotton Polo Shirt', sku: 'POLO-01', price: 850 },
    { name: 'Wireless Earbuds', sku: 'EAR-99', price: 1650 },
    { name: 'Denim Slim Jeans', sku: 'JNS-42', price: 1450 },
  ];

  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:max-w-none pb-4 pr-2">
      {/* ========================================================= */}
      {/* BACK: light A4 invoice card with green PAID stamp         */}
      {/* ========================================================= */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [2.5, 2, 2.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 sm:right-2 z-0 w-48 sm:w-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xl rotate-[2.5deg]"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isBn ? 'ইনভয়েস' : 'Invoice'} #INV-2041
          </span>
          <FileText className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="pt-2 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-500">
            <span>{brandName}</span>
            <span>{isBn ? 'আজ' : 'Today'}</span>
          </div>
          {items.slice(0, 2).map((item) => (
            <div key={item.sku} className="flex justify-between text-slate-700">
              <span className="truncate">{item.name}</span>
              <span className="font-semibold shrink-0">{money(item.price)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1.5 border-t border-dashed border-slate-300 font-bold text-slate-900">
            <span>{isBn ? 'মোট' : 'Total'}</span>
            <span>{money(2500)}</span>
          </div>
        </div>
        {/* Green PAID stamp */}
        <div className="absolute -bottom-2 right-4 px-2.5 py-1 rounded-md border-2 border-emerald-500 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rotate-[-6deg] bg-white/90">
          {isBn ? 'পরিশোধিত' : 'Paid'}
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* FRONT: dark POS checkout card                             */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mt-44 mr-6 sm:mr-16 bg-[#131A3A] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/50"
      >
        {/* Card header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">
                {isBn ? 'POS চেকআউট' : 'POS Checkout'}
              </p>
              <p className="text-[10px] text-slate-400">{brandName}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isBn ? 'লাইভ' : 'Live'}
          </span>
        </div>

        {/* Cart items */}
        <div className="py-3 space-y-2">
          {items.map((item, idx) => (
            <div key={item.sku} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-md bg-white/10 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-200 font-medium truncate">{item.name}</span>
              </div>
              <span className="text-white font-bold shrink-0">{money(item.price)}</span>
            </div>
          ))}
        </div>

        {/* Total + PAID */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isBn ? 'মোট বিল' : 'Net Total'}
            </p>
            <p className="text-xl font-extrabold text-white">{money(3950)}</p>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isBn ? 'পরিশোধিত' : 'PAID'}
          </span>
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* OVERLAP: white thermal receipt                            */}
      {/* ========================================================= */}
      <motion.div
        animate={{ y: [0, -7, 0], rotate: [-2, -1.5, -2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-20 -mt-4 ml-auto mr-2 sm:mr-6 w-40 sm:w-44 bg-white rounded-xl p-3 shadow-2xl rotate-[-2deg] text-slate-900"
      >
        <p className="text-[9px] font-black uppercase tracking-wide text-center text-slate-500 truncate">
          {brandName}
        </p>
        <p className="text-center text-[9px] text-slate-400 pb-1.5 border-b border-dashed border-slate-300">
          {isBn ? 'থার্মাল রসিদ' : 'Thermal Receipt'}
        </p>
        <div className="py-1.5 space-y-1 text-[10px] font-medium">
          <div className="flex justify-between"><span>Polo Shirt</span><span>{money(850)}</span></div>
          <div className="flex justify-between"><span>Earbuds</span><span>{money(1650)}</span></div>
          <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 font-bold">
            <span>{isBn ? 'মোট' : 'Total'}</span><span>{money(2500)}</span>
          </div>
        </div>
        <p className="text-center font-mono text-[8px] tracking-tighter text-slate-500">
          |||| | |||| | ||| | ||||
        </p>
        <p className="text-center text-[9px] font-bold text-emerald-600 pt-0.5">
          ✓ {isBn ? 'পরিশোধিত' : 'PAID'} — {isBn ? 'ধন্যবাদ' : 'Thank you'}
        </p>
      </motion.div>

      {/* Floating dark pill labels */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-3 left-0 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/15 text-white text-[11px] font-bold shadow-xl"
      >
        <ScanBarcode className="w-3.5 h-3.5 text-indigo-400" />
        {isBn ? 'বারকোড স্ক্যান হয়েছে' : 'Barcode scanned'}
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 left-0 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F172A] border border-white/15 text-white text-[11px] font-bold shadow-xl"
      >
        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
        {isBn ? 'ক্লাউডে সিঙ্ক হয়েছে' : 'Synced to cloud'}
        <ArrowRight className="w-3 h-3 text-slate-500" />
      </motion.div>
    </div>
  );
};
