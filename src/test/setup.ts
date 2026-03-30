import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

import { resetSupabaseMock, mockSupabase } from "@/test/mocks/supabase";
import { resetSimulatorStore } from "@/test/test-utils";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  Object.defineProperty(window, "confirm", {
    writable: true,
    value: vi.fn(() => true),
  });

  Object.defineProperty(window, "prompt", {
    writable: true,
    value: vi.fn(() => ""),
  });

  Object.defineProperty(window, "print", {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    value: ResizeObserverMock,
  });

  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    value: IntersectionObserverMock,
  });

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: vi.fn(async () => undefined),
    },
  });

  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  window.localStorage?.clear?.();
  window.sessionStorage?.clear?.();
  resetSupabaseMock();
  resetSimulatorStore();
  vi.clearAllTimers();
  vi.useRealTimers();
});
