import { client } from "@/axios";
import type {
  AuthResponse,
  LoginInput,
  RefreshResponse,
  RegisterInput,
  UpdateProfileInput,
  User,
} from "../types";

export async function loginRequest(input: LoginInput): Promise<AuthResponse> {
  const { data } = await client.post<{ data: AuthResponse }>("/auth/login", input);
  return data.data;
}

export async function registerRequest(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await client.post<{ data: AuthResponse }>("/auth/register", input);
  return data.data;
}

export async function refreshRequest(): Promise<RefreshResponse> {
  const { data } = await client.post<{ data: RefreshResponse }>("/auth/refresh");
  return data.data;
}

export async function meRequest(): Promise<User> {
  const { data } = await client.get<{ data: User }>("/auth/me");
  return data.data;
}

export async function logoutRequest(): Promise<void> {
  await client.post("/auth/logout");
}

export async function updateProfileRequest(input: UpdateProfileInput): Promise<User> {
  const { data } = await client.patch<{ data: User }>("/auth/me", input);
  return data.data;
}

export async function deleteAccountRequest(password: string): Promise<void> {
  await client.delete("/auth/me", { data: { password } });
}
