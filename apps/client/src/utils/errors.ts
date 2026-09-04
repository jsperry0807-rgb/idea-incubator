import type { TFunction } from "i18next";

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
  };
}

export function authErrorMessage(err: unknown, t: TFunction): string {
  const axiosErr = err as {
    response?: { data?: ApiErrorEnvelope; status?: number };
  };
  const data = axiosErr.response?.data;
  const status = axiosErr.response?.status;
  const code = data?.error?.code;

  if (status === 401 || code === "UNAUTHORIZED") {
    return t("auth.invalidCredentials");
  }
  if (status === 409 || code === "CONFLICT") {
    return t("auth.emailTaken");
  }
  return t("auth.genericError");
}
