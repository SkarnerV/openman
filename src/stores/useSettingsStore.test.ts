import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "./useSettingsStore";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("useSettingsStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useSettingsStore.setState({
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      autoFormatJson: true,
      language: "en",
      autoSave: true,
      sendAnalytics: false,
      sidebarVisible: true,
    });
  });

  describe("initial state", () => {
    it("has correct default values", () => {
      const state = useSettingsStore.getState();
      expect(state.fontSize).toBe(14);
      expect(state.tabSize).toBe(2);
      expect(state.wordWrap).toBe(true);
      expect(state.autoFormatJson).toBe(true);
      expect(state.language).toBe("en");
      expect(state.autoSave).toBe(true);
      expect(state.sendAnalytics).toBe(false);
      expect(state.sidebarVisible).toBe(true);
    });
  });

  describe("setFontSize", () => {
    it("sets the font size", () => {
      useSettingsStore.getState().setFontSize(18);
      expect(useSettingsStore.getState().fontSize).toBe(18);
    });

    it("updates font size multiple times", () => {
      useSettingsStore.getState().setFontSize(12);
      expect(useSettingsStore.getState().fontSize).toBe(12);

      useSettingsStore.getState().setFontSize(20);
      expect(useSettingsStore.getState().fontSize).toBe(20);
    });
  });

  describe("setTabSize", () => {
    it("sets the tab size", () => {
      useSettingsStore.getState().setTabSize(4);
      expect(useSettingsStore.getState().tabSize).toBe(4);
    });
  });

  describe("setWordWrap", () => {
    it("sets word wrap to false", () => {
      useSettingsStore.getState().setWordWrap(false);
      expect(useSettingsStore.getState().wordWrap).toBe(false);
    });

    it("sets word wrap to true", () => {
      useSettingsStore.getState().setWordWrap(false);
      useSettingsStore.getState().setWordWrap(true);
      expect(useSettingsStore.getState().wordWrap).toBe(true);
    });
  });

  describe("setAutoFormatJson", () => {
    it("sets auto format JSON", () => {
      useSettingsStore.getState().setAutoFormatJson(false);
      expect(useSettingsStore.getState().autoFormatJson).toBe(false);
    });
  });

  describe("setLanguage", () => {
    it("sets the language", () => {
      useSettingsStore.getState().setLanguage("es");
      expect(useSettingsStore.getState().language).toBe("es");
    });
  });

  describe("setAutoSave", () => {
    it("sets auto save", () => {
      useSettingsStore.getState().setAutoSave(false);
      expect(useSettingsStore.getState().autoSave).toBe(false);
    });
  });

  describe("setSendAnalytics", () => {
    it("sets send analytics", () => {
      useSettingsStore.getState().setSendAnalytics(true);
      expect(useSettingsStore.getState().sendAnalytics).toBe(true);
    });
  });

  describe("toggleSidebar", () => {
    it("toggles sidebar visibility", () => {
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);

      useSettingsStore.getState().toggleSidebar();
      expect(useSettingsStore.getState().sidebarVisible).toBe(false);

      useSettingsStore.getState().toggleSidebar();
      expect(useSettingsStore.getState().sidebarVisible).toBe(true);
    });
  });
});