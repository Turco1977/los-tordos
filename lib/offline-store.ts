import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "los-tordos-offline";
const DB_VERSION = 1;

const DATA_TABLES = [
  "profiles","tasks","task_messages","org_members","milestones",
  "agendas","minutas","presupuestos","proveedores","reminders",
  "projects","project_tasks","task_templates","inventory",
  "bookings","sponsors","project_budgets",
] as const;

export type TableName = (typeof DATA_TABLES)[number];

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const t of DATA_TABLES) {
          if (!db.objectStoreNames.contains(t)) db.createObjectStore(t, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("_meta")) db.createObjectStore("_meta", { keyPath: "table" });
        if (!db.objectStoreNames.contains("_sync_queue")) db.createObjectStore("_sync_queue", { keyPath: "queueId", autoIncrement: true });
      },
    });
  }
  return dbPromise;
}

export async function getAll(table: TableName): Promise<any[]> {
  const db = await getDB();
  return db.getAll(table);
}

export async function put(table: TableName, record: any): Promise<void> {
  const db = await getDB();
  await db.put(table, record);
}

export async function del(table: TableName, id: any): Promise<void> {
  const db = await getDB();
  await db.delete(table, id);
}

export async function replaceAll(table: TableName, records: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(table, "readwrite");
  await tx.store.clear();
  for (const r of records) await tx.store.put(r);
  await tx.done;
}

export async function getLastSync(table: TableName): Promise<string | null> {
  const db = await getDB();
  const meta = await db.get("_meta", table);
  return meta?.lastSync ?? null;
}

export async function setLastSync(table: TableName, timestamp: string): Promise<void> {
  const db = await getDB();
  await db.put("_meta", { table, lastSync: timestamp });
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([...DATA_TABLES, "_meta", "_sync_queue"], "readwrite");
  for (const t of DATA_TABLES) await tx.objectStore(t).clear();
  await tx.objectStore("_meta").clear();
  await tx.objectStore("_sync_queue").clear();
  await tx.done;
}

export function isIDBAvailable(): boolean {
  try { return typeof indexedDB !== "undefined"; } catch { return false; }
}
