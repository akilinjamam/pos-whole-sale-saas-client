import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Boxes,
  Check,
  ClipboardCheck,
  CreditCard,
  Mail,
  Minus,
  Phone,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { money } from '@/features/dealers/creditMath';
import { VideoDialog, VideoThumbnail } from '@/components/common/VideoPlayer';
import { usePublicSite } from '@/hooks/data/usePublicSite';
import { cn } from '@/lib/utils';

import { usePublicLang } from './i18n';
import { PublicLayout } from './PublicLayout';
import { Reveal } from './Reveal';
import { usePageMeta } from './usePageMeta';
import { WhatsAppButton } from './WhatsAppButton';

import type { BillingCycle, LimitedResource, PlanFeature } from '@shared/enums';
import type { PublicSitePayload } from '@shared/types';
import type { LucideIcon } from 'lucide-react';

/** The icons of the eight feature cards, in the order of `t.features.items`. */
const FEATURE_ICONS: LucideIcon[] = [
  ShoppingCart,
  Truck,
  Wallet,
  Boxes,
  Store,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
];

const RESOURCES: { key: LimitedResource; label: 'users' | 'locations' | 'products' }[] = [
  { key: 'users', label: 'users' },
  { key: 'locations', label: 'locations' },
  { key: 'products', label: 'products' },
];

const PLAN_FEATURES: { key: PlanFeature; label: 'pos' | 'purchasing' | 'reports' }[] = [
  { key: 'POS', label: 'pos' },
  { key: 'PURCHASING', label: 'purchasing' },
  { key: 'REPORTS', label: 'reports' },
];

