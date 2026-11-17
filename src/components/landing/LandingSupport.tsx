import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  HelpCircle,
  Mail,
  ChevronDown,
  BookOpen,
  QrCode,
  Printer,
  CreditCard,
} from 'lucide-react';

interface LandingSupportProps {
  onOpenSignup: (plan?: 'free' | 'pro' | 'premium') => void;
  onOpenDemo: () => void;
}

export const LandingSupport: React.FC<LandingSupportProps> = ({ onOpenSignup, onOpenDemo }) => {
  const { language } = useApp();
  const isBn = language === 'bn';

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const helpTopics = [
    {
      title: isBn ? 'শুরু করার গাইড' : 'Getting Started Guide',
      desc: isBn ? 'নতুন দোকান সেটআপ ও ইনভেন্টরি যুক্ত করার নির্দেশিকা।' : 'How to set up your store and add initial product inventory.',
      icon: BookOpen,
    },
    {
      title: isBn ? 'POS ও বারকোড স্ক্যানার' : 'POS Scanner Setup',
      desc: isBn ? 'ইউএসবি ও ব্লুটুথ বারকোড স্ক্যানার কানেক্ট করার উপায়।' : 'Connecting USB or Bluetooth handheld barcode scanners.',
      icon: QrCode,
    },
    {
      title: isBn ? 'থার্মাল প্রিন্টার সেটিংস' : 'Thermal Printer Config',
      desc: isBn ? '2-ইঞ্চি ও 3-ইঞ্চি পজ থার্মাল প্রিন্টারে মেমো প্রিন্ট করা।' : 'Printing sales invoices on thermal receipt printers.',
      icon: Printer,
    },
    {
      title: isBn ? 'বাকী খাতা ও পেমেন্ট' : 'Customer Dues & Ledger',
      desc: isBn ? 'বকেয়া হিসাব ট্র্যাকিং ও কাস্টমার লেজার দেখার নিয়ম।' : 'Tracking customer due balances and partial payments.',
      icon: CreditCard,
    },
  ];

  const faqs = [
    {
      q: isBn ? 'YearInvo সফটওয়্যার কি সম্পূর্ণ ফ্রি ব্যবহার করা যায়?' : 'Is YearInvo really free to try?',
      a: isBn
        ? 'হ্যাঁ! আমাদের Free Starter Plan ১ মাসের জন্য সম্পূর্ণ ফ্রি। আপনি ৫টি প্রোডাক্ট পর্যন্ত কোনো ফি ছাড়াই ট্রায়াল দিতে পারবেন।'
        : 'Yes! Our Free Starter Plan includes a 1 month free trial with no credit card required. You can manage up to 5 products during trial.',
    },
    {
      q: isBn ? 'বারকোড স্টিকার কি যেকোনো প্রিন্টারে প্রিন্ট করা যাবে?' : 'Can I print barcode stickers on thermal sticker printers?',
      a: isBn
        ? 'হ্যাঁ, YearInvo সকল স্ট্যান্ডার্ড থার্মাল স্টিকার প্রিন্টারে Code128 বারকোড স্টিকার প্রিন্ট সমর্থন করে।'
        : 'Yes, YearInvo generates standard Code128 barcodes compatible with all 2-inch and 3-inch thermal label printers.',
    },
    {
      q: isBn ? 'ইন্টারনেট সাময়িক না থাকলে কি বিক্রি বন্ধ হয়ে যাবে?' : 'How does cloud backup work?',
      a: isBn
        ? 'মোটেও না! লোকাল স্টোরেজ ক্যাশ থাকার কারণে বিক্রি স্বাভাবিক থাকবে এবং ইন্টারনেট এলে অটোম্যাটিক ক্লাউডে সিঙ্ক হয়ে যাবে।'
        : 'Your data is securely stored in Supabase cloud storage. Changes sync across all logged-in devices.',
    },
    {
      q: isBn ? 'আমি কি পরে প্ল্যান পরিবর্তন করতে পারবো?' : 'Can I upgrade or change my plan anytime?',
      a: isBn
        ? 'হ্যাঁ, আপনি যেকোনো সময় আপনার স্টোর ড্যাশবোর্ড থেকে Free থেকে Pro বা Premium প্ল্যানে উন্নীত হতে পারবেন।'
        : 'Yes, you can upgrade, downgrade, or request plan switches at any time directly from your store dashboard.',
    },
    {
      q: isBn ? 'ফ্রি ট্রায়ালের জন্য কি ক্রেডিট কার্ড লাগবে?' : 'Do I need a credit card for the free trial?',
      a: isBn
        ? 'না, ১ মাসের ফ্রি ট্রায়াল শুরু করতে কোনো ক্রেডিট কার্ড বা পেমেন্ট তথ্য লাগে না।'
        : 'No. You can start the 1 month free trial without any credit card or payment details.',
    },
    {
      q: isBn ? 'একাধিক ডিভাইস বা শাখা থেকে কি ব্যবহার করা যাবে?' : 'Can I use YearInvo on multiple devices or branches?',
      a: isBn
        ? 'হ্যাঁ, ক্লাউড সিঙ্কের মাধ্যমে মোবাইল ও পিসি থেকে একই স্টোর পরিচালনা করা যায়। শাখার সংখ্যা আপনার প্ল্যানের উপর নির্ভর করে — Pro প্ল্যানে ১টি শাখা, Premium প্ল্যানে আনলিমিটেড শাখা।'
        : 'Yes, cloud sync lets you run the same store from mobile and PC. Branches depend on your plan — 1 branch on Pro, unlimited branches on Premium.',
    },
    {
      q: isBn ? 'কোন কোন পেমেন্ট মাধ্যম সমর্থিত?' : 'Which payment methods are supported?',
      a: isBn
        ? 'বাংলাদেশে বিকাশ, নগদ ও রকেটের মাধ্যমে পেমেন্ট করা যায়। আন্তর্জাতিক কার্ড পেমেন্টের জন্য Paddle সমর্থিত।'
        : 'In Bangladesh you can pay via bKash, Nagad and Rocket. International card payments are supported through Paddle.',
    },
    {
      q: isBn ? 'ফ্রি ট্রায়াল শেষ হলে কী হবে?' : 'What happens after my free trial ends?',
      a: isBn
        ? 'ট্রায়াল শেষ হলে আপনার স্টোরের ডাটা নিরাপদে সংরক্ষিত থাকবে। চালিয়ে যেতে Pro বা Premium প্ল্যানে আপগ্রেড করতে হবে।'
        : 'After the trial ends, your store data stays safely stored. To keep using the full features, upgrade to a Pro or Premium plan.',
    },
    {
      q: isBn ? 'শুরু করতে কি বিশেষ হার্ডওয়্যার লাগবে?' : 'Do I need any special hardware to start?',
      a: isBn
        ? 'না। যেকোনো মোবাইল, ল্যাপটপ বা পিসি থেকেই YearInvo চলে। থার্মাল প্রিন্টার বা বারকোড স্ক্যানার থাকলে আরও সুবিধা, তবে বাধ্যতামূলক নয়।'
        : 'No. YearInvo runs on any phone, laptop, or PC. A thermal printer or barcode scanner is handy but not required.',
    },
    {
      q: isBn ? 'ইন্টারনেট ছাড়া কি বিক্রি করা যাবে?' : 'Can I sell without the internet?',
      a: isBn
        ? 'হ্যাঁ, লোকাল স্টোরেজ ক্যাশ থাকার কারণে বিক্রি স্বাভাবিক থাকবে এবং ইন্টারনেট ফিরে এলে ডাটা অটোম্যাটিক ক্লাউডে সিঙ্ক হয়ে যাবে।'
        : 'Yes. A local cache keeps sales running offline, and everything syncs to the cloud automatically once you are back online.',
    },
    {
      q: isBn ? 'থার্মাল রসিদ কীভাবে প্রিন্ট করব?' : 'How do I print a thermal receipt?',
      a: isBn
        ? 'POS থেকে বিল সম্পন্ন করে Thermal Print বোতামে চাপ দিন। আপনার থার্মাল প্রিন্টারটি ফোন বা পিসির সাথে কানেক্ট থাকতে হবে।'
        : 'Finish the bill in POS and tap Thermal Print. Your thermal printer just needs to be connected to your phone or PC.',
    },
    {
      q: isBn ? 'আমার স্টাফরা কি একই দোকান ব্যবহার করতে পারবে?' : 'Can my staff use the same store?',
      a: isBn
        ? 'হ্যাঁ, Pro ও Premium প্ল্যানে মাল্টি-স্টাফ রোল আছে। প্রত্যেক স্টাফ নিজের লগইন পাবে, আর কে কী দেখবে তা আপনি ঠিক করে দিতে পারবেন।'
        : 'Yes. Pro and Premium include multi-staff roles — each staff member gets their own login, and you control what they can see and do.',
    },
  ];

  return (
    <section id="support" className="py-20 sm:py-24 bg-white dark:bg-[#09090b] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 max-w-3xl mx-auto"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            {isBn ? 'সাহায্য ও কাস্টমার সাপোর্ট' : 'HELP CENTER & SUPPORT'}
          </span>
          <h2 className="text-3xl sm:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {isBn
              ? 'আমরা আপনাকে ২৪/৭ সাহায্য করতে প্রস্তুত'
              : 'We Are Here to Help You Succeed'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
            {isBn
              ? 'যেকোনো প্রশ্ন, প্রযুক্তিগত সমস্যা বা ফিচারের বিস্তারিত জানতে আমাদের হেল্প সেন্টারে যোগাযোগ করুন।'
              : 'Browse our help guides, search common questions, or message our dedicated support desk directly.'}
          </p>
        </motion.div>

        {/* Help Center Grid Topics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {helpTopics.map((topic, i) => {
            const Icon = topic.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 space-y-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{topic.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{topic.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Accordion Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto"
        >
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {isBn ? 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)' : 'Frequently Asked Questions'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isBn ? 'YearInvo সম্পর্কে ব্যবসায়ীদের জনপ্রিয় সাধারণ প্রশ্ন ও উত্তর।' : 'Quick answers to common questions about YearInvo features.'}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3 leading-relaxed font-normal overflow-hidden"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Contact Support & Live Chat Section */}
        <div id="contact" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Support Info Box */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="space-y-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8"
          >
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                DIRECT HELP DESK
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {isBn ? 'সাপোর্ট টিমের সাথে কথা বলুন' : 'Get in Touch with Our Team'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isBn
                  ? 'আপনার কোনো জিজ্ঞাসা থাকলে মেইল বা ফোনেই সরাসরি আমাদের সাথে কথা বলুন।'
                  : 'Have custom requirements or need help setting up your store printer? Reach out via phone or email.'}
              </p>
            </div>

            {/* Support Channels */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Support</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">yearinvo@gmail.com</p>
                  <p className="text-[10px] text-slate-500">support@yearinvo.com</p>
                </div>
              </div>

              {/* Email Us card — there is no in-app live chat, so contact is by email */}
              <a
                href="mailto:yearinvo@gmail.com"
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Email Us</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Write to yearinvo@gmail.com — we reply by email.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                  Email
                </span>
              </a>
            </div>
          </motion.div>

          {/* Right — Email Support (no in-app contact form; messages go by email) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4"
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isBn ? 'মেসেজ পাঠান' : 'Send Us a Message'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn
                ? 'আপনার প্রশ্ন বা সমস্যার কথা ইমেইলে লিখুন — আপনার মেইল অ্যাপটি খুলে যাবে।'
                : 'Write to us by email — this opens your mail app with our support address filled in.'}
            </p>
            <a
              href="mailto:yearinvo@gmail.com?subject=YearInvo%20Support%20Request"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/25"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isBn ? 'ইমেইল করুন — yearinvo@gmail.com' : 'Email Us — yearinvo@gmail.com'}</span>
            </a>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isBn
                ? 'আপনার দোকানের নাম ও সমস্যার বিবরণ ইমেইলে উল্লেখ করুন।'
                : 'Please include your store name and a short description of your question in the email.'}
            </p>
          </motion.div>

        </div>

        {/* FINAL CTA — indigo → violet gradient panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 px-6 py-12 sm:p-14 text-center space-y-5 shadow-2xl shadow-indigo-600/25"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)', backgroundSize: '44px 44px' }}
          />
          <div className="relative space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {isBn ? 'আজই আপনার দোকান ডিজিটাল করুন' : 'Take your store digital today'}
            </h2>
            <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
              {isBn
                ? '১ মাসের ফ্রি ট্রায়াল দিয়ে শুরু করুন। কোনো ক্রেডিট কার্ড লাগে না, সেটআপে লাগে মাত্র ২ মিনিট।'
                : 'Start with a 1 month free trial. No credit card needed, and setup takes about 2 minutes.'}
            </p>
          </div>
          <div className="relative flex flex-wrap items-center justify-center gap-3 pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenSignup('free')}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer"
            >
              {isBn ? 'ফ্রি শুরু করুন' : 'Get Started Free'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDemo}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              {isBn ? 'লাইভ ডেমো দেখুন' : 'Explore Live Demo'}
            </motion.button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
