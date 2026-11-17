import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HelpCircle,
  Mail,
  Phone,
  BookOpen,
  FileText,
  Bug,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Headphones,
  Zap,
  Printer,
  Boxes,
  CreditCard,
  Clock,
} from 'lucide-react';

export const HelpSupportView: React.FC = () => {
  const { language, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'support' | 'faq' | 'guide' | 'feedback'>('support');
  const [faqCategory, setFaqCategory] = useState<string>('All');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Bug / Feature Request Form State
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature'>('bug');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackSeverity, setFeedbackSeverity] = useState('Medium');

  // FAQs List
  const faqs = [
    {
      category: 'POS & Sales',
      question: 'How do I scan products using a USB or Bluetooth Barcode Scanner?',
      answer: 'Simply plug in your USB barcode scanner into your computer or connect via Bluetooth. YearInvo automatically listens for hardware barcode scans when you are on the POS or Quick Sale page without needing to click any text box.',
    },
    {
      category: 'POS & Sales',
      question: 'Can I issue due/credit sales to customers without receiving full cash?',
      answer: 'Yes! Select "Due/Credit" as payment method or enter a lower amount in "Paid Amount". The system will calculate the remaining balance and prompt you to pick or create a customer record to track their due ledger.',
    },
    {
      category: 'Inventory',
      question: 'What happens when a product reaches its expiry date?',
      answer: 'Products that reach or pass their expiration date will be automatically flagged with an "EXPIRED" badge in inventory. The POS counter will block sales of expired items to protect customer safety.',
    },
    {
      category: 'Printer & Barcode',
      question: 'How do I print 58mm or 80mm thermal receipts and barcode stickers?',
      answer: 'Click "Print Receipt" or "Print Barcode Labels". Select your connected POS printer (Xprinter, POS-58, Zebra, TSC) in the browser print dialog and set layout margins to None.',
    },
    {
      category: 'Subscription & Account',
      question: 'How do I upgrade from Free to Pro or Premium Plan?',
      answer: 'Go to the Subscription menu in the sidebar or click "Upgrade Plan". Select your desired plan (Pro or Premium) and follow the simple activation instructions.',
    },
    {
      category: 'General',
      question: 'Is my store sales data saved safely offline?',
      answer: 'Yes! YearInvo syncs your product items, customer ledgers, and transaction records to the cloud via Supabase, with a local cache on your device so sales keep working offline and sync when you are back online.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = faqCategory === 'All' || faq.category === faqCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });



  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Support Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#ff5c01]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#ff5c01] text-white shadow-lg shadow-[#ff5c01]/20">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#ff5c01] uppercase tracking-wider">Help &amp; Support Hub</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">How can we help you today?</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                <Mail className="w-3 h-3" />
                Email: yearinvo@gmail.com
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Welcome to the YearInvo Support Center. Search FAQs, read documentation, contact customer support, or send a feature request.
          </p>

          {/* Navigation Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            {[
              { id: 'support', label: 'Contact Support', icon: Phone },
              { id: 'faq', label: 'FAQs & Answers', icon: HelpCircle },
              { id: 'guide', label: 'User Guide & Docs', icon: BookOpen },
              { id: 'feedback', label: 'Bug & Feature Request', icon: Bug },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#ff5c01] text-white shadow-md shadow-[#ff5c01]/25'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. CONTACT SUPPORT SECTION */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Email Support */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-500 transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase border border-indigo-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> &lt; 2hr Reply
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Email Support</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Send technical queries or invoice attachment requests directly to our support engineers.
                </p>
                <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  yearinvo@gmail.com
                </p>
              </div>

              <a
                href="mailto:yearinvo@gmail.com?subject=POS%20Support%20Request"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email Ticket</span>
              </a>
            </div>

            {/* FAQs — answers first, before emailing */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#ff5c01] transition-all group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-[#ff5c01]/10 text-[#ff5c01] group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff5c01]/10 text-[#ff5c01] font-bold text-[10px] uppercase border border-[#ff5c01]/20">
                    Self-Help
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">FAQs &amp; Answers</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Most POS, printer, barcode and due-ledger questions are already answered in the FAQ section.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('faq')}
                className="w-full py-3 bg-[#ff5c01] hover:bg-[#e05100] text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#ff5c01]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Browse FAQs</span>
              </button>
            </div>
          </div>

          {/* Quick SLA & Support Commitment Card */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ff5c01]/10 text-[#ff5c01] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100">Premium Support Guarantee</h4>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Pro and Premium subscribers receive priority response times and remote desktop support.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('faq')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs hover:border-[#ff5c01] transition-colors whitespace-nowrap cursor-pointer shrink-0"
            >
              Browse FAQs Instead →
            </button>
          </div>
        </div>
      )}

      {/* 2. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      {activeTab === 'faq' && (
        <div className="space-y-5">
          {/* FAQ Search & Category Filter */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                placeholder="Search FAQ questions (e.g. barcode scanner, printer, dues, expiry)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#ff5c01]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {['All', 'POS & Sales', 'Inventory', 'Printer & Barcode', 'Subscription & Account', 'General'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    faqCategory === cat
                      ? 'bg-[#ff5c01] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordions List */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 hover:text-[#ff5c01] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#ff5c01]/10 text-[#ff5c01] text-[10px] font-black uppercase shrink-0">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#ff5c01] shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No matching FAQ found for "{faqSearchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. USER GUIDE & DOCUMENTATION */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Guide Item 1: POS & Quick Sale */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">POS Counter &amp; Quick Sale Guide</h3>
                  <p className="text-[11px] text-slate-400">Step-by-step cashier counter workflow</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed pt-1">
                <li>Use <strong>Quick Sale</strong> for high-speed small shop checkouts.</li>
                <li>Use <strong>POS Register</strong> for full supermarket receipts, barcode label scanning, and customer due management.</li>
                <li>Connect any standard USB/Bluetooth barcode scanner and scan directly.</li>
              </ul>
            </div>

            {/* Guide Item 2: Barcode & Label Thermal Printer */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Thermal Printer &amp; Barcode Label Setup</h3>
                  <p className="text-[11px] text-slate-400">58mm / 80mm receipts &amp; sticker printing</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed pt-1">
                <li>Generate custom 1D/2D barcodes in <strong>Barcode &amp; QR Code</strong> menu.</li>
                <li>Supports standard thermal printers (Xprinter, POS-58, Zebra, Rongta).</li>
                <li>Configure page size to 58mm roll or sticker labels in browser print settings.</li>
              </ul>
            </div>

            {/* Guide Item 3: Inventory & Expiry Tracking */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Inventory Audit &amp; Expiry Alert</h3>
                  <p className="text-[11px] text-slate-400">Stock audit, cost value &amp; expiration dates</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed pt-1">
                <li>Add minimum stock alert threshold per product to trigger automatic warnings.</li>
                <li>Monitor expiring items under <strong>Expired Products</strong> view.</li>
                <li>Track total inventory valuation based on purchase cost vs selling price.</li>
              </ul>
            </div>

            {/* Guide Item 4: Customer Due Ledger */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Customer Due &amp; Credit Ledger</h3>
                  <p className="text-[11px] text-slate-400">Collection records &amp; payment receipts</p>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside leading-relaxed pt-1">
                <li>Assign sales to registered customer profiles to record due balances.</li>
                <li>Collect partial or full due payments under <strong>Due Management</strong>.</li>
                <li>Print due collection receipts for customers.</li>
              </ul>
            </div>
          </div>

          {/* Download Documentation PDF Box */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ff5c01] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#ff5c01]/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Download Full User Manual (PDF)</h4>
                <p className="text-xs text-slate-300">Complete offline PDF documentation guide for staff &amp; cashiers.</p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-[#ff5c01] hover:bg-[#e05100] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              📄 Print / Save Documentation
            </button>
          </div>
        </div>
      )}

      {/* 4. REPORT A BUG & FEATURE REQUEST */}
      {activeTab === 'feedback' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-black text-xl text-slate-900 dark:text-slate-100">
              Report a Bug or Request a Feature
            </h3>
            <p className="text-xs text-slate-500">
              We continuously improve YearInvo based on merchant feedback.
            </p>
          </div>

            <div className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    feedbackType === 'bug' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Bug className="w-4 h-4" />
                  <span>Report a Bug</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('feature')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    feedbackType === 'feature' ? 'bg-[#ff5c01] text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Feature Request</span>
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {feedbackType === 'bug' ? 'Bug Summary / Issue Title *' : 'Feature Title *'}
                </label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder={feedbackType === 'bug' ? 'e.g. Thermal receipt margin cut off' : 'e.g. Add WhatsApp invoice sending'}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#ff5c01]"
                />
              </div>

              {/* Severity (for Bug) */}
              {feedbackType === 'bug' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={feedbackSeverity}
                    onChange={(e) => setFeedbackSeverity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#ff5c01]"
                  >
                    <option value="Low">Low - Minor visual tweak</option>
                    <option value="Medium">Medium - Feature non-critical issue</option>
                    <option value="High">High - Cashier counter blocked</option>
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  value={feedbackDesc}
                  onChange={(e) => setFeedbackDesc(e.target.value)}
                  placeholder="Provide details or steps to reproduce..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#ff5c01]"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                There is no in-app ticket system — this opens your mail app and sends your report to yearinvo@gmail.com.
              </p>

              <a
                href={`mailto:yearinvo@gmail.com?subject=${encodeURIComponent(
                  `[YearInvo ${feedbackType === 'bug' ? 'Bug' : 'Feature'}] ${feedbackTitle || 'Untitled'}`
                )}&body=${encodeURIComponent(
                  `${feedbackType === 'bug' ? `Severity: ${feedbackSeverity}\n\n` : ''}${feedbackDesc || '(No description entered yet.)'}`
                )}`}
                className="w-full py-3 bg-[#ff5c01] hover:bg-[#e05100] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#ff5c01]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>Email Report to yearinvo@gmail.com</span>
              </a>
            </div>
        </div>
      )}

    </div>
  );
};