/** `/` for a visitor who is not signed in (SaaS phase 8). Bangla by default; English on request. */
export function Landing() {
  const { t, num, lang } = usePublicLang();
  usePageMeta(t.meta.title, t.meta.description, { exact: true });
  const { data } = usePublicSite();
  const [watching, setWatching] = useState(false);
  const demo = data?.demoVideo ?? null;
  const demoTitle = demo ? (lang === 'bn' ? demo.titleBn : demo.titleEn) : '';
  const signup = data?.signupEnabled !== false;
  const reduce = useReducedMotion();
  /** The hero's lines arrive one after another on first load. */
  const enter = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: 'easeOut' as const, delay: 0.08 * i },
        };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <motion.h1
              {...enter(0)}
              className="text-4xl font-bold leading-tight tracking-tight md:text-5xl md:leading-tight"
            >
              {t.hero.title}
            </motion.h1>
            <motion.p {...enter(1)} className="text-lg text-muted-foreground">
              {t.hero.text}
            </motion.p>
            <motion.div {...enter(2)} className="flex flex-wrap gap-3">
              {signup && (
                <Link to="/signup" className={buttonVariants({ size: 'lg' })}>
                  {t.hero.cta}
                </Link>
              )}
              {demo ? (
                <button
                  type="button"
                  onClick={() => setWatching(true)}
                  className={buttonVariants({ variant: 'outline', size: 'lg' })}
                >
                  <PlayCircle aria-hidden="true" />
                  {t.hero.watchDemo}
                </button>
              ) : (
                <a href="#pricing" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                  {t.hero.seePricing}
                </a>
              )}
            </motion.div>
            {data && signup && (
              <motion.p {...enter(3)} className="text-sm text-muted-foreground">
                {t.hero.trialNote(num(data.trialDays))}
              </motion.p>
            )}
          </div>
          <ProductPreview label={t.preview} />
        </div>
      </section>

      {/* Demo video — only once one is published (Platform → Tutorials → Landing page demo). */}
      {demo && (
        <section id="demo" className="scroll-mt-16 border-b">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <Reveal className="mb-8 space-y-3 text-center">
              <h2 className="text-3xl font-semibold tracking-tight">{t.demo.title}</h2>
              <p className="text-muted-foreground">{t.demo.text}</p>
            </Reveal>
            <Reveal>
              <VideoThumbnail
                youtubeId={demo.youtubeId}
                title={demoTitle}
                onPlay={() => setWatching(true)}
                className="rounded-xl shadow-xl"
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <Reveal className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">{t.features.title}</h2>
            <p className="text-muted-foreground">{t.features.text}</p>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.items.map(({ title, text }, i) => {
              const Icon = FEATURE_ICONS[i]!;
              return (
                <Reveal
                  key={i}
                  delay={(i % 4) * 0.07}
                  className="h-full space-y-2 rounded-lg border p-5 transition-shadow hover:shadow-md"
                >
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it starts */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
          {t.steps.map(({ title, text }, i) => (
            <Reveal key={i} delay={i * 0.1} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {num(i + 1)}
              </span>
              <div className="space-y-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Pricing data={data} />

      <Contact data={data} />

      {data?.operator.whatsapp && <WhatsAppButton number={data.operator.whatsapp} />}

      {demo && watching && (
        <VideoDialog youtubeId={demo.youtubeId} title={demoTitle} onClose={() => setWatching(false)} />
      )}

      {signup && (
        <section className="bg-primary text-primary-foreground">
          <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">{t.cta.title}</h2>
            <p className="max-w-xl opacity-90">{t.cta.text}</p>
            <Link to="/signup" className={cn(buttonVariants({ size: 'lg', variant: 'secondary' }))}>
              {t.hero.cta}
            </Link>
          </Reveal>
        </section>
      )}
    </PublicLayout>
  );
}

function Pricing({ data }: { data: PublicSitePayload | undefined }) {
  const { t, num } = usePublicLang();
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const taka = (minor: number) => num(money(minor));

  return (
    <section id="pricing" className="scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Reveal className="mx-auto mb-8 max-w-2xl space-y-3 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{t.pricing.title}</h2>
          <p className="text-muted-foreground">{t.pricing.text}</p>
          <div className="inline-flex rounded-md border p-0.5" role="group" aria-label={t.pricing.billing}>
            {(['MONTHLY', 'YEARLY'] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cycle === c}
                onClick={() => setCycle(c)}
                className={buttonVariants({ size: 'sm', variant: cycle === c ? 'default' : 'ghost' })}
              >
                {c === 'MONTHLY' ? t.pricing.monthly : t.pricing.yearly}
              </button>
            ))}
          </div>
        </Reveal>

        {!data ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {data.plans.map((plan, i) => {
              const trial = plan.code === data.trialPlanCode;
              const price = cycle === 'YEARLY' ? plan.priceYearlyMinor : plan.priceMonthlyMinor;
              const saving = plan.priceMonthlyMinor * 12 - plan.priceYearlyMinor;
              return (
                <Reveal
                  key={plan.code}
                  delay={i * 0.08}
                  className={cn(
                    'flex h-full flex-col gap-4 rounded-lg border p-6 transition-transform hover:-translate-y-1',
                    trial && 'border-primary shadow-md',
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      {trial && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {t.pricing.freeTrialPlan}
                        </span>
                      )}
                    </div>
                    {plan.description && t.pricing.showDescriptions && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={cycle}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span className="text-3xl font-bold tabular-nums">{taka(price)}</span>
                      <span className="text-muted-foreground">
                        {' '}
                        / {cycle === 'YEARLY' ? t.pricing.year : t.pricing.month}
                      </span>
                      {cycle === 'YEARLY' && saving > 0 && (
                        <p className="text-xs text-primary">{t.pricing.save(taka(saving))}</p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <ul className="space-y-2 text-sm">
                    {RESOURCES.map(({ key, label }) => (
                      <li key={key} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t.pricing[label]}</span>
                        <span className="font-medium tabular-nums">
                          {plan.limits[key] === null ? t.pricing.unlimited : num(plan.limits[key]!)}
                        </span>
                      </li>
                    ))}
                    {[t.pricing.core, t.pricing.receiving].map((line) => (
                      <li key={line} className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {line}
                      </li>
                    ))}
                    {PLAN_FEATURES.map(({ key, label }) => {
                      const included = plan.features.includes(key);
                      const Icon = included ? Check : Minus;
                      return (
                        <li
                          key={key}
                          className={cn('flex items-center gap-2', !included && 'text-muted-foreground')}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', included && 'text-primary')} aria-hidden="true" />
                          {t.pricing[label]}
                          <span className="sr-only">
                            {included ? t.pricing.included : t.pricing.notIncluded}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {data.signupEnabled && (
                    <Link
                      to="/signup"
                      className={cn(buttonVariants({ variant: trial ? 'default' : 'outline' }), 'mt-auto')}
                    >
                      {t.pricing.startTrial}
                    </Link>
                  )}
                </Reveal>
              );
            })}
          </div>
        )}
        {data && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.pricing.footnote(num(data.trialDays))}
          </p>
        )}
      </div>
    </section>
  );
}

function Contact({ data }: { data: PublicSitePayload | undefined }) {
  const { t } = usePublicLang();
  const op = data?.operator;
  // WhatsApp is the floating button now; this section is for phone and email.
  const any = op && (op.phone || op.email);
  if (!any) return null;

  return (
    <section id="contact" className="scroll-mt-16 border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <Reveal className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">{t.contact.title}</h2>
          <p className="text-muted-foreground">{t.contact.text}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {op.phone && (
              <a href={`tel:${op.phone}`} className={buttonVariants({ variant: 'outline' })}>
                <Phone aria-hidden="true" />
                {op.phone}
              </a>
            )}
            {op.email && (
              <a href={`mailto:${op.email}`} className={buttonVariants({ variant: 'outline' })}>
                <Mail aria-hidden="true" />
                {op.email}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * A drawn picture of the product — built from the same tokens as the app, so it never goes out of
 * date the way a screenshot does. Illustrative figures only, and in English like the app itself.
 */
function ProductPreview({ label }: { label: string }) {
  const reduce = useReducedMotion();
  const rows = [
    ['SO-2627-00142', 'Rahman Optics', 'Confirmed', '৳48,500'],
    ['SO-2627-00141', 'Vision Point', 'Dispatched', '৳1,12,000'],
    ['SO-2627-00140', 'City Eye Care', 'Awaiting approval', '৳76,250'],
    ['SO-2627-00139', 'Lens House', 'Invoiced', '৳22,900'],
  ];
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 40, scale: 0.97 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1, y: [0, -6, 0] }}
      transition={{
        opacity: { duration: 0.6, delay: 0.2 },
        x: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
        scale: { duration: 0.6, ease: 'easeOut', delay: 0.2 },
        // After it lands, a slow drift — enough to feel alive, not enough to distract.
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 },
      }}
      className="overflow-hidden rounded-xl border bg-card shadow-xl"
      role="img"
      aria-label={label}
    >
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
      </div>
      <div className="flex" lang="en">
        <div className="hidden w-14 flex-col items-center gap-3 bg-sidebar py-4 text-sidebar-foreground sm:flex">
          {[ShoppingCart, Truck, Wallet, Boxes, Users, CreditCard].map((Icon, i) => (
            <Icon key={i} className={cn('h-4 w-4', i === 0 ? 'opacity-100' : 'opacity-50')} aria-hidden="true" />
          ))}
        </div>
        <div className="flex-1 space-y-4 p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Sales today', '৳2,59,650'],
              ['Collected', '৳1,84,000'],
              ['To dispatch', '7 orders'],
            ].map(([name, value]) => (
              <div key={name} className="rounded-md border p-2.5">
                <p className="text-[10px] text-muted-foreground">{name}</p>
                <p className="text-sm font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-md border">
            {rows.map(([no, dealer, status, total], i) => (
              <motion.div
                key={no}
                initial={reduce ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.6 + i * 0.1 }}
                className="flex items-center justify-between gap-2 border-b px-3 py-2 text-[11px] last:border-0"
              >
                <span className="font-mono text-muted-foreground">{no}</span>
                <span className="flex-1 truncate">{dealer}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5',
                    status === 'Awaiting approval'
                      ? 'bg-warning/15 text-warning-foreground'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {status}
                </span>
                <span className="w-16 text-right tabular-nums">{total}</span>
              </motion.div>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span>City Eye Care — credit used</span>
              <span className="tabular-nums text-muted-foreground">৳4,62,000 of ৳5,00,000</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-warning"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: '92%' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 1.1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
