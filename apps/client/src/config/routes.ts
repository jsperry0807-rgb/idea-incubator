export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  IDEAS: '/ideas',
  NEW_IDEA: '/ideas/new',
  ROADMAP: '/roadmap',
  TAGS: '/tags',
  SHARED: '/shared',
  SETTINGS: '/settings',
  IDEA_DETAIL: '/ideas/:id',
  IDEA_TASKS: '/ideas/:id/tasks',
  NOT_FOUND: '/404',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export function ideaDetailPath(id: string): string {
  return `${ROUTES.IDEAS}/${id}`;
}

export function ideaTasksPath(id: string): string {
  return `${ideaDetailPath(id)}/tasks`;
}
