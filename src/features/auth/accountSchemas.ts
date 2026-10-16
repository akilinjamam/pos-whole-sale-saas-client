import { z } from 'zod';

/**
 * Client-side mirrors of the server's `account.schema.ts`. Unlike login, these *choose* a password,
 * so the 8-character minimum is checked here too — a round trip to learn it would be a poor first
 * impression on the signup page. The server remains the authority and its 422s land on the same
 * fields.
 */

const newPassword = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'At most 128 characters');

export const signupSchema = z.object({
  businessName: z.string().trim().min(2, 'At least 2 characters').max(120),
  ownerName: z.string().trim().min(1, 'Enter your name').max(120),
  email: z.string().trim().min(1, 'Enter your email').email('That does not look like an email'),
  phone: z.string().trim().max(40),
  password: newPassword,
});
export type SignupFormValues = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('That does not look like an email'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'The passwords differ',
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
