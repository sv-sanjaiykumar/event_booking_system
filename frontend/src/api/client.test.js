import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_KEY, apiClient } from "./client.js";
import { fetchEvents } from "../features/events/eventApi.js";

const originalAdapter = apiClient.defaults.adapter;

describe("shared API client", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    window.sessionStorage.clear();
  });

  it("attaches the tab bearer token and fetches every event page", async () => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, "short-lived-token");
    const adapter = vi.fn(async (config) => ({
      data: config.params.page === 1
        ? Array.from({ length: 100 }, (_, index) => ({ id: index + 1 }))
        : [{ id: 101 }],
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;

    const events = await fetchEvents();

    expect(events).toHaveLength(101);
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe(
      "Bearer short-lived-token",
    );
    expect(adapter.mock.calls[1][0].params).toEqual({
      page: 2,
      page_size: 100,
    });
  });

  it("clears expired credentials and dispatches the central expiry event", async () => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, "expired-token");
    const adapter = vi.fn((config) => Promise.reject(
      new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        {},
        {
          data: { detail: "Invalid token." },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config,
        },
      ),
    ));
    apiClient.defaults.adapter = adapter;
    const onExpired = vi.fn();
    window.addEventListener("auth:expired", onExpired);

    await expect(apiClient.get("/auth/me")).rejects.toBeInstanceOf(AxiosError);

    expect(window.sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    window.removeEventListener("auth:expired", onExpired);
  });
});
