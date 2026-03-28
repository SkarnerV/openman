import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  applyTheme: () => void;
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark",

      setTheme: (theme: Theme) => {
        set({ theme });
        get().applyTheme();
      },

      applyTheme: () => {
        const { theme } = get();
        const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

        if (effectiveTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        // Apply theme on app load
        if (state) {
          state.applyTheme();
        }
      },
    }
  )
);

// Listen for system theme changes
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const state = useThemeStore.getState();
    if (state.theme === "system") {
      state.applyTheme();
    }
  });
}