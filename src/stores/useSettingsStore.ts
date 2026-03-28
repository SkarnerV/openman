import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  // Editor settings
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  autoFormatJson: boolean;

  // General settings
  language: string;
  autoSave: boolean;
  sendAnalytics: boolean;

  // Sidebar state
  sidebarVisible: boolean;

  // Actions
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setWordWrap: (enabled: boolean) => void;
  setAutoFormatJson: (enabled: boolean) => void;
  setLanguage: (lang: string) => void;
  setAutoSave: (enabled: boolean) => void;
  setSendAnalytics: (enabled: boolean) => void;
  toggleSidebar: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      autoFormatJson: true,
      language: "en",
      autoSave: true,
      sendAnalytics: false,
      sidebarVisible: true,

      // Actions
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setAutoFormatJson: (autoFormatJson) => set({ autoFormatJson }),
      setLanguage: (language) => set({ language }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setSendAnalytics: (sendAnalytics) => set({ sendAnalytics }),
      toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
    }),
    {
      name: "settings-storage",
    }
  )
);