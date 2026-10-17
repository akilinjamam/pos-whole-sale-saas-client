import { motion, useReducedMotion } from 'framer-motion';
import { siWhatsapp } from 'simple-icons';

import { usePublicLang } from './i18n';
import { whatsappLink } from './links';

/**
 * The round WhatsApp button fixed to the bottom-right corner of the landing page (SaaS phase 8) —
 * how most customers here will actually start a conversation. Only drawn when SITE_WHATSAPP is set.
 * The logo is the official mark from simple-icons (CC0), on WhatsApp's own green.
 */
export function WhatsAppButton({ number }: { number: string }) {
  const { t } = usePublicLang();
  const reduce = useReducedMotion();

  return (
    <motion.a
      href={whatsappLink(number)}
      target="_blank"
      rel="noreferrer"
      aria-label={t.contact.whatsappChat}
      title={t.contact.whatsappChat}
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 1 }}
      whileHover={reduce ? undefined : { scale: 1.08 }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      // Above the page, clear of the phone's home bar (safe-area inset).
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d={siWhatsapp.path} />
      </svg>
    </motion.a>
  );
}
