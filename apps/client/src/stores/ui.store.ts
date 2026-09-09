import { create } from "zustand";

type Theme = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "app.theme";

function getInitialTheme(): Theme {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export type IdeasViewMode = "grid" | "list";

const VIEW_MODE_STORAGE_KEY = "app.ideasView";

function getInitialViewMode(): IdeasViewMode {
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(VIEW_MODE_STORAGE_KEY) : null;
  return stored === "list" ? "list" : "grid";
}

interface ModalState {
  isOpen: boolean;
  contentId: string | null;
}

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
  modal: ModalState;
  ideasViewMode: IdeasViewMode;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  openModal: (contentId: string) => void;
  closeModal: () => void;

  setIdeasViewMode: (mode: IdeasViewMode) => void;
  toggleIdeasViewMode: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolvedDark =
    theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (resolvedDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  theme: getInitialTheme(),
  modal: { isOpen: false, contentId: null },
  ideasViewMode: getInitialViewMode(),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    if (typeof window !== "undefined") applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: Theme = current === "system" ? "dark" : current === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  openModal: (contentId) => set({ modal: { isOpen: true, contentId } }),
  closeModal: () => set({ modal: { isOpen: false, contentId: null } }),

  setIdeasViewMode: (mode) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      } catch {
        // ignore storage errors
      }
    }
    set({ ideasViewMode: mode });
  },

  toggleIdeasViewMode: () => {
    const next: IdeasViewMode = get().ideasViewMode === "grid" ? "list" : "grid";
    get().setIdeasViewMode(next);
  },
}));

if (typeof window !== "undefined") {
  applyTheme(useUIStore.getState().theme);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (useUIStore.getState().theme === "system") {
        applyTheme("system");
      }
    });
}
