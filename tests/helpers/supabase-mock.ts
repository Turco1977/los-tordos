import { vi } from "vitest";

/**
 * Creates a chainable mock that mimics the Supabase client query builder.
 * Each method returns the same chain so you can do:
 *   mock.from("tasks").select("*").eq("id", 1).single()
 */
export function mockAdminClient(overrides: { data?: any; error?: any; count?: number } = {}) {
  const result = { data: overrides.data ?? null, error: overrides.error ?? null, count: overrides.count };

  const chain: any = {};
  const methods = [
    "from", "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "in", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "not", "or", "filter",
    "order", "limit", "range",
    "single", "maybeSingle",
  ];

  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  // Terminal calls resolve to the result
  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  // select/insert/update/delete without .single() also resolve
  chain.then = vi.fn((resolve: any) => resolve(result));

  // Allow awaiting the chain directly
  Object.defineProperty(chain, "then", {
    value: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
    writable: true,
    configurable: true,
  });

  return chain;
}

/**
 * Creates a mock auth result for verifyUser / verifyCallerWithRole / verifyAdmin.
 */
export function mockAuth(userId: string, role: string = "usuario") {
  return {
    user: { id: userId, email: `${userId}@test.com` },
    role,
    admin: mockAdminClient(),
  };
}

export function mockAuthError(error: string = "No autorizado", status: number = 401) {
  return { error, status };
}
