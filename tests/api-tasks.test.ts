import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock verifyCallerWithRole
const mockVerifyCallerWithRole = vi.fn();
vi.mock("@/lib/api/auth", () => ({
  verifyCallerWithRole: (...args: any[]) => mockVerifyCallerWithRole(...args),
}));

import { POST, PATCH, DELETE } from "@/app/api/tasks/route";

function mockReq(body: any, url?: string): any {
  return {
    json: () => Promise.resolve(body),
    url: url || "http://localhost:3000/api/tasks",
    headers: { get: () => "Bearer valid-token" },
  };
}

const mockFrom = vi.fn();
const mockAdmin = {
  from: (...args: any[]) => mockFrom(...args),
};

function setupAuth(role: string = "admin", userId: string = "user-1") {
  mockVerifyCallerWithRole.mockResolvedValue({
    user: { id: userId },
    role,
    admin: mockAdmin,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/tasks — create task", () => {
  it("returns 401 when not authenticated", async () => {
    mockVerifyCallerWithRole.mockResolvedValue({ error: "No autorizado", status: 401 });
    const res = await POST(mockReq({ description: "Test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when description is too short", async () => {
    setupAuth();
    const res = await POST(mockReq({ description: "ab" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/3 caracteres/);
  });

  it("returns 400 when description is empty", async () => {
    setupAuth();
    const res = await POST(mockReq({ description: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is missing", async () => {
    setupAuth();
    const res = await POST(mockReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid tipo", async () => {
    setupAuth();
    const res = await POST(mockReq({ description: "Valid task", tipo: "Hacking" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/tipo/i);
  });

  it("returns 400 for invalid date format", async () => {
    setupAuth();
    const res = await POST(mockReq({ description: "Valid task", due_date: "31/12/2024" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/fecha/i);
  });

  it("accepts valid tipo from whitelist", async () => {
    setupAuth();
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1, description: "Test task" }, error: null }),
    };
    mockFrom.mockReturnValue(chain);
    const res = await POST(mockReq({ description: "Valid task", tipo: "Logística" }));
    expect(res.status).toBe(200);
  });

  it("creates task with correct defaults", async () => {
    setupAuth("coordinador", "user-2");
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 5, description: "New task" }, error: null }),
    };
    mockFrom.mockReturnValue(chain);

    const res = await POST(mockReq({ description: "New task" }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.task).toBeDefined();

    // Verify the inserted row has correct defaults
    const insertedRow = chain.insert.mock.calls[0][0];
    expect(insertedRow.creator_id).toBe("user-2");
    expect(insertedRow.status).toBe("pend");
    expect(insertedRow.tipo).toBe("Otro");
    expect(insertedRow.urgency).toBe("Normal");
  });
});

describe("PATCH /api/tasks — update task", () => {
  it("returns 400 when id is missing", async () => {
    setupAuth();
    const res = await PATCH(mockReq({ status: "curso" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid status", async () => {
    setupAuth();
    const res = await PATCH(mockReq({ id: 1, status: "hacked" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when task not found", async () => {
    setupAuth();
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    };
    mockFrom.mockReturnValue(chain);
    const res = await PATCH(mockReq({ id: 999, status: "curso" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when non-owner/non-admin tries to update", async () => {
    setupAuth("usuario", "other-user");
    // First call: select task, second call: update
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, creator_id: "owner-1", assigned_to: "assignee-1" },
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const res = await PATCH(mockReq({ id: 1, status: "ok" }));
    expect(res.status).toBe(403);
  });

  it("allows task creator to update", async () => {
    setupAuth("usuario", "owner-1");
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // select task
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 1, creator_id: "owner-1", assigned_to: null },
          }),
        };
      }
      // update
      return {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
    });
    const res = await PATCH(mockReq({ id: 1, status: "curso" }));
    expect(res.status).toBe(200);
  });

  it("returns 403 when non-admin tries to approve expense", async () => {
    setupAuth("usuario", "owner-1");
    const selectChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, creator_id: "owner-1", assigned_to: null },
      }),
    };
    mockFrom.mockReturnValue(selectChain);
    const res = await PATCH(mockReq({ id: 1, expense_ok: true }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/compras|admin/i);
  });
});

describe("DELETE /api/tasks — admin only", () => {
  it("returns 403 for non-admin user", async () => {
    setupAuth("usuario");
    const res = await DELETE(mockReq({}, "http://localhost:3000/api/tasks?id=1"));
    expect(res.status).toBe(403);
  });

  it("returns 403 for coordinador", async () => {
    setupAuth("coordinador");
    const res = await DELETE(mockReq({}, "http://localhost:3000/api/tasks?id=1"));
    expect(res.status).toBe(403);
  });

  it("returns 400 when id is missing", async () => {
    setupAuth("admin");
    const res = await DELETE(mockReq({}, "http://localhost:3000/api/tasks"));
    expect(res.status).toBe(400);
  });

  it("allows admin to delete", async () => {
    setupAuth("admin");
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);
    const res = await DELETE(mockReq({}, "http://localhost:3000/api/tasks?id=1"));
    expect(res.status).toBe(200);
  });

  it("allows superadmin to delete", async () => {
    setupAuth("superadmin");
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(chain);
    const res = await DELETE(mockReq({}, "http://localhost:3000/api/tasks?id=5"));
    expect(res.status).toBe(200);
  });
});
