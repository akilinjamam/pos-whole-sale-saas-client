import { motion, useReducedMotion } from 'framer-motion';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { ReactNode } from 'react';

/**
 * The centred card every signed-out screen sits in — sign in, sign up, verify, forgot and reset.
 * One component so the five stay identical as the product's look changes.
 */
export function AuthLayout({
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links under the card: "Forgot your password?", "Back to sign in", … */
  footer?: ReactNode;
  /** The signup form has more fields and reads better a little wider. */
  wide?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={wide ? 'w-full max-w-md' : 'w-full max-w-sm'}
      >
        <Card>
          <CardHeader className="space-y-1">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              OW
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>

        {footer && (
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}
