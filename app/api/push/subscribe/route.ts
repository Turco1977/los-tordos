import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

/* POST — save a push subscription for the authenticated user */
export async function POST(req: NextRequest) {
  const auth = await verifyUser(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { subscription } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)
    return NextResponse.json({ error: "subscription inválida" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("push_subscriptions").upsert(
    {
      user_id: auth.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "user_id,endpoint" }
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/* DELETE — remove a push subscription */
export async function DELETE(req: NextRequest) {
  const auth = await verifyUser(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { endpoint } = await req.json();
  if (!endpoint)
    return NextResponse.json({ error: "endpoint requerido" }, { status: 400 });

  const db = createAdminClient();
  await db
    .from("push_subscriptions")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
