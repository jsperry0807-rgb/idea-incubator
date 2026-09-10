export {
  AuthProvider,
  IdeaStatus,
  IdeaPriority,
  ShareRole,
  NotificationType,
  ActivityType,
  IDEA_STATUS_VALUES,
  IDEA_PRIORITY_VALUES,
  SHARE_ROLE_VALUES,
  NOTIFICATION_TYPE_VALUES,
  ACTIVITY_TYPE_VALUES,
  AUTH_PROVIDER_VALUES,
} from "./enums";
export type {
  AuthProvider as AuthProviderType,
  IdeaStatus as IdeaStatusType,
  IdeaPriority as IdeaPriorityType,
  ShareRole as ShareRoleType,
  NotificationType as NotificationTypeType,
  ActivityType as ActivityTypeType,
} from "./enums";

export type {
  ActivityItem,
  AuthUser,
  Comment,
  DashboardStats,
  Idea,
  IdeaPipeline,
  IdeaTag,
  Notification,
  PipelineIdea,
  Share,
  SharedIdea,
  Tag,
  Task,
  User,
} from "./entities";

export type {
  ApiEnvelope,
  ApiErrorBody,
  Paginated,
  PaginationMeta,
  ApiResponse,
} from "./api";

export * from "./schemas";

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
