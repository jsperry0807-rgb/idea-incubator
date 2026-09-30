import { client } from "@/axios";
import type {
  AuthResponse,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  LoginInput,
  RefreshResponse,
  RegisterInput,
  ResetPasswordInput,
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

export async function forgotPasswordRequest(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResponse> {
  const { data } = await client.post<{ data: ForgotPasswordResponse }>(
    "/auth/forgot-password",
    input,
  );
  return data.data;
}

export async function resetPasswordRequest(
  input: ResetPasswordInput,
): Promise<{ ok: boolean }> {
  const { data } = await client.post<{ data: { ok: boolean } }>(
    "/auth/reset-password",
    input,
  );
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
