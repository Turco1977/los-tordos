import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ── Rate limiting (in-memory, per-instance) ── */
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// Clean stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.reset) rateLimitMap.delete(ip);
  }
}, 300_000);

/* ── Routes that skip auth ── */
const PUBLIC_PATHS = new Set(["/api/cron/daily-summary"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept /api/* routes
  if (!pathname.startsWith("/api")) return NextResponse.next();

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Skip auth for public paths (cron uses CRON_SECRET internally)
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  // Extract Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // Validate token with Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Pass user ID downstream via header
    const res = NextResponse.next();
    res.headers.set("x-user-id", user.id);
    return res;
  } catch {
    return NextResponse.json({ error: "Error de autenticación" }, { status: 401 });
  }
}

export const config = {
  matcher: "/api/:path*",
};
