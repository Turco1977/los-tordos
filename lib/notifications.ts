/**
 * Client-side helpers for the notification system.
 * Call notify() after key actions (task assign, budget approve, etc.)
 * to create in-app + email notifications.
 */

export async function notify(params: {
  token: string;
  user_id: string;
  title: string;
  message?: string;
  type?: "task" | "budget" | "deadline" | "injury" | "info";
  link?: string;
  send_email?: boolean;
}) {
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        user_id: params.user_id,
        title: params.title,
        message: params.message || "",
        type: params.type || "info",
        link: params.link || "",
        send_email: params.send_email || false,
      }),
    });
  } catch {
    /* best-effort */
  }
}

export async function fetchNotifications(token: string, opts?: {
  limit?: number;
  offset?: number;
  type?: string;
  read?: boolean | null;
}) {
  try {
    const p = new URLSearchParams();
    if (opts?.limit) p.set("limit", String(opts.limit));
    if (opts?.offset) p.set("offset", String(opts.offset));
    if (opts?.type) p.set("type", opts.type);
    if (opts?.read === true) p.set("read", "true");
    else if (opts?.read === false) p.set("read", "false");
    const qs = p.toString();
    const res = await fetch("/api/notifications" + (qs ? "?" + qs : ""), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    return { notifications: json.notifications || [], total: json.total ?? 0 };
  } catch {
    return { notifications: [], total: 0 };
  }
}

export async function markRead(token: string, ids?: number[]) {
  try {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ids ? { ids } : { all: true }),
    });
  } catch {
    /* best-effort */
  }
}
