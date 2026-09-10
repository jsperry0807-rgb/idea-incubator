import type {
  LoginInput as SharedLoginInput,
  RegisterInput as SharedRegisterInput,
  UpdateProfileInput,
} from "@repo/shared";

export type { User } from "@repo/shared";
export type LoginInput = SharedLoginInput;
export type RegisterInput = SharedRegisterInput;
export type { UpdateProfileInput };

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
