import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import { usePublicSite } from '@/hooks/data/usePublicSite';

import { usePublicLang } from './i18n';

import { PublicLayout } from './PublicLayout';
import { usePageMeta } from './usePageMeta';

import type { PublicSitePayload } from '@shared/types';
import type { ReactNode } from 'react';

/**
 * Terms of service, privacy policy and refund policy (SaaS phase 8) — SSLCommerz asks for all three
 * before it approves a merchant.
 *
 * DRAFTS. They describe what this software actually does (the day counts come from the server, so
 * they cannot drift from the code), but they are not legal advice: have them read by someone
 * qualified before launch, and change `UPDATED` whenever the text changes.
 */
const UPDATED = '17 October 2026';

type Op = PublicSitePayload['operator'];

/** "<legal name>" once set; until then, a plain description and the draft banner. */
const who = (op: Op) => op.legalName ?? 'the operator of Optical Wholesale';

function contactLine(op: Op): string {
  const ways = [
    op.email && `email ${op.email}`,
    op.phone && `call ${op.phone}`,
    op.whatsapp && `WhatsApp +${op.whatsapp}`,
  ].filter(Boolean);
  return ways.length ? ways.join(', or ') : 'use the contact details on our website';
}

function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (site: PublicSitePayload) => ReactNode;
}) {
  usePageMeta(title, description);
  const { data } = usePublicSite();
  const { t } = usePublicLang();

  return (
    <PublicLayout>
      {/* The text is English whatever the site language — say so, in Bangla, to a Bangla reader. */}
      <article className="mx-auto max-w-3xl px-4 py-12" lang="en">
        {t.legal.englishOnly && (
          <p lang="bn" className="mb-6 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {t.legal.englishOnly}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>
        {data && !data.operator.legalName && (
          <div className="mt-6 flex gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Draft: the operator's legal name and contact details are not set yet
              (SITE_LEGAL_NAME, SITE_ADDRESS, SITE_EMAIL, SITE_PHONE on the server).
            </p>
          </div>
        )}
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
          {data ? (
            children(data)
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          )}
        </div>
      </article>
    </PublicLayout>
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Terms of service"
      description="The terms for using Optical Wholesale: accounts, the free trial, subscriptions and payment, your data, and closing your account."
    >
      {({ operator: op, trialDays, graceDays, purgeAfterDays }) => (
        <>
          <p>
            These terms are an agreement between your business and {who(op)} ("we", "us") for the
            use of Optical Wholesale (the "service"), an online system for wholesale orders,
            dispatch, invoicing, dealer credit, stock and point of sale. By creating an account or
            using the service, you accept these terms on behalf of your business.
          </p>

          <h2>1. Your account</h2>
          <ul>
            <li>
              The person who signs up is the owner of the business's account and is responsible for
              it, including for the people they invite and the access they give them.
            </li>
            <li>
              Keep passwords private. Tell us at once if you think someone has used your account
              without permission.
            </li>
            <li>The information you give us when you sign up must be true and kept up to date.</li>
          </ul>

          <h2>2. Free trial</h2>
          <p>
            A new business gets a free trial of {trialDays} days with the features of the plan shown
            on our pricing page. No payment details are needed. At the end of the trial, you choose
            a plan and pay to keep using the service.
          </p>

          <h2>3. Plans, prices and payment</h2>
          <ul>
            <li>
              Prices are shown on our website in Bangladeshi taka. Subscriptions are paid in
              advance, monthly or yearly, by bKash, Nagad, bank transfer or another method we
              accept. Your subscription is extended when we record your payment, and we email you a
              receipt.
            </li>
            <li>
              Each plan has limits — users, warehouses and counters, products — and some features
              are included only in some plans. You can ask to change plan at any time from your
              subscription page.
            </li>
            <li>
              We may change our prices. A change applies from your next payment, and we will tell
              you at least 30 days before.
            </li>
          </ul>

          <h2>4. If payment is late</h2>
          <p>
            When a trial or a paid period ends without payment, the account stays fully usable for{' '}
            {graceDays} more days. After that it becomes read-only: you can still sign in, see,
            print and download everything, but not add or change anything until payment is
            recorded. Nothing is deleted because a payment is late.
          </p>

          <h2>5. Your data</h2>
          <ul>
            <li>
              The records you enter — products, dealers, orders, invoices, payments, stock — belong
              to your business. We use them only to provide the service to you, as described in our{' '}
              <Link to="/privacy" className="underline">privacy policy</Link>.
            </li>
            <li>
              You can download all of your data at any time, in a standard format, from your
              subscription page — also while your account is read-only, suspended or closed, until
              it is deleted.
            </li>
            <li>
              You are responsible for the lawfulness of the data you enter, including your dealers'
              and customers' personal details.
            </li>
          </ul>

          <h2>6. Acceptable use</h2>
          <p>
            Do not use the service to break the law, to store data you have no right to, to try to
            reach other businesses' data, to overload or attack the service, or to resell it without
            our written agreement. We may suspend an account that does, and will tell you why.
          </p>

          <h2>7. Closing your account</h2>
          <ul>
            <li>
              The owner can close the business's account at any time from the subscription page.
              Everyone in the business loses access at once.
            </li>
            <li>
              After closing, we keep your data for {purgeAfterDays} days, during which the owner can
              still download it or ask us to reopen the account. After that it is permanently
              deleted, except copies in our backups, which are overwritten on their normal schedule,
              and the records of payments to us, which we keep for our own accounts.
            </li>
            <li>
              We may close an account after notice if these terms are seriously or repeatedly
              broken, or if it stays unpaid for a long period.
            </li>
          </ul>

          <h2>8. The service</h2>
          <p>
            We work to keep the service available, secure and backed up, and we improve it over
            time. We may need short interruptions for maintenance, and we cannot promise it will
            never be unavailable or free of errors. Check important figures — especially before you
            rely on them for tax or legal purposes.
          </p>

          <h2>9. Liability</h2>
          <p>
            As far as the law allows, we are not liable for indirect losses such as lost profit or
            lost business, and our total liability for any claim is limited to the amount you paid
            us for the service in the three months before the claim arose. Nothing in these terms
            limits liability that cannot be limited by law.
          </p>

          <h2>10. Changes to these terms</h2>
          <p>
            We may update these terms. If a change is significant, we will tell the account owner by
            email at least 30 days before it takes effect. Continuing to use the service after that
            means you accept the new terms.
          </p>

          <h2>11. Law</h2>
          <p>
            These terms are governed by the laws of Bangladesh, and the courts of Dhaka have
            jurisdiction over any dispute about them.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about these terms: {contactLine(op)}.
            {op.address && (
              <>
                {' '}
                Postal address: <span className="whitespace-pre-line">{op.address}</span>.
              </>
            )}
          </p>
        </>
      )}
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      description="What personal data Optical Wholesale collects, why, who it is shared with, how long it is kept, and your rights."
    >
      {({ operator: op, purgeAfterDays }) => (
        <>
          <p>
            This policy explains how {who(op)} ("we", "us") handles personal data in Optical
            Wholesale (the "service").
          </p>

          <h2>1. Two kinds of data</h2>
          <ul>
            <li>
              <strong>Your account data</strong> — the names, email addresses, phone numbers and
              passwords of the people in your business who use the service. We are responsible for
              this data.
            </li>
            <li>
              <strong>Your business records</strong> — everything your business enters: products,
              dealers and customers (which can include their names, phone numbers and addresses),
              orders, invoices, payments and stock. Your business decides what goes in and is
              responsible for it; we store and process it only to provide the service to you.
            </li>
          </ul>

          <h2>2. What we collect, and why</h2>
          <ul>
            <li>Sign-up and account details — to create your account and let you sign in.</li>
            <li>
              Your email address — to verify it and send account and billing emails: password
              resets, trial and payment reminders, receipts. We do not send marketing emails
              without your agreement.
            </li>
            <li>
              Payment records — the amount, method and transaction id of payments you make to us,
              to extend your subscription and keep our accounts.
            </li>
            <li>
              Technical records — the IP address, browser and time of each request, and an audit
              trail of important changes inside your business — to keep the service secure, find
              faults and show your business who changed what.
            </li>
          </ul>

          <h2>3. Cookies and storage in your browser</h2>
          <p>
            We use one cookie, which keeps you signed in. Your browser also stores a few settings —
            such as whether the side menu is open, and the items in an unfinished counter sale. We
            do not use advertising or tracking cookies, and we do not use analytics services. The
            website loads its font from Google Fonts, which means your browser contacts Google's
            servers. Training and demo videos are hosted on YouTube: a still picture is shown first,
            and the video player — YouTube's privacy-enhanced one — loads only when you press
            play. From then on, YouTube's own privacy policy applies to the video.
          </p>

          <h2>4. Who we share it with</h2>
          <p>
            We do not sell personal data. We share it only with providers who help us run the
            service — for hosting and the database, for sending email — under their own security
            obligations, and with authorities when the law requires it. Some of these providers
            store data outside Bangladesh.
          </p>

          <h2>5. How long we keep it</h2>
          <ul>
            <li>While your account is open, for as long as your business keeps the records.</li>
            <li>
              After your business closes its account: {purgeAfterDays} days, then deleted. Backups
              are kept for up to a year and overwritten on their schedule.
            </li>
            <li>Payment records: as long as the law requires us to keep accounts.</li>
            <li>Technical logs: for a limited time, for security and troubleshooting.</li>
          </ul>

          <h2>6. Security</h2>
          <p>
            Connections are encrypted (HTTPS). Passwords are stored only as one-way hashes. Each
            business can see only its own data, and each user only what their role allows. We take
            regular backups and test that they restore.
          </p>

          <h2>7. Your rights</h2>
          <p>
            You can see and correct your account details in the service, download all of your
            business's data at any time, and close your account. For anything else — a question, a
            correction we should make, or a complaint — {contactLine(op)}. If someone in your
            dealer or customer list asks about their data, your business should answer them, and we
            will help.
          </p>

          <h2>8. Children</h2>
          <p>The service is for businesses and is not meant for children.</p>

          <h2>9. Changes</h2>
          <p>
            We will update this page when our practices change, and email account owners about
            significant changes.
          </p>
        </>
      )}
    </LegalPage>
  );
}

export function RefundPolicy() {
  return (
    <LegalPage
      title="Refund policy"
      description="When Optical Wholesale refunds a subscription payment, how to ask, and how long it takes."
    >
      {({ operator: op, trialDays }) => (
        <>
          <p>
            This policy applies to subscription payments made to {who(op)} for Optical Wholesale.
          </p>

          <h2>1. The service you buy</h2>
          <p>
            Optical Wholesale is an online service — nothing is shipped. Access starts as soon as you
            sign up, and a paid period starts when we record your payment, usually the same working
            day. Every new business first gets a free trial of {trialDays} days, so you can try the
            service fully before paying anything.
          </p>

          <h2>2. When we refund</h2>
          <ul>
            <li>
              <strong>Paid twice, or paid the wrong amount:</strong> the duplicate or extra amount is
              refunded in full.
            </li>
            <li>
              <strong>Charged for a period you did not get:</strong> if the service was unavailable
              for a long time because of a fault on our side, we refund or credit that time.
            </li>
            <li>
              <strong>Yearly plans:</strong> if you ask within 7 days of your yearly payment being
              recorded, we refund it in full.
            </li>
          </ul>

          <h2>3. When we do not refund</h2>
          <ul>
            <li>
              A monthly period that has started, or a yearly period after the first 7 days. Closing
              your account stops future payments; it does not refund the current period.
            </li>
            <li>Time when your account was read-only or suspended because of late payment.</li>
          </ul>

          <h2>4. How to ask</h2>
          <p>
            Contact us — {contactLine(op)} — within 30 days of the payment, with your business name,
            the receipt number (it starts with SUB-) and the transaction id of your payment.
          </p>

          <h2>5. How long it takes</h2>
          <p>
            We reply within 3 working days. An approved refund is sent back by the method you paid
            with — bKash, Nagad or bank — within 7–10 working days. Any fee the payment provider
            charged us may be deducted.
          </p>
        </>
      )}
    </LegalPage>
  );
}
