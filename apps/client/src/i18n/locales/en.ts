export const en = {
  app: {
    name: "App",
    nav: {
      home: "Home",
    },
  },
  home: {
    welcome: "Welcome",
    subtitle: "Get started by editing your application.",
    docs: "Documentation",
  },
  auth: {
    login: {
      title: "Log in",
      subtitle: "Welcome back! Enter your details to continue.",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "Your password",
      submit: "Log in",
      noAccount: "Don't have an account?",
      registerLink: "Create one",
    },
    register: {
      title: "Create account",
      subtitle: "Start tracking your ideas today.",
      name: "Name",
      namePlaceholder: "Jane Doe",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "At least 8 characters",
      passwordLength: "Password must be at least 8 characters",
      passwordLowercase: "Password must contain a lowercase letter",
      passwordUppercase: "Password must contain an uppercase letter",
      passwordNumber: "Password must contain a number",
      submit: "Create account",
      hasAccount: "Already have an account?",
      loginLink: "Log in",
    },
    invalidCredentials: "Invalid email or password",
    emailTaken: "An account with this email already exists",
    genericError: "Something went wrong. Please try again.",
  },
  dashboard: {
    title: "Dashboard",
  },
} as const;

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export type LocaleMessages = DeepString<typeof en>;