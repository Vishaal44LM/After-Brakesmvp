import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

vi.mock("@/pages/Index", () => ({ default: () => null }));

afterEach(cleanup);

describe("temporary holding page access", () => {
  it.each([
    "/login", "/setup/user", "/setup/mechanic", "/dashboard",
    "/mechanic-dashboard", "/chat/test-issue", "/emergency", "/unknown-page",
  ])("blocks direct access to %s", async (path) => {
    window.history.replaceState({}, "", path);
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });
});