import { createContext } from "react";

import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  User,
} from "../types";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  setAccessToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);