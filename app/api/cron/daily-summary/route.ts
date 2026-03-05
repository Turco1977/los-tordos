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
  type: string,
  link = ""
) {
  // Insert in-app notification
  await db.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link,
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

  /* Fetch profiles for emails/names */
  const { data: profiles } = await db.from("profiles").select("id,email,first_name,last_name,role");
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

  for (const t of (tasks || [])) {
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

  for (const t of (tasks || [])) {
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

  /* ── Level 4: Sponsor contract expiration alerts ── */
  const { data: contracts } = await db.from("sponsor_contracts").select("*");
  const { data: sponsors } = await db.from("sponsors").select("id,name");
  const sponsorMap = new Map<number, string>();
  (sponsors || []).forEach((s: any) => sponsorMap.set(s.id, s.name));

  // Users who manage sponsors (superadmin, admin, coordinador)
  const sponsorManagers = (profiles || []).filter((p: any) =>
    ["superadmin", "admin", "coordinador"].includes(p.role)
  );

  const THRESHOLDS = [30, 14, 7, 3, 1, 0];
  let sponsorAlerts = 0;

  for (const c of (contracts || []) as any[]) {
    if (!c.fecha_fin || c.estado === "renovado") continue;
    const diff = Math.round((new Date(c.fecha_fin).getTime() - new Date(today).getTime()) / 864e5);

    const isThreshold = THRESHOLDS.includes(diff);
    const expiredYesterday = c.fecha_fin === yesterday;
    if (!isThreshold && !expiredYesterday) continue;

    const sName = sponsorMap.get(c.sponsor_id) || "Sponsor";
    const titulo = c.titulo || "Contrato";
    const title = diff > 0
      ? `⚠️ Contrato por vencer — ${sName}`
      : diff === 0
      ? `🔴 Contrato vence HOY — ${sName}`
      : `🔴 Contrato vencido — ${sName}`;
    const msg = diff > 0
      ? `"${titulo}" vence en ${diff} días`
      : diff === 0
      ? `"${titulo}" vence hoy`
      : `"${titulo}" venció ayer`;

    for (const u of sponsorManagers) {
      const prefs = prefsMap.get(u.id);
      if (prefs?.push_enabled === false) continue;
      await createNotifAndPush(db, u.id, title, msg, "deadline", "sponsors");
      sponsorAlerts++;
    }
  }

  /* ── Level 5: Sponsor contact birthday alerts ── */
  const { data: contactos } = await db.from("sponsor_contactos").select("*");
  const todayMMDD = today.slice(5); // "MM-DD"
  let birthdayAlerts = 0;

  for (const ct of (contactos || []) as any[]) {
    if (!ct.fecha_nacimiento) continue;
    if (ct.fecha_nacimiento.slice(5) !== todayMMDD) continue;

    const sName = sponsorMap.get(ct.sponsor_id) || "Sponsor";
    const title = `🎂 Cumpleaños hoy — ${ct.nombre}`;
    const msg = `${ct.nombre} (${sName}) cumple años hoy`;

    for (const u of sponsorManagers) {
      const prefs = prefsMap.get(u.id);
      if (prefs?.push_enabled === false) continue;
      await createNotifAndPush(db, u.id, title, msg, "info", "sponsors");
      birthdayAlerts++;
    }
  }

  /* ── Level 6: Weekly hospitalidad report (Mondays only) ── */
  let hospReportSent = 0;
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon
  if (dayOfWeek === 1 && process.env.RESEND_API_KEY) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const { data: fixtures } = await db.from("fixtures").select("*").gte("date", weekAgo).lt("date", today).eq("is_local", true);
    const { data: invitaciones } = await db.from("hospitalidad_invitaciones").select("*");

    const pastFixtures = (fixtures || []) as any[];
    const allInvs = (invitaciones || []) as any[];

    if (pastFixtures.length > 0) {
      // Build invitations per fixture
      const fixtureInvs = pastFixtures.map((f: any) => {
        const invs = allInvs.filter((i: any) => i.fixture_id === f.id || (i.partido_fecha === f.date && i.partido_rival === f.rival));
        return { fixture: f, invs };
      }).filter(g => g.invs.length > 0);

      if (fixtureInvs.length > 0) {
        const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const totalInv = fixtureInvs.reduce((s, g) => s + g.invs.length, 0);
        const totalAsist = fixtureInvs.reduce((s, g) => s + g.invs.filter((i: any) => i.asistio === true).length, 0);
        const totalNoAsist = fixtureInvs.reduce((s, g) => s + g.invs.filter((i: any) => i.asistio === false).length, 0);
        const totalPend = totalInv - totalAsist - totalNoAsist;
        const totalEntradas = fixtureInvs.reduce((s, g) => s + g.invs.reduce((a: number, i: any) => a + Number(i.entradas || 0), 0), 0);

        let matchSections = "";
        for (const g of fixtureInvs) {
          const f = g.fixture;
          const fDate = f.date || "–";
          const fRival = esc(f.rival || "TBC");
          const rows = g.invs.map((i: any) => {
            const sn = esc(sponsorMap.get(i.sponsor_id) || "Sponsor");
            return `<tr><td style="padding:5px 8px;border-bottom:1px solid #E8ECF1;font-size:11px">${sn}</td><td style="padding:5px 8px;border-bottom:1px solid #E8ECF1;font-size:11px;text-align:center">${i.entradas || 0}</td><td style="padding:5px 8px;border-bottom:1px solid #E8ECF1;font-size:11px;text-align:center">${i.estacionamiento ? "Sí" : "No"}</td><td style="padding:5px 8px;border-bottom:1px solid #E8ECF1;font-size:11px;text-align:center">${i.zona_vip ? "Sí" : "No"}</td><td style="padding:5px 8px;border-bottom:1px solid #E8ECF1;font-size:11px;text-align:center;font-weight:600;color:${i.asistio === true ? "#10B981" : i.asistio === false ? "#DC2626" : "#F59E0B"}">${i.asistio === true ? "Sí" : i.asistio === false ? "No" : "Pend."}</td><td style="padding:5px 8px;border-bottom:1px solid #E8ECF1;font-size:11px;text-align:center">${i.personas_asistentes || "–"}</td></tr>`;
          }).join("");
          matchSections += `<div style="margin-bottom:20px"><h3 style="font-size:13px;color:#0A1628;margin:0 0 6px">🏉 ${fDate} — Los Tordos vs ${fRival} (${esc(f.division || "")})</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:5px 8px;background:#0A1628;color:#fff;font-size:10px">Sponsor</th><th style="text-align:center;padding:5px 8px;background:#0A1628;color:#fff;font-size:10px">Entradas</th><th style="text-align:center;padding:5px 8px;background:#0A1628;color:#fff;font-size:10px">Estac.</th><th style="text-align:center;padding:5px 8px;background:#0A1628;color:#fff;font-size:10px">VIP</th><th style="text-align:center;padding:5px 8px;background:#0A1628;color:#fff;font-size:10px">Asistió</th><th style="text-align:center;padding:5px 8px;background:#0A1628;color:#fff;font-size:10px">Personas</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }

        const tasa = totalInv > 0 ? Math.round((totalAsist / totalInv) * 100) : 0;
        const hospHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#0A1628;padding:16px 24px;border-radius:12px 12px 0 0;text-align:center">
            <h2 style="color:#fff;margin:0;font-size:18px">Los Tordos Rugby Club</h2>
            <p style="color:#8B95A5;margin:4px 0 0;font-size:12px">Informe semanal de hospitalidad</p>
          </div>
          <div style="background:#fff;padding:24px;border:1px solid #E8ECF1;border-top:none;border-radius:0 0 12px 12px">
            <p style="color:#0A1628;font-size:13px;margin:0 0 14px">Semana ${weekAgo} al ${yesterday}:</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
              <div style="padding:8px 14px;border-radius:8px;background:#F7F8FA;text-align:center"><div style="font-size:18px;font-weight:800;color:#0A1628">${totalInv}</div><div style="font-size:9px;color:#8B95A5">Invitados</div></div>
              <div style="padding:8px 14px;border-radius:8px;background:#ECFDF5;text-align:center"><div style="font-size:18px;font-weight:800;color:#10B981">${totalAsist}</div><div style="font-size:9px;color:#8B95A5">Asistieron</div></div>
              <div style="padding:8px 14px;border-radius:8px;background:#FEE2E2;text-align:center"><div style="font-size:18px;font-weight:800;color:#DC2626">${totalNoAsist}</div><div style="font-size:9px;color:#8B95A5">No asistieron</div></div>
              <div style="padding:8px 14px;border-radius:8px;background:#FEF3C7;text-align:center"><div style="font-size:18px;font-weight:800;color:#F59E0B">${totalPend}</div><div style="font-size:9px;color:#8B95A5">Pendientes</div></div>
              <div style="padding:8px 14px;border-radius:8px;background:#F7F8FA;text-align:center"><div style="font-size:18px;font-weight:800;color:#0A1628">${totalEntradas}</div><div style="font-size:9px;color:#8B95A5">Entradas</div></div>
              <div style="padding:8px 14px;border-radius:8px;background:#EFF6FF;text-align:center"><div style="font-size:18px;font-weight:800;color:#3B82F6">${tasa}%</div><div style="font-size:9px;color:#8B95A5">Asistencia</div></div>
            </div>
            ${matchSections}
            <div style="text-align:center;margin-top:20px">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://lostordos.vercel.app"}" style="display:inline-block;background:#C8102E;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Abrir sistema</a>
            </div>
          </div>
          <p style="text-align:center;color:#8B95A5;font-size:10px;margin-top:12px">Informe automático semanal · Lunes 8:00 AM</p>
        </div>`;

        // Send to sponsor managers
        for (const u of sponsorManagers) {
          const prefs = prefsMap.get(u.id);
          if (prefs?.daily_summary === false) continue;
          const prof = profMap.get(u.id);
          if (!prof?.email) continue;
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                from: process.env.RESEND_FROM || "Los Tordos <noreply@lostordos.com>",
                to: prof.email,
                subject: `[Los Tordos] Hospitalidad semanal — ${totalInv} invitados, ${tasa}% asistencia`,
                html: hospHtml,
              }),
            });
            hospReportSent++;
          } catch { /* Email is best-effort */ }
        }
      }
    }
  }

  return NextResponse.json({
    message: "Daily summary completed",
    deadlines: deadlineCount,
    emails: emailCount,
    tasksProcessed: (tasks || []).length,
    sponsorAlerts,
    birthdayAlerts,
    hospReportSent,
  });
}
