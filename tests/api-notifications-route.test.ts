import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock verifyUser
const mockVerifyUser = vi.fn();
vi.mock("@/lib/api/auth", () => ({
  verifyUser: (...args: any[]) => mockVerifyUser(...args),
}));

// Mock createAdminClient
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

import { POST, PATCH } from "@/app/api/notifications/route";

function mockReq(body: any): any {
  return {
    json: () => Promise.resolve(body),
    headers: { get: (name: string) => name === "authorization" ? "Bearer valid" : null },
    nextUrl: { searchParams: new URLSearchParams() },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/notifications — authorization", () => {
  it("returns 401 when not authenticated", async () => {
    mockVerifyUser.mockResolvedValue({ error: "No autorizado", status: 401 });
    const res = await POST(mockReq({ user_id: "u1", title: "Hello" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when user_id or title missing", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(mockReq({ user_id: "user-1" }));
    expect(res.status).toBe(400);
  });

  it("allows user to notify themselves", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "user-1" } });
    // Mock prefs query
    const prefsChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    };
    // Mock insert notification
    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1, title: "Self" }, error: null }),
    };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return prefsChain; // notification_preferences
      return insertChain; // notifications insert
    });

    const res = await POST(mockReq({ user_id: "user-1", title: "Self notif" }));
    expect(res.status).toBe(200);
  });

  it("returns 403 when regular user notifies another user", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "user-1" } });
    // Mock profile lookup for role check
    const profileChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: "usuario" } }),
    };
    mockFrom.mockReturnValue(profileChain);

    const res = await POST(mockReq({ user_id: "other-user", title: "Hey" }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/no autorizado/i);
  });

  it("allows admin to notify another user", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "admin-1" } });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Profile lookup for role check
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
        };
      }
      if (callCount === 2) {
        // notification_preferences
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      // notifications insert
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 2, title: "Admin msg" }, error: null }),
      };
    });

    const res = await POST(mockReq({ user_id: "other-user", title: "Admin msg" }));
    expect(res.status).toBe(200);
  });

  it("allows coordinador to notify another user", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "coord-1" } });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: "coordinador" } }),
        };
      }
      if (callCount === 2) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 3, title: "Coord msg" }, error: null }),
      };
    });

    const res = await POST(mockReq({ user_id: "other-user", title: "Coord msg" }));
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/notifications — mark read", () => {
  it("returns 401 when not authenticated", async () => {
    mockVerifyUser.mockResolvedValue({ error: "No autorizado", status: 401 });
    const res = await PATCH(mockReq({ all: true }));
    expect(res.status).toBe(401);
  });

  it("marks all as read for the calling user", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "user-1" } });
    // Need a chain where .update().eq().eq() all work
    const chain: any = {};
    chain.update = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    // After last .eq(), resolves via await
    Object.defineProperty(chain, "then", {
      value: (resolve: any) => resolve({ error: null }),
      configurable: true,
    });
    mockFrom.mockReturnValue(chain);

    const res = await PATCH(mockReq({ all: true }));
    expect(res.status).toBe(200);
  });

  it("marks specific ids as read", async () => {
    mockVerifyUser.mockResolvedValue({ user: { id: "user-1" } });
    const updateChain = {
      update: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(updateChain);

    const res = await PATCH(mockReq({ ids: [1, 2, 3] }));
    expect(res.status).toBe(200);
  });
});
