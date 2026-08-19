import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

const originalFetch = global.fetch;

afterEach(() => {
  vi.restoreAllMocks();
  global.fetch = originalFetch;
});
