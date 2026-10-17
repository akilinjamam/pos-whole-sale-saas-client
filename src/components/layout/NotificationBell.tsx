import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Clock,
  CreditCard,
  Info,
  PackageSearch,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown';
import { useNotifications } from '@/hooks/data/useAdmin';
import { cn } from '@/lib/utils';

import type { NotificationKind, NotificationPayload } from '@shared/types';
import type { LucideIcon } from 'lucide-react';

const ICON: Record<NotificationKind, LucideIcon> = {
  EXPIRED: AlertTriangle,
  EXPIRING: CalendarClock,
  OVERDUE: Wallet,
  LOW_STOCK: PackageSearch,
  APPROVAL: Clock,
  SUBSCRIPTION: CreditCard,
};

const TONE: Record<NotificationPayload['severity'], string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary',
};

/**
 * The bell (Day 39): low stock, expiring lots, overdue dealers and orders awaiting approval —
 * only what this user may act on. Each line opens the screen where it is dealt with. The badge is
 * the number of *things* (lots, dealers, products), so it falls as they are dealt with.
 */
export function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useNotifications();
  const total = data?.total ?? 0;
  const critical = data?.items.some((i) => i.severity === 'critical');

  return (
    <Dropdown
      className="w-80"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={total ? `${total} notification(s)` : 'Notifications'}
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
          {total > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 min-w-[1.1rem] rounded-full px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white',
                critical ? 'bg-destructive' : 'bg-warning',
              )}
            >
              {total > 99 ? '99+' : total}
            </span>
          )}
        </button>
      )}
    >
      <DropdownLabel>Needs attention</DropdownLabel>
      {!data || data.items.length === 0 ? (
        <p className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden="true" />
          Nothing right now.
        </p>
      ) : (
        data.items.map((n) => {
          const Icon = ICON[n.kind];
          return (
            <DropdownItem
              key={n.kind}
              onClick={() => navigate(n.to)}
              className="items-start gap-2 py-2"
            >
              <Icon
                className={cn('mt-0.5 h-4 w-4 shrink-0', TONE[n.severity])}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{n.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
              </span>
            </DropdownItem>
          );
        })
      )}
    </Dropdown>
  );
}
