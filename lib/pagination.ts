/**
 * Client-side pagination utility.
 * Works with any filtered array.
 */

export function paginate<T>(items: T[], page: number, perPage: number): {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * perPage;
  const data = items.slice(start, start + perPage);

  return {
    data,
    page: safePage,
    perPage,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
