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
      }),
    });
  } catch {
    /* best-effort */
  }
}

export async function fetchNotifications(token: string) {
  try {
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    return json.notifications || [];
  } catch {
    return [];
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
