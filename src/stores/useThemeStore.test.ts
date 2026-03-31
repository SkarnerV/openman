import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeStore } from "./useThemeStore";

// Mock DOM
const classListMock = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

Object.defineProperty(document, "documentElement", {
  value: {
    classList: classListMock,
  },
});

// Mock matchMedia
const matchMediaMock = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

Object.defineProperty(window, "matchMedia", {
  value: matchMediaMock,
});

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

describe("useThemeStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    classListMock.add.mockClear();
    classListMock.remove.mockClear();
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    useThemeStore.setState({ theme: "dark" });
  });

  describe("initial state", () => {
    it("has dark theme as default", () => {
      expect(useThemeStore.getState().theme).toBe("dark");
    });
  });

  describe("setTheme", () => {
    it("sets the theme to light", () => {
      useThemeStore.getState().setTheme("light");
      expect(useThemeStore.getState().theme).toBe("light");
    });

    it("sets the theme to dark", () => {
      useThemeStore.getState().setTheme("dark");
      expect(useThemeStore.getState().theme).toBe("dark");
    });

    it("sets the theme to system", () => {
      useThemeStore.getState().setTheme("system");
      expect(useThemeStore.getState().theme).toBe("system");
    });
  });

  describe("applyTheme", () => {
    it("adds dark class for dark theme", () => {
      useThemeStore.setState({ theme: "dark" });
      useThemeStore.getState().applyTheme();

      expect(classListMock.add).toHaveBeenCalledWith("dark");
    });

    it("removes dark class for light theme", () => {
      useThemeStore.setState({ theme: "light" });
      useThemeStore.getState().applyTheme();

      expect(classListMock.remove).toHaveBeenCalledWith("dark");
    });

    it("uses system preference for system theme (dark)", () => {
      matchMediaMock.mockReturnValue({
        matches: true, // Dark mode preferred
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      useThemeStore.setState({ theme: "system" });
      useThemeStore.getState().applyTheme();

      expect(classListMock.add).toHaveBeenCalledWith("dark");
    });

    it("uses system preference for system theme (light)", () => {
      matchMediaMock.mockReturnValue({
        matches: false, // Light mode preferred
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      useThemeStore.setState({ theme: "system" });
      useThemeStore.getState().applyTheme();

      expect(classListMock.remove).toHaveBeenCalledWith("dark");
    });
  });
});