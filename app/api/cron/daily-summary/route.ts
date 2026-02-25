import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import webpush from "web-push";

/* Configure web-push with VAPID keys (lazy — at request time, not build time) */
let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(
        "mailto:admin@lostordos.com",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
    } catch { /* skip if keys invalid */ }
  }
}

/* Helper: create in-app notification + send push to a user (server-side, no API call) */
async function createNotifAndPush(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  title: string,
  message: string,
  type: string
) {
  // Insert in-app notification
  await db.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link: "",
    read: false,
  });

  // Send push notification
  ensureVapid();
  if (!vapidConfigured) return;
  try {
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId);

    if (!subs?.length) return;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lostordos.vercel.app";
    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/logo.jpg",
      url: appUrl,
    });

    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          )
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
            }
          })
      )
    );
  } catch {
    /* Push is best-effort */
  }
}

export async function GET(req: NextRequest) {
  /* Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET> */
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  /* Fetch open tasks */
  const { data: tasks } = await db
    .from("tasks")
    .select("id,title,description,due_date,status,assigned_to,creator_id,created_at,last_deadline_notif")
    .neq("status", "ok");

  if (!tasks?.length) {
    return NextResponse.json({ message: "No open tasks", deadlines: 0, emails: 0 });
  }

  /* Fetch profiles for emails/names */
  const { data: profiles } = await db.from("profiles").select("id,email,first_name,last_name");
  const profMap = new Map<string, { email: string; name: string }>();
  (profiles || []).forEach((p: any) => {
    profMap.set(p.id, { email: p.email || "", name: [p.first_name, p.last_name].filter(Boolean).join(" ") });
  });

  /* Fetch notification preferences */
  const { data: allPrefs } = await db.from("notification_preferences").select("*");
  const prefsMap = new Map<string, any>();
  (allPrefs || []).forEach((p: any) => prefsMap.set(p.user_id, p));

  /* ── Level 3: Deadline notifications (push + in-app) ── */
  let deadlineCount = 0;
  const deadlineUpdates: { id: number; last_deadline_notif: string }[] = [];

  for (const t of tasks) {
    if (!t.due_date || t.last_deadline_notif === today) continue;

    const isOverdue = t.due_date < today;
    const isDueToday = t.due_date === today;
    const isDueTomorrow = t.due_date === tomorrow;

    if (!isOverdue && !isDueToday && !isDueTomorrow) continue;

    const desc = (t.title || t.description || "").slice(0, 60);
    const targets: string[] = [];

    if (isOverdue || isDueToday) {
      // Notify both assignee and creator
      if (t.assigned_to) targets.push(t.assigned_to);
      if (t.creator_id && t.creator_id !== t.assigned_to) targets.push(t.creator_id);
    } else if (isDueTomorrow) {
      // Only assignee
      if (t.assigned_to) targets.push(t.assigned_to);
    }

    const label = isOverdue ? "Tarea vencida" : isDueToday ? "Vence hoy" : "Vence mañana";

    for (const uid of targets) {
      const prefs = prefsMap.get(uid);
      if (prefs?.push_enabled === false) continue;
      await createNotifAndPush(db, uid, `${label} #${t.id}`, desc, "deadline");
      deadlineCount++;
    }

    deadlineUpdates.push({ id: t.id, last_deadline_notif: today });
  }

  // Batch update dedup column
  for (const u of deadlineUpdates) {
    await db.from("tasks").update({ last_deadline_notif: u.last_deadline_notif }).eq("id", u.id);
  }

  /* ── Level 2: Daily summary emails ── */
  // Group tasks per user
  const userTasks = new Map<string, { overdue: any[]; dueToday: any[]; dueThisWeek: any[]; newYesterday: any[] }>();

  const ensureUser = (uid: string) => {
    if (!userTasks.has(uid)) userTasks.set(uid, { overdue: [], dueToday: [], dueThisWeek: [], newYesterday: [] });
    return userTasks.get(uid)!;
  };

  for (const t of tasks) {
    const desc = (t.title || t.description || "").slice(0, 80);
    const item = { id: t.id, desc, due: t.due_date, status: t.status };

    // For assignee
    if (t.assigned_to) {
      const bucket = ensureUser(t.assigned_to);
      if (t.due_date && t.due_date < today) bucket.overdue.push(item);
      else if (t.due_date === today) bucket.dueToday.push(item);
      else if (t.due_date && t.due_date > today && t.due_date <= weekEnd) bucket.dueThisWeek.push(item);
      if (t.created_at?.slice(0, 10) === yesterday) bucket.newYesterday.push(item);
    }

    // For creator (overdue + dueToday only)
    if (t.creator_id && t.creator_id !== t.assigned_to) {
      const bucket = ensureUser(t.creator_id);
      if (t.due_date && t.due_date < today) bucket.overdue.push(item);
      else if (t.due_date === today) bucket.dueToday.push(item);
      else if (t.due_date && t.due_date > today && t.due_date <= weekEnd) bucket.dueThisWeek.push(item);
    }
  }

  let emailCount = 0;

  if (process.env.RESEND_API_KEY) {
    for (const [uid, data] of userTasks) {
      const hasContent = data.overdue.length || data.dueToday.length || data.dueThisWeek.length || data.newYesterday.length;
      if (!hasContent) continue;

      const prefs = prefsMap.get(uid);
      if (prefs?.daily_summary === false) continue;

      const prof = profMap.get(uid);
      if (!prof?.email) continue;

      const renderSection = (title: string, emoji: string, color: string, items: any[]) => {
        if (!items.length) return "";
        const rows = items.slice(0, 10).map(
          (t) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #E8ECF1;font-size:12px;color:#5A6577">#${t.id}</td><td style="padding:6px 8px;border-bottom:1px solid #E8ECF1;font-size:12px;color:#0A1628">${t.desc}</td><td style="padding:6px 8px;border-bottom:1px solid #E8ECF1;font-size:12px;color:#5A6577">${t.due || "–"}</td></tr>`
        ).join("");
        const more = items.length > 10 ? `<p style="font-size:11px;color:#8B95A5;margin:4px 0 0">...y ${items.length - 10} más</p>` : "";
        return `<div style="margin-bottom:16px"><h3 style="font-size:13px;color:${color};margin:0 0 6px">${emoji} ${title} (${items.length})</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid ${color};font-size:10px;color:#8B95A5;text-transform:uppercase">#</th><th style="text-align:left;padding:6px 8px;border-bottom:2px solid ${color};font-size:10px;color:#8B95A5;text-transform:uppercase">Tarea</th><th style="text-align:left;padding:6px 8px;border-bottom:2px solid ${color};font-size:10px;color:#8B95A5;text-transform:uppercase">Fecha</th></tr></thead><tbody>${rows}</tbody></table>${more}</div>`;
      };

      const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">
        <div style="background:#0A1628;padding:16px 24px;border-radius:12px 12px 0 0;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:18px">Los Tordos Rugby Club</h2>
          <p style="color:#8B95A5;margin:4px 0 0;font-size:12px">Resumen diario de tareas</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #E8ECF1;border-top:none;border-radius:0 0 12px 12px">
          <p style="color:#0A1628;font-size:14px;margin:0 0 16px">Hola <strong>${prof.name || "equipo"}</strong>, este es tu resumen del día:</p>
          ${renderSection("Vencidas", "🔴", "#DC2626", data.overdue)}
          ${renderSection("Vencen hoy", "⚡", "#F59E0B", data.dueToday)}
          ${renderSection("Esta semana", "📅", "#3B82F6", data.dueThisWeek)}
          ${renderSection("Nuevas asignadas ayer", "🆕", "#10B981", data.newYesterday)}
          <div style="text-align:center;margin-top:20px">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://lostordos.vercel.app"}" style="display:inline-block;background:#C8102E;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Abrir sistema</a>
          </div>
        </div>
        <p style="text-align:center;color:#8B95A5;font-size:10px;margin-top:12px">Resumen automático · Lunes a Viernes 8:00 AM</p>
      </div>`;

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "Los Tordos <noreply@lostordos.com>",
            to: prof.email,
            subject: `[Los Tordos] Resumen diario — ${data.overdue.length} vencidas, ${data.dueToday.length} vencen hoy`,
            html,
          }),
        });
        emailCount++;
      } catch {
        /* Email is best-effort */
      }
    }
  }

  return NextResponse.json({
    message: "Daily summary completed",
    deadlines: deadlineCount,
    emails: emailCount,
    tasksProcessed: tasks.length,
  });
}
