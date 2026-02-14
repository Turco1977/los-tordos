import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

type AuthError = { error: string; status: number };

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function extractToken(req: NextRequest): string | AuthError {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return { error: "No autorizado", status: 401 };
  return authHeader.slice(7);
}

export async function verifyUser(req: NextRequest) {
  const token = extractToken(req);
  if (typeof token !== "string") return token;

  const { data: { user } } = await anonClient().auth.getUser(token);
  if (!user) return { error: "Token inválido", status: 401 } as AuthError;
  return { user };
}

export async function verifyCallerWithRole(req: NextRequest) {
  const result = await verifyUser(req);
  if ("error" in result) return result;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", result.user.id)
    .single();

  return { user: result.user, role: profile?.role || "usuario", admin };
}

export async function verifyAdmin(req: NextRequest) {
  const result = await verifyUser(req);
  if ("error" in result) return result;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", result.user.id)
    .single();

  if (!profile || !["superadmin", "admin"].includes(profile.role)) {
    return { error: "Solo administradores pueden gestionar usuarios", status: 403 } as AuthError;
  }

  return { caller: result.user, callerProfile: profile, admin };
}

export async function verifyDepStaff(req: NextRequest) {
  const result = await verifyUser(req);
  if ("error" in result) return result;

  const admin = createAdminClient();

  // Check dep_staff role (dd or dr)
  const { data: depStaff } = await admin
    .from("dep_staff")
    .select("dep_role")
    .eq("user_id", result.user.id)
    .eq("active", true)
    .single();

  if (depStaff && (depStaff.dep_role === "dd" || depStaff.dep_role === "dr")) {
    return { caller: result.user, admin };
  }

  // Fallback: check profiles for admin/superadmin
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", result.user.id)
    .single();

  if (profile && (profile.role === "superadmin" || profile.role === "admin")) {
    return { caller: result.user, admin };
  }

  return { error: "Solo DD/DR pueden crear usuarios deportivos", status: 403 } as AuthError;
}
