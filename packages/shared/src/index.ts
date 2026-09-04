export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
}

export function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function formatUptime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}m ${remaining}s`;
}
