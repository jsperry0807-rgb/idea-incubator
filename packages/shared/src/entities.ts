import type {
  AuthProvider,
  IdeaPriority,
  IdeaStatus,
  NotificationType,
  ShareRole,
} from "./enums";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface IdeaTag {
  tagId: string;
  tag: Tag;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string | null;
}

export interface Idea {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  createdAt: string;
  updatedAt: string;
  tags: IdeaTag[];
}

export interface PipelineIdea {
  id: string;
  userId: string;
  title: string;
  slug: string;
  status: IdeaStatus;
  priority: IdeaPriority;
  tags: IdeaTag[];
  taskCount: number;
  completedTaskCount: number;
}

export type IdeaPipeline = Record<IdeaStatus, PipelineIdea[]>;

export interface Task {
  id: string;
  ideaId: string;
  title: string;
  completed: boolean;
  milestone: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  ideaId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name" | "avatarUrl">;
}

export interface Share {
  id: string;
  ideaId: string;
  userId: string;
  role: ShareRole;
  createdAt: string;
  user?: Pick<User, "id" | "name" | "avatarUrl" | "email">;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  ideaId: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  createdAt: string;
}
