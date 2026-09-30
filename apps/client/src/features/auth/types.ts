import type {
  ForgotPasswordInput as SharedForgotPasswordInput,
  LoginInput as SharedLoginInput,
  RegisterInput as SharedRegisterInput,
  ResetPasswordInput as SharedResetPasswordInput,
  UpdateProfileInput,
} from "@repo/shared";

export type { User } from "@repo/shared";
export type LoginInput = SharedLoginInput;
export type RegisterInput = SharedRegisterInput;
export type ForgotPasswordInput = SharedForgotPasswordInput;
export type ResetPasswordInput = SharedResetPasswordInput;
export type { UpdateProfileInput };

export interface ForgotPasswordResponse {
  sent: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
