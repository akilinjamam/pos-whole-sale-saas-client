import { Mail, MessageCircle, Phone } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { usePublicSite } from '@/hooks/data/usePublicSite';
import { cn } from '@/lib/utils';

import { setLang, usePublicLang } from './i18n';
import { whatsappLink } from './links';

import type { Lang } from './i18n';
import type { ReactNode } from 'react';

/** `compact`: the name only from `sm` up — the header on a phone has no room for it. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 whitespace-nowrap font-semibold"
      aria-label="Optical Wholesale"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        OW
      </span>
      <span className={compact ? 'hidden sm:inline' : undefined}>Optical Wholesale</span>
    </Link>
  );
}

const LANGS: { value: Lang; label: string; name: string }[] = [
  { value: 'bn', label: 'বাংলা', name: 'বাংলা' },
  { value: 'en', label: 'EN', name: 'English' },
];

/** The header's বাংলা | EN switch. Compact, to fit a phone's header. Remembered in this browser. */
function LanguageSwitch() {
  const { lang, t } = usePublicLang();
  return (
    <div
      className="inline-flex shrink-0 rounded-md border bg-background p-0.5"
      role="group"
      aria-label={t.footer.language}
    >
      {LANGS.map(({ value, label, name }) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={lang === value}
          aria-label={name}
          title={name}
          onClick={() => setLang(value)}
          className={cn(
            'rounded px-2 py-1 text-xs font-medium transition-colors',
            lang === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** The frame of every signed-out page: header with language and sign-in, footer with contact and legal. */
export function PublicLayout({ children }: { children: ReactNode }) {
  const { data } = usePublicSite();
  const { lang, t } = usePublicLang();
  const op = data?.operator;
  const year = new Date().getFullYear();
  const hasContact = Boolean(op && (op.phone || op.whatsapp || op.email || op.address));
  // The landing page's contact section is phone and email (WhatsApp is the floating button).
  const hasContactSection = Boolean(op && (op.phone || op.email));

  // The page's language, for screen readers, search engines and the right Bangla line-breaking.
  // Back to English on the way out: the signed-in app is English.
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
          <Logo compact />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Main">
            <a href="/#features" className="hover:text-foreground">{t.nav.features}</a>
            <a href="/#pricing" className="hover:text-foreground">{t.nav.pricing}</a>
            {hasContactSection && (
              <a href="/#contact" className="hover:text-foreground">{t.nav.contact}</a>
            )}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitch />
            <Link to="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-2 sm:px-3')}>
              {t.nav.signIn}
            </Link>
            {data?.signupEnabled !== false && (
              <Link to="/signup" className={buttonVariants({ size: 'sm' })}>
                <span className="sm:hidden">{t.nav.startTrialShort}</span>
                <span className="hidden sm:inline">{t.nav.startTrial}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className={cn('mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm', hasContact ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
          <div className="space-y-2">
            <Logo />
            <p className="text-muted-foreground">{t.footer.tagline}</p>
          </div>
          {hasContact && (
            <div className="space-y-2">
              <p className="font-medium">{t.footer.contact}</p>
              <ul className="space-y-1.5 text-muted-foreground">
                {op?.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <a href={`tel:${op.phone}`} className="hover:text-foreground">{op.phone}</a>
                  </li>
                )}
                {op?.whatsapp && (
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <a href={whatsappLink(op.whatsapp)} className="hover:text-foreground" target="_blank" rel="noreferrer">
                      {t.contact.whatsapp}
                    </a>
                  </li>
                )}
                {op?.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <a href={`mailto:${op.email}`} className="hover:text-foreground">{op.email}</a>
                  </li>
                )}
                {op?.address && <li className="whitespace-pre-line">{op.address}</li>}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            <p className="font-medium">{t.footer.legal}</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground">{t.footer.terms}</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground">{t.footer.privacy}</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground">{t.footer.refund}</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t py-4 text-center text-xs text-muted-foreground">
          © {year} {op?.legalName ?? 'Optical Wholesale'}
        </p>
      </footer>
    </div>
  );
}
