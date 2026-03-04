import { fn } from "@/lib/constants";

/** Parse @mentions in text and return matched user objects */
export function parseMentions(text: string, users: any[]): any[] {
  if (!text || !users?.length) return [];
  const rx = /@([\w\s]+?)(?=\s@|\s*$|[.,;:!?)\]}])/g;
  const matched: any[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = rx.exec(text)) !== null) {
    const name = m[1].trim().toLowerCase();
    const u = users.find((u: any) => fn(u).toLowerCase() === name);
    if (u && !seen.has(u.id)) { seen.add(u.id); matched.push(u); }
  }
  return matched;
}

/** Notify all @mentioned users (skip sender, skip duplicates) */
export function notifyMentioned(
  text: string,
  users: any[],
  senderId: string,
  title: string,
  body: string,
  sendNotif: (to: string, title: string, body: string, type?: "task" | "budget" | "deadline" | "injury" | "info", link?: string) => void,
  type: "task" | "budget" | "deadline" | "injury" | "info" = "info",
  link: string = ""
): void {
  const mentioned = parseMentions(text, users);
  for (const u of mentioned) {
    if (u.id !== senderId) sendNotif(u.id, title, body, type, link);
  }
}
