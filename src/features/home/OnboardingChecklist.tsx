import { ArrowRight, CheckCircle2, Circle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCan } from '@/hooks/data/useAuth';
import { useDismissOnboarding, useOnboarding } from '@/hooks/data/useOrg';
import { cn } from '@/lib/utils';

import type { OnboardingStep } from '@shared/enums';

/** What each step says, and where it is done. `to: null` — done from an email, not a screen. */
const STEPS: Record<OnboardingStep, { label: string; hint: string; to: string | null }> = {
  VERIFY_EMAIL: {
    label: 'Verify your email',
    hint: 'Use the link we emailed you. Needed before you can add staff.',
    to: null,
  },
  COMPANY_DETAILS: {
    label: 'Add your company details',
    hint: 'Phone and address — they print on every invoice and challan.',
    to: '/settings/company',
  },
  FIRST_PRODUCT: {
    label: 'Add your first product',
    hint: 'Frames, lenses, sunglasses — or import your list.',
    to: '/catalog/products',
  },
  FIRST_DEALER: {
    label: 'Add your first dealer',
    hint: 'The shops you sell to on credit, with their limits.',
    to: '/dealers/list',
  },
  INVITE_USER: {
    label: 'Invite your staff',
    hint: 'Sales reps, store keepers, accounts, cashiers — each with their own role.',
    to: '/settings/users',
  },
};

/**
 * The first-steps card at the top of a new business's dashboard (SaaS phase 3). Each step ticks
 * itself from the data; the card goes away when everything is done, or when the owner closes it.
 */
export function OnboardingChecklist() {
  const can = useCan();
  const { data } = useOnboarding(can('org:read'));
  const dismiss = useDismissOnboarding();

  if (!data || data.dismissed || data.completed === data.total) return null;

  const pct = Math.round((data.completed / data.total) * 100);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Get your business ready</CardTitle>
          <CardDescription>
            {data.completed} of {data.total} done
          </CardDescription>
        </div>
        {can('org:update') && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dismiss.mutate()}
            disabled={dismiss.isPending}
            aria-label="Hide this checklist"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Setup progress"
        >
          <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
        </div>

        <ol className="divide-y rounded-md border">
          {data.steps.map(({ key, done }) => {
            const step = STEPS[key];
            const Icon = done ? CheckCircle2 : Circle;
            const body = (
              <>
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    done ? 'text-primary' : 'text-muted-foreground',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm font-medium',
                      done && 'text-muted-foreground line-through',
                    )}
                  >
                    {step.label}
                  </span>
                  {!done && (
                    <span className="block text-xs text-muted-foreground">{step.hint}</span>
                  )}
                </span>
                {!done && step.to && (
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <span className="sr-only">{done ? '(done)' : '(to do)'}</span>
              </>
            );
            return (
              <li key={key}>
                {!done && step.to ? (
                  <Link
                    to={step.to}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
