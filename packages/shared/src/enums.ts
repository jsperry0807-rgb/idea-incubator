export const AuthProvider = {
  LOCAL: "LOCAL",
  GOOGLE: "GOOGLE",
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const IdeaStatus = {
  IDEA: "IDEA",
  PLANNING: "PLANNING",
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
} as const;
export type IdeaStatus = (typeof IdeaStatus)[keyof typeof IdeaStatus];

export const IdeaPriority = {
  NONE: "NONE",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type IdeaPriority = (typeof IdeaPriority)[keyof typeof IdeaPriority];

export const ShareRole = {
  OWNER: "OWNER",
  EDIT: "EDIT",
  VIEW: "VIEW",
} as const;
export type ShareRole = (typeof ShareRole)[keyof typeof ShareRole];

export const NotificationType = {
  SHARE: "SHARE",
  COMMENT: "COMMENT",
  MENTION: "MENTION",
  TASK_COMPLETED: "TASK_COMPLETED",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const IDEA_STATUS_VALUES = Object.values(IdeaStatus);
export const IDEA_PRIORITY_VALUES = Object.values(IdeaPriority);
export const SHARE_ROLE_VALUES = Object.values(ShareRole);
export const NOTIFICATION_TYPE_VALUES = Object.values(NotificationType);
export const AUTH_PROVIDER_VALUES = Object.values(AuthProvider);
