export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  IDEAS: "/ideas",
  NOT_FOUND: "/404",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
