import { openDB } from "idb";
import { createClient } from "@/lib/supabase/client";

const DB_NAME = "los-tordos-offline";
const DB_VERSION = 1;
const STORE = "_sync_queue";
const MAX_RETRIES = 10;

export interface SyncEntry {
  queueId?: number;
  table: string;
  action: "insert" | "update" | "delete";
  id: any;
  data?: any;
  timestamp: number;
  retries: number;
}

async function getDB() {
  return openDB(DB_NAME, DB_VERSION);
}

export async function enqueue(entry: Omit<SyncEntry, "queueId" | "retries" | "timestamp">): Promise<number> {
  const db = await getDB();
  const row: SyncEntry = { ...entry, timestamp: Date.now(), retries: 0 };
  const queueId = await db.add(STORE, row) as number;
  // Request background sync if available
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const reg = await navigator.serviceWorker.ready;
    try { await (reg as any).sync.register("offline-sync"); } catch { /* silent */ }
  }
  return queueId;
}

export async function dequeue(queueId: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, queueId);
}

export async function getAllPending(): Promise<SyncEntry[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE);
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const db = await getDB();
  const entries: SyncEntry[] = await db.getAll(STORE);
  if (!entries.length) return { processed: 0, failed: 0 };

  // Sort by queueId (FIFO)
  entries.sort((a, b) => (a.queueId || 0) - (b.queueId || 0));

  const supabase = createClient();
  let processed = 0;
  let failed = 0;

  // Map old temp IDs → new real IDs for FK resolution
  const idMap: Record<string, Record<number, number>> = {};

  for (const entry of entries) {
    try {
      let { table, action, id, data } = entry;

      // Resolve temp FKs in data
      if (data && idMap[table]) {
        // nothing for same-table, but cross-table refs:
      }
      // Cross-table FK resolution for task_messages referencing temp task IDs
      if (table === "task_messages" && data?.task_id && data.task_id < 0 && idMap["tasks"]?.[data.task_id]) {
        data = { ...data, task_id: idMap["tasks"][data.task_id] };
      }
      // project_tasks → projects
      if (table === "project_tasks" && data?.project_id && data.project_id < 0 && idMap["projects"]?.[data.project_id]) {
        data = { ...data, project_id: idMap["projects"][data.project_id] };
      }
      // project_budgets → projects
      if (table === "project_budgets" && data?.project_id && data.project_id < 0 && idMap["projects"]?.[data.project_id]) {
        data = { ...data, project_id: idMap["projects"][data.project_id] };
      }

      if (action === "insert") {
        const insertData = { ...data };
        const tempId = id;
        // Remove temp negative ID so Supabase auto-generates
        if (typeof insertData.id === "number" && insertData.id < 0) delete insertData.id;
        const { data: result, error } = await supabase.from(table).insert(insertData).select().single();
        if (error) throw error;
        // Track ID mapping for FK resolution
        if (result && tempId < 0) {
          if (!idMap[table]) idMap[table] = {};
          idMap[table][tempId] = result.id;
        }
      } else if (action === "update") {
        const { error } = await supabase.from(table).update(data).eq("id", id);
        if (error) throw error;
      } else if (action === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
      }

      await dequeue(entry.queueId!);
      processed++;
    } catch (e: any) {
      entry.retries++;
      if (entry.retries >= MAX_RETRIES) {
        // Give up — remove from queue
        await dequeue(entry.queueId!);
        failed++;
      } else {
        // Update retries count
        await db.put(STORE, entry);
        failed++;
      }
    }
  }

  return { processed, failed };
}
