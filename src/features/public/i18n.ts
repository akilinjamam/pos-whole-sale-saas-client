import { useSyncExternalStore } from 'react';

/**
 * Bangla and English for the public website (landing, header, footer). Bangla is the default —
 * the customers are optical businesses in Bangladesh. The signed-in app stays English.
 *
 * Deliberately not an i18n library: one page and its frame, two languages. `bn` is typed as
 * `typeof en`, so a string added in English and forgotten in Bangla is a compile error.
 */

export type Lang = 'bn' | 'en';

const STORAGE_KEY = 'ow.publicLang';
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn'; // storage blocked (private mode, a strict browser) — still Bangla
  }
}

let current: Lang = read();

export function setLang(lang: Lang) {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* the choice just will not survive a reload */
  }
  listeners.forEach((l) => l());
}

/** The visitor's language and its strings. Re-renders every user when the switch flips. */
export function usePublicLang() {
  const lang = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  return { lang, t: STRINGS[lang], num: lang === 'bn' ? toBanglaDigits : String };
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
/** "৳1,500.00" → "৳১,৫০০.০০" — any string or number, digits only touched. */
export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]!);
}

const en = {
  meta: {
    title: 'Optical Wholesale — wholesale ERP and POS for optical businesses',
    description:
      'Wholesale orders, dispatch, invoices, dealer credit, stock with lots and serials, and a counter POS — one system for optical wholesalers in Bangladesh. Free trial, no card needed.',
  },
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    contact: 'Contact',
    signIn: 'Sign in',
    startTrial: 'Start free trial',
    /** The header button on a phone, where the full label does not fit. */
    startTrialShort: 'Free trial',
  },
  hero: {
    title: 'Run your optical wholesale business from one place here',
    text: 'Orders, dispatch, invoices, dealer credit and stock — with lots, expiry dates and serial numbers — plus a counter POS that sells from the same shelves.',
    cta: 'Start your free trial',
    seePricing: 'See pricing',
    watchDemo: 'Watch the demo',
    trialNote: (days: string) => `${days} days free with everything included. No card needed.`,
  },
  features: {
    title: 'Built for how wholesale works',
    text: "From the dealer's order to the money in your account, every step leaves a record you can check.",
    items: [
      {
        title: 'Wholesale orders',
        text: 'Take dealer orders with their own price tier, discounts within your rules, and approval when an order goes over a credit limit.',
      },
      {
        title: 'Dispatch and challans',
        text: 'Pick, pack and dispatch from the right warehouse. The challan and the invoice come out of the same step.',
      },
      {
        title: 'Dealer credit and collections',
        text: 'Credit limits and holds, receipts by cash, bKash, bank or cheque, a running statement and an ageing report for every dealer.',
      },
      {
        title: 'Stock you can trust',
        text: 'Every movement in a ledger: lots and expiry dates for lenses and solutions, serial numbers for frames and devices, transfers and counts.',
      },
      {
        title: 'Counter POS',
        text: 'Sell over the counter from the same stock, with shifts, cash counts, holds and returns — on an old tablet too.',
      },
      {
        title: 'Purchasing',
        text: 'Purchase orders, goods receipts with costing, supplier bills and payments, and returns to suppliers.',
      },
      {
        title: 'Reports',
        text: 'Sales, collections, dispatch and purchase registers, stock valuation and margins, by day, month or dealer.',
      },
      {
        title: 'Roles and an audit trail',
        text: 'Give each person only what they need — a store keeper never sees cost. Every change to prices, rules and numbers is recorded.',
      },
    ],
  },
  demo: {
    title: 'See it working',
    text: 'A short walk through a day at an optical wholesaler — from a dealer’s order to the money collected.',
  },
  steps: [
    {
      title: 'Sign up',
      text: 'Your business is ready in a minute, with a main warehouse and a shop counter already set up.',
    },
    {
      title: 'Add what you sell',
      text: 'Products, brands and prices — one by one or from a spreadsheet — then your dealers and opening stock.',
    },
    {
      title: 'Bring your team',
      text: 'Invite your sales reps, store keepers, accounts and cashiers, each with the access their job needs.',
    },
  ],
  pricing: {
    title: 'Simple pricing',
    text: 'Prices in Bangladeshi taka. Pay monthly or yearly by bKash, Nagad or bank transfer.',
    billing: 'Billing',
    monthly: 'Monthly',
    yearly: 'Yearly',
    freeTrialPlan: 'Free trial plan',
    month: 'month',
    year: 'year',
    save: (amount: string) => `Save ${amount} a year`,
    users: 'Users',
    locations: 'Warehouses and counters',
    products: 'Products',
    unlimited: 'Unlimited',
    core: 'Orders, dispatch, invoices, dealer credit, stock',
    receiving: 'Goods receipts, supplier bills and payments',
    pos: 'Counter POS',
    purchasing: 'Purchase orders',
    reports: 'Report suite',
    included: '(included)',
    notIncluded: '(not included)',
    startTrial: 'Start free trial',
    footnote: (days: string) =>
      `Every new business starts on a ${days}-day free trial. Choose your plan when you pay — you can change it later.`,
    /** Plan descriptions are written by the platform admin, in English; shown in English only. */
    showDescriptions: true,
  },
  contact: {
    title: 'Talk to us',
    text: 'Want a walkthrough, help moving your data in, or a question about plans? Call or message us.',
    whatsapp: 'WhatsApp',
    whatsappChat: 'Chat with us on WhatsApp',
  },
  cta: {
    title: 'Try it with your own products',
    text: 'Everything is open during the trial. Your data stays yours — download all of it at any time.',
  },
  footer: {
    tagline: 'Wholesale ERP and counter POS for optical businesses in Bangladesh.',
    contact: 'Contact',
    legal: 'Legal',
    terms: 'Terms of service',
    privacy: 'Privacy policy',
    refund: 'Refund policy',
    language: 'Language',
  },
  legal: { englishOnly: null as string | null },
  preview: "An illustration of the dashboard: today's sales, collections and orders",
};

