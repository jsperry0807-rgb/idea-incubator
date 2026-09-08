import type { LocaleMessages } from "./en";

export const es: LocaleMessages = {
  app: {
    name: "Aplicación",
    nav: {
      home: "Inicio",
    },
  },
  home: {
    welcome: "Bienvenido",
    subtitle: "Empieza editando tu aplicación.",
    docs: "Documentación",
  },
  auth: {
    login: {
      title: "Iniciar sesión",
      subtitle: "¡Bienvenido de nuevo! Introduce tus datos para continuar.",
      email: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      password: "Contraseña",
      passwordPlaceholder: "Tu contraseña",
      submit: "Iniciar sesión",
      noAccount: "¿No tienes una cuenta?",
      registerLink: "Crea una",
    },
    register: {
      title: "Crear cuenta",
      subtitle: "Empieza a seguir tus ideas hoy.",
      name: "Nombre",
      namePlaceholder: "Juan Pérez",
      email: "Correo electrónico",
      emailPlaceholder: "tu@ejemplo.com",
      password: "Contraseña",
      passwordPlaceholder: "Al menos 8 caracteres",
      passwordLength: "La contraseña debe tener al menos 8 caracteres",
      passwordLowercase: "La contraseña debe contener una letra minúscula",
      passwordUppercase: "La contraseña debe contener una letra mayúscula",
      passwordNumber: "La contraseña debe contener un número",
      submit: "Crear cuenta",
      hasAccount: "¿Ya tienes una cuenta?",
      loginLink: "Inicia sesión",
    },
    invalidCredentials: "Correo o contraseña no válidos",
    emailTaken: "Ya existe una cuenta con este correo electrónico",
    genericError: "Algo salió mal. Inténtalo de nuevo.",
  },
  dashboard: {
    title: "Panel de control",
  },
};