import type { LocaleMessages } from "./en";

export const fr: LocaleMessages = {
  app: {
    name: "Application",
    nav: {
      home: "Accueil",
    },
  },
  home: {
    welcome: "Bienvenue",
    subtitle: "Commencez en modifiant votre application.",
    docs: "Documentation",
  },
  auth: {
    login: {
      title: "Connexion",
      subtitle: "Bon retour ! Saisissez vos informations pour continuer.",
      email: "E-mail",
      emailPlaceholder: "vous@exemple.com",
      password: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      submit: "Se connecter",
      noAccount: "Pas encore de compte ?",
      registerLink: "Créer un compte",
    },
    register: {
      title: "Créer un compte",
      subtitle: "Commencez à suivre vos idées dès aujourd'hui.",
      name: "Nom",
      namePlaceholder: "Jane Doe",
      email: "E-mail",
      emailPlaceholder: "vous@exemple.com",
      password: "Mot de passe",
      passwordPlaceholder: "Au moins 8 caractères",
      passwordLength: "Le mot de passe doit contenir au moins 8 caractères",
      passwordLowercase: "Le mot de passe doit contenir une lettre minuscule",
      passwordUppercase: "Le mot de passe doit contenir une lettre majuscule",
      passwordNumber: "Le mot de passe doit contenir un chiffre",
      submit: "Créer un compte",
      hasAccount: "Vous avez déjà un compte ?",
      loginLink: "Se connecter",
    },
    invalidCredentials: "E-mail ou mot de passe invalide",
    emailTaken: "Un compte existe déjà avec cet e-mail",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
  },
  dashboard: {
    title: "Tableau de bord",
  },
};