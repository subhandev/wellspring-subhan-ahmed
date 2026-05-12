import { z } from "../../lib/zodOpenapi.js";

export const signupBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128)
});

export const loginBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128)
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email().max(320)
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1).max(512),
  newPassword: z.string().min(8).max(128)
});

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
