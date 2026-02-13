import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/lib/theme";
import { T, TD } from "@/lib/constants";

const mockStorage: Record<string, string> = {};
const storageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  get length() { return Object.keys(mockStorage).length; },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
};

beforeEach(() => {
  storageMock.clear();
  vi.stubGlobal("localStorage", storageMock);
  document.documentElement.removeAttribute("data-theme");
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

describe("useTheme()", () => {
  it("defaults to light mode", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("light");
    expect(result.current.isDark).toBe(false);
    expect(result.current.colors).toEqual(T);
  });

  it("restores theme from localStorage", () => {
    storageMock.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("dark");
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toEqual(TD);
  });

  it("respects prefers-color-scheme: dark", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { result } = renderHook(() => useTheme());
    expect(result.current.mode).toBe("dark");
  });

  it("toggle switches light to dark", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("dark");
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toEqual(TD);
    expect(storageMock.getItem("theme")).toBe("dark");
  });

  it("toggle switches dark to light", () => {
    storageMock.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.mode).toBe("light");
    expect(result.current.isDark).toBe(false);
    expect(storageMock.getItem("theme")).toBe("light");
  });

  it("sets data-theme attribute on document", () => {
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.dataset.theme).toBe("light");
    act(() => result.current.toggle());
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("cardBg changes with theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.cardBg).toBe("#fff");
    act(() => result.current.toggle());
    expect(result.current.cardBg).toBe(TD.g2);
  });

  it("headerBg changes with theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.headerBg).toBe("#fff");
    act(() => result.current.toggle());
    expect(result.current.headerBg).toBe(TD.g2);
  });
});
