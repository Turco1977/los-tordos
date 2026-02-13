import { describe, it, expect } from "vitest";
import { paginate } from "@/lib/pagination";

describe("paginate()", () => {
  const items = Array.from({ length: 55 }, (_, i) => i + 1);

  it("returns first page of items", () => {
    const result = paginate(items, 1, 10);
    expect(result.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(result.page).toBe(1);
    expect(result.total).toBe(55);
    expect(result.totalPages).toBe(6);
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  it("returns middle page", () => {
    const result = paginate(items, 3, 10);
    expect(result.data).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
    expect(result.page).toBe(3);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it("returns last page with partial items", () => {
    const result = paginate(items, 6, 10);
    expect(result.data).toEqual([51, 52, 53, 54, 55]);
    expect(result.page).toBe(6);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  it("clamps page to valid range (too high)", () => {
    const result = paginate(items, 100, 10);
    expect(result.page).toBe(6);
    expect(result.data).toEqual([51, 52, 53, 54, 55]);
  });

  it("clamps page to valid range (too low)", () => {
    const result = paginate(items, -5, 10);
    expect(result.page).toBe(1);
    expect(result.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("handles empty array", () => {
    const result = paginate([], 1, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it("handles single item", () => {
    const result = paginate(["a"], 1, 10);
    expect(result.data).toEqual(["a"]);
    expect(result.totalPages).toBe(1);
  });

  it("handles exact page boundary", () => {
    const exactItems = Array.from({ length: 20 }, (_, i) => i);
    const result = paginate(exactItems, 2, 10);
    expect(result.data).toHaveLength(10);
    expect(result.totalPages).toBe(2);
    expect(result.hasNext).toBe(false);
  });

  it("preserves generic types", () => {
    const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = paginate(objects, 1, 2);
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
