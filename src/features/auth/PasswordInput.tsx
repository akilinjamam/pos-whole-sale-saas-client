import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { Input } from '@/components/ui/input';

import type { ComponentPropsWithoutRef } from 'react';

/** A password input with a show/hide toggle — for choosing a new password (signup, reset). */
export const PasswordInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<typeof Input>
>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} ref={ref} type={visible ? 'text' : 'password'} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
