import { describe, it, expect, vi, beforeEach } from "vitest";
import { notify, fetchNotifications, markRead } from "@/lib/notifications";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("notify()", () => {
  it("sends POST to /api/notifications with correct payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal("fetch", mockFetch);

    await notify({
      token: "test-token",
      user_id: "user-123",
      title: "Test Notification",
      message: "Hello",
      type: "task",
      link: "/tasks/1",
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        user_id: "user-123",
        title: "Test Notification",
        message: "Hello",
        type: "task",
        link: "/tasks/1",
      }),
    });
  });

  it("defaults message, type, and link", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", mockFetch);

    await notify({ token: "t", user_id: "u1", title: "Hello" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message).toBe("");
    expect(body.type).toBe("info");
    expect(body.link).toBe("");
  });

  it("does not throw on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    // Should not throw
    await notify({ token: "t", user_id: "u", title: "x" });
  });
});

describe("fetchNotifications()", () => {
  it("sends GET with auth token and returns notifications", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [{ id: 1, title: "N1" }] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchNotifications("my-token");

    expect(mockFetch).toHaveBeenCalledWith("/api/notifications", {
      headers: { Authorization: "Bearer my-token" },
    });
    expect(result).toEqual([{ id: 1, title: "N1" }]);
  });

  it("returns empty array when notifications is missing", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchNotifications("t");
    expect(result).toEqual([]);
  });

  it("returns empty array on error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));
    const result = await fetchNotifications("bad-token");
    expect(result).toEqual([]);
  });
});

describe("markRead()", () => {
  it("sends PATCH with specific ids", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", mockFetch);

    await markRead("token", [1, 2, 3]);

    expect(mockFetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ ids: [1, 2, 3] }),
    });
  });

  it("sends PATCH with all flag when no ids", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", mockFetch);

    await markRead("token");

    expect(mockFetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ all: true }),
    });
  });

  it("does not throw on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fail")));
    await markRead("t", [1]);
  });
});