const bn: typeof en = {
  meta: {
    title: 'Optical Wholesale — অপটিক্যাল ব্যবসার জন্য হোলসেল ইআরপি ও পিওএস',
    description:
      'হোলসেল অর্ডার, ডিসপ্যাচ, ইনভয়েস, ডিলার ক্রেডিট, লট ও সিরিয়ালসহ স্টক এবং কাউন্টার পিওএস — বাংলাদেশের অপটিক্যাল হোলসেলারদের জন্য একটি সিস্টেম। ফ্রি ট্রায়াল, কোনো কার্ড লাগবে না।',
  },
  nav: {
    features: 'ফিচার',
    pricing: 'মূল্য',
    contact: 'যোগাযোগ',
    signIn: 'সাইন ইন',
    startTrial: 'ফ্রি ট্রায়াল শুরু করুন',
    startTrialShort: 'ফ্রি ট্রায়াল',
  },
  hero: {
    title: 'আপনার অপটিক্যাল হোলসেল ব্যবসা চালান এক জায়গা থেকে',
    text: 'অর্ডার, ডিসপ্যাচ, ইনভয়েস, ডিলার ক্রেডিট আর স্টক — লট, মেয়াদ ও সিরিয়াল নম্বরসহ — সাথে একটি কাউন্টার পিওএস, যা একই স্টক থেকে বিক্রি করে।',
    cta: 'ফ্রি ট্রায়াল শুরু করুন',
    seePricing: 'মূল্য দেখুন',
    watchDemo: 'ডেমো দেখুন',
    trialNote: (days: string) => `${days} দিন ফ্রি, সব ফিচারসহ। কোনো কার্ড লাগবে না।`,
  },
  features: {
    title: 'হোলসেল যেভাবে চলে, সেভাবেই তৈরি',
    text: 'ডিলারের অর্ডার থেকে আপনার অ্যাকাউন্টে টাকা আসা পর্যন্ত — প্রতিটি ধাপের রেকর্ড থাকে, যা আপনি যাচাই করতে পারেন।',
    items: [
      {
        title: 'হোলসেল অর্ডার',
        text: 'প্রতিটি ডিলারের নিজস্ব মূল্য-স্তরে অর্ডার নিন, আপনার নিয়মের মধ্যে ছাড় দিন, আর ক্রেডিট লিমিট পার হলে অনুমোদন নিন।',
      },
      {
        title: 'ডিসপ্যাচ ও চালান',
        text: 'সঠিক গুদাম থেকে পিক, প্যাক ও ডিসপ্যাচ করুন। চালান আর ইনভয়েস একই ধাপে তৈরি হয়।',
      },
      {
        title: 'ডিলার ক্রেডিট ও আদায়',
        text: 'ক্রেডিট লিমিট ও হোল্ড; নগদ, বিকাশ, ব্যাংক বা চেকে টাকা গ্রহণ; প্রতিটি ডিলারের চলতি স্টেটমেন্ট ও এজিং রিপোর্ট।',
      },
      {
        title: 'নির্ভরযোগ্য স্টক',
        text: 'প্রতিটি মুভমেন্ট লেজারে থাকে: লেন্স ও সলিউশনের লট ও মেয়াদ, ফ্রেম ও ডিভাইসের সিরিয়াল নম্বর, ট্রান্সফার ও স্টক গণনা।',
      },
      {
        title: 'কাউন্টার পিওএস',
        text: 'একই স্টক থেকে কাউন্টারে বিক্রি করুন — শিফট, ক্যাশ গণনা, হোল্ড ও রিটার্নসহ — পুরনো ট্যাবলেটেও চলে।',
      },
      {
        title: 'ক্রয়',
        text: 'পারচেজ অর্ডার, খরচ হিসাবসহ মাল গ্রহণ, সাপ্লায়ারের বিল ও পেমেন্ট, এবং সাপ্লায়ারকে মাল ফেরত।',
      },
      {
        title: 'রিপোর্ট',
        text: 'বিক্রয়, আদায়, ডিসপ্যাচ ও ক্রয়ের রেজিস্টার, স্টকের মূল্যায়ন ও মার্জিন — দিন, মাস বা ডিলার অনুযায়ী।',
      },
      {
        title: 'রোল ও অডিট ট্রেইল',
        text: 'প্রত্যেককে শুধু তার কাজের প্রয়োজনীয় অ্যাক্সেস দিন — স্টোরকিপার কখনো ক্রয়মূল্য দেখেন না। দাম, নিয়ম ও নম্বরের প্রতিটি পরিবর্তন রেকর্ড হয়।',
      },
    ],
  },
  demo: {
    title: 'কাজ করতে দেখুন',
    text: 'একটি অপটিক্যাল হোলসেল ব্যবসার একটি দিন — ডিলারের অর্ডার থেকে টাকা আদায় পর্যন্ত — সংক্ষেপে।',
  },
  steps: [
    {
      title: 'সাইন আপ করুন',
      text: 'এক মিনিটেই আপনার ব্যবসা প্রস্তুত — একটি মূল গুদাম ও একটি দোকান-কাউন্টার আগে থেকেই সেট করা থাকে।',
    },
    {
      title: 'পণ্য যোগ করুন',
      text: 'পণ্য, ব্র্যান্ড ও দাম — একটি একটি করে বা স্প্রেডশিট থেকে — তারপর ডিলার ও শুরুর স্টক।',
    },
    {
      title: 'টিমকে যুক্ত করুন',
      text: 'সেলস রিপ, স্টোরকিপার, হিসাবরক্ষক ও ক্যাশিয়ারদের আমন্ত্রণ জানান — যার যার কাজ অনুযায়ী অ্যাক্সেস দিয়ে।',
    },
  ],
  pricing: {
    title: 'সহজ মূল্য',
    text: 'মূল্য বাংলাদেশি টাকায়। মাসিক বা বার্ষিক — বিকাশ, নগদ বা ব্যাংক ট্রান্সফারে পরিশোধ করুন।',
    billing: 'বিলিং',
    monthly: 'মাসিক',
    yearly: 'বার্ষিক',
    freeTrialPlan: 'ফ্রি ট্রায়ালের প্ল্যান',
    month: 'মাস',
    year: 'বছর',
    save: (amount: string) => `বছরে ${amount} সাশ্রয়`,
    users: 'ব্যবহারকারী',
    locations: 'গুদাম ও কাউন্টার',
    products: 'পণ্য',
    unlimited: 'সীমাহীন',
    core: 'অর্ডার, ডিসপ্যাচ, ইনভয়েস, ডিলার ক্রেডিট, স্টক',
    receiving: 'মাল গ্রহণ, সাপ্লায়ারের বিল ও পেমেন্ট',
    pos: 'কাউন্টার পিওএস',
    purchasing: 'পারচেজ অর্ডার',
    reports: 'রিপোর্ট',
    included: '(অন্তর্ভুক্ত)',
    notIncluded: '(অন্তর্ভুক্ত নয়)',
    startTrial: 'ফ্রি ট্রায়াল শুরু করুন',
    footnote: (days: string) =>
      `প্রতিটি নতুন ব্যবসা ${days} দিনের ফ্রি ট্রায়াল দিয়ে শুরু করে। পরিশোধের সময় প্ল্যান বেছে নিন — পরে বদলাতেও পারবেন।`,
    showDescriptions: false,
  },
  contact: {
    title: 'আমাদের সাথে কথা বলুন',
    text: 'ডেমো দেখতে চান, পুরনো ডেটা আনতে সাহায্য লাগবে, বা প্ল্যান নিয়ে প্রশ্ন আছে? কল বা মেসেজ করুন।',
    whatsapp: 'হোয়াটসঅ্যাপ',
    whatsappChat: 'হোয়াটসঅ্যাপে আমাদের সাথে কথা বলুন',
  },
  cta: {
    title: 'নিজের পণ্য দিয়েই চেষ্টা করে দেখুন',
    text: 'ট্রায়ালে সব ফিচার খোলা। আপনার ডেটা আপনারই — যেকোনো সময় পুরোটা ডাউনলোড করতে পারবেন।',
  },
  footer: {
    tagline: 'বাংলাদেশের অপটিক্যাল ব্যবসার জন্য হোলসেল ইআরপি ও কাউন্টার পিওএস।',
    contact: 'যোগাযোগ',
    legal: 'আইনি তথ্য',
    terms: 'সেবার শর্তাবলি',
    privacy: 'গোপনীয়তা নীতি',
    refund: 'রিফান্ড নীতি',
    language: 'ভাষা',
  },
  legal: { englishOnly: 'এই পৃষ্ঠাটি বর্তমানে শুধু ইংরেজিতে আছে।' },
  preview: 'ড্যাশবোর্ডের একটি চিত্র: আজকের বিক্রয়, আদায় ও অর্ডার',
};

const STRINGS: Record<Lang, typeof en> = { en, bn };
