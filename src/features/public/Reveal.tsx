import { motion, useReducedMotion } from 'framer-motion';

import type { ReactNode } from 'react';

/**
 * Fades and lifts its content in the first time it scrolls into view (landing page, SaaS phase 8).
 * Visitors who ask their device for reduced motion get the content at once, still.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Seconds — for staggering the cards of a grid. */
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}
