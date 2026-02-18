import { describe, it, expect } from "vitest";
import { extractToken } from "@/lib/api/auth";

function mockReq(authHeader?: string) {
  return {
    headers: {
      get: (name: string) => (name === "authorization" ? authHeader ?? null : null),
    },
  } as any;
}

describe("extractToken()", () => {
  it("returns token string when valid Bearer header is provided", () => {
    const result = extractToken(mockReq("Bearer abc123"));
    expect(result).toBe("abc123");
  });

  it("returns 401 error when no authorization header", () => {
    const result = extractToken(mockReq());
    expect(result).toEqual({ error: "No autorizado", status: 401 });
  });

  it("returns 401 error when authorization header is not Bearer", () => {
    const result = extractToken(mockReq("Basic abc123"));
    expect(result).toEqual({ error: "No autorizado", status: 401 });
  });

  it("returns 401 error when Bearer prefix with empty token", () => {
    const result = extractToken(mockReq("Bearer "));
    expect(result).toBe("");
  });

  it("handles long tokens correctly", () => {
    const longToken = "a".repeat(500);
    const result = extractToken(mockReq("Bearer " + longToken));
    expect(result).toBe(longToken);
  });
});
