import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import webpush from "web-push";

/* Configure web-push with VAPID keys */
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@lostordos.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/* GET — fetch notifications for the calling user (supports pagination & filters) */
export async function GET(req: NextRequest) {
  const auth = await verifyUser(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = req.nextUrl;
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 100);
  const offset = Number(url.searchParams.get("offset")) || 0;
  const typeFilter = url.searchParams.get("type") || "";
  const readFilter = url.searchParams.get("read"); // "true","false", or null (all)

  const db = createAdminClient();
  let q = db
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (typeFilter) q = q.eq("type", typeFilter);
  if (readFilter === "true") q = q.eq("read", true);
  else if (readFilter === "false") q = q.eq("read", false);

  const { data, error, count } = await q;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data, total: count ?? 0 });
}

/* POST — create a notification (and optionally send email) */
export async function POST(req: NextRequest) {
  const auth = await verifyUser(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { user_id, title, message, type, link, send_email } = body;

  if (!user_id || !title)
    return NextResponse.json(
      { error: "user_id y title requeridos" },
      { status: 400 }
    );

  const db = createAdminClient();

  /* Check user notification preferences */
  const { data: prefs } = await db
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  const { data, error } = await db
    .from("notifications")
    .insert({
      user_id,
      title,
      message: message || "",
      type: type || "info",
      link: link || "",
      read: false,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  /* Try sending email only when explicitly requested, respecting user preferences */
  const emailAllowed = type === "deadline"
    ? (prefs?.email_deadline ?? true)
    : type === "task"
    ? (prefs?.email_task_assign ?? true)
    : true;
  if (send_email && emailAllowed && process.env.RESEND_API_KEY) {
    try {
      const { data: profile } = await db
        .from("profiles")
        .select("email,first_name")
        .eq("id", user_id)
        .single();

      if (profile?.email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM || "Los Tordos <noreply@lostordos.com>",
            to: profile.email,
            subject: `[Los Tordos] ${title}`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
              <div style="background:#0A1628;padding:16px 24px;border-radius:12px 12px 0 0;text-align:center">
                <h2 style="color:#fff;margin:0;font-size:18px">Los Tordos Rugby Club</h2>
              </div>
              <div style="background:#fff;padding:24px;border:1px solid #E8ECF1;border-top:none;border-radius:0 0 12px 12px">
                <p style="color:#0A1628;font-size:15px;font-weight:700;margin:0 0 8px">${title}</p>
                <p style="color:#5A6577;font-size:13px;margin:0 0 16px">${message || ""}</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://lostordos.vercel.app"}${link || "/"}" style="display:inline-block;background:#C8102E;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Ver en el sistema</a>
              </div>
              <p style="text-align:center;color:#8B95A5;font-size:10px;margin-top:12px">Este es un mensaje automático del sistema de gestión.</p>
            </div>`,
          }),
        });
      }
    } catch {
      /* Email is best-effort — don't fail the notification creation */
    }
  }

  /* Send Web Push to all subscribed devices of the target user (respecting preferences) */
  if ((prefs?.push_enabled ?? true) && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      const { data: subs } = await db
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .eq("user_id", user_id);

      if (subs?.length) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lostordos.vercel.app";
        const payload = JSON.stringify({
          title,
          body: message || "",
          icon: "/logo.jpg",
          url: link ? `${appUrl}${link}` : appUrl,
        });

        await Promise.allSettled(
          subs.map((s) =>
            webpush
              .sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                payload
              )
              .catch(async (err) => {
                /* Remove expired/invalid subscriptions (410 Gone or 404) */
                if (err.statusCode === 410 || err.statusCode === 404) {
                  await db
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", s.endpoint);
                }
              })
          )
        );
      }
    } catch {
      /* Push is best-effort — don't fail the notification creation */
    }
  }

  return NextResponse.json({ notification: data });
}

/* PATCH — mark notifications as read */
export async function PATCH(req: NextRequest) {
  const auth = await verifyUser(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { ids, all } = body;

  const db = createAdminClient();
  if (all) {
    await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", auth.user.id)
      .eq("read", false);
  } else if (ids?.length) {
    await db
      .from("notifications")
      .update({ read: true })
      .in("id", ids)
      .eq("user_id", auth.user.id);
  }

  return NextResponse.json({ ok: true });
}
