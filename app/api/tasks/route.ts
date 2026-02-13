import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_STATUSES = ["pend", "curso", "emb", "valid", "ok"];
const VALID_TIPOS = [
  "Logística",
  "Administrativo",
  "Infraestructura",
  "Material deportivo",
  "Comunicación",
  "Otro",
];
const ADMIN_ROLES = ["superadmin", "admin", "coordinador"];

async function getCallerWithRole(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer "))
    return { error: "No autorizado", status: 401 };
  const token = authHeader.slice(7);
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const {
    data: { user },
  } = await client.auth.getUser(token);
  if (!user) return { error: "Token inválido", status: 401 };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, role: profile?.role || "usuario", admin };
}

/* POST — create task with server-side validation */
export async function POST(req: NextRequest) {
  const auth = await getCallerWithRole(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const {
    description,
    tipo,
    due_date,
    urgency,
    dept_id,
    assigned_to,
    division,
    requires_expense,
  } = body;

  // Validation
  if (!description || description.trim().length < 3)
    return NextResponse.json(
      { error: "La descripción debe tener al menos 3 caracteres" },
      { status: 400 }
    );
  if (tipo && !VALID_TIPOS.includes(tipo))
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date))
    return NextResponse.json(
      { error: "Formato de fecha inválido" },
      { status: 400 }
    );

  const { admin } = auth;
  const row = {
    division: division || "",
    creator_id: auth.user.id,
    creator_name: body.creator_name || "",
    dept_id: dept_id || 1,
    tipo: tipo || "Otro",
    description: description.trim(),
    due_date: due_date || "",
    urgency: urgency || "Normal",
    status: "pend",
    assigned_to: assigned_to || null,
    requires_expense: requires_expense || false,
    expense_ok: null,
    resolution: "",
    amount: null,
  };

  const { data, error } = await admin
    .from("tasks")
    .insert(row)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ task: data });
}

/* PATCH — update task status with authorization checks */
export async function PATCH(req: NextRequest) {
  const auth = await getCallerWithRole(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { id, status, assigned_to, resolution, expense_ok, amount } = body;

  if (!id)
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  if (status && !VALID_STATUSES.includes(status))
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });

  const { admin } = auth;

  // Fetch current task to verify permissions
  const { data: task } = await admin
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();
  if (!task)
    return NextResponse.json(
      { error: "Tarea no encontrada" },
      { status: 404 }
    );

  // Authorization: only creator, assignee, or admin can update
  const isTaskOwner =
    task.creator_id === auth.user.id ||
    task.assigned_to === auth.user.id;
  const isPrivileged = ADMIN_ROLES.includes(auth.role);

  if (!isTaskOwner && !isPrivileged)
    return NextResponse.json(
      { error: "No tenés permiso para modificar esta tarea" },
      { status: 403 }
    );

  // Budget approval requires embudo/admin role
  if (expense_ok !== undefined) {
    if (!["embudo", "admin", "superadmin"].includes(auth.role))
      return NextResponse.json(
        { error: "Solo Compras/Admin puede aprobar gastos" },
        { status: 403 }
      );
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (resolution !== undefined) updates.resolution = resolution;
  if (expense_ok !== undefined) updates.expense_ok = expense_ok;
  if (amount !== undefined) updates.amount = amount;

  const { error } = await admin.from("tasks").update(updates).eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/* DELETE — only admin can delete */
export async function DELETE(req: NextRequest) {
  const auth = await getCallerWithRole(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!["admin", "superadmin"].includes(auth.role))
    return NextResponse.json(
      { error: "Solo administradores pueden eliminar tareas" },
      { status: 403 }
    );

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const { error } = await auth.admin.from("tasks").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
