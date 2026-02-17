"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import * as store from "@/lib/offline-store";
import { enqueue, processQueue, getPendingCount, type SyncEntry } from "@/lib/sync-queue";
import { createClient } from "@/lib/supabase/client";
import type { TableName } from "@/lib/offline-store";

const supabase = createClient();

export interface OfflineState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

// Setter map: table → React setState function
export type CacheSetters = Record<string, (d: any[]) => void>;

// Raw results from fetchAll: table → raw Supabase rows (snake_case)
export type RawResults = Record<string, any[]>;

export function useOfflineData(user: any) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const syncInProgress = useRef(false);
  const idbAvailable = useRef(store.isIDBAvailable());

  // Online/offline detection
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Update pending count periodically
  useEffect(() => {
    if (!idbAvailable.current) return;
    const refresh = async () => { try { setPendingCount(await getPendingCount()); } catch {} };
    refresh();
    const iv = setInterval(refresh, 5000);
    return () => clearInterval(iv);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user && idbAvailable.current) {
      sync();
    }
  }, [isOnline, user]);

  // Listen for SW background sync message
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data === "TRIGGER_SYNC") sync();
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // Load from IndexedDB cache into React state
  const loadFromCache = useCallback(async (setters: CacheSetters) => {
    if (!idbAvailable.current) { setCacheLoaded(true); return; }
    try {
      const tables = Object.keys(setters) as TableName[];
      const results = await Promise.all(tables.map(t => store.getAll(t)));
      tables.forEach((t, i) => {
        if (results[i].length > 0) setters[t](results[i]);
      });
    } catch { /* IndexedDB not available or empty */ }
    setCacheLoaded(true);
  }, []);

  // Save raw Supabase results to IndexedDB
  const saveToCache = useCallback(async (rawResults: RawResults) => {
    if (!idbAvailable.current) return;
    try {
      const tables = Object.keys(rawResults) as TableName[];
      await Promise.all(
        tables.map(t =>
          rawResults[t]?.length >= 0
            ? store.replaceAll(t, rawResults[t])
            : Promise.resolve()
        )
      );
      const now = new Date().toISOString();
      await Promise.all(tables.map(t => store.setLastSync(t, now)));
      setLastSyncTime(now);
    } catch { /* silent */ }
  }, []);

  // Mutate: write locally + Supabase (or queue if offline)
  const offlineMutate = useCallback(async (
    table: TableName,
    action: "insert" | "update" | "delete",
    id: any,
    data?: any
  ): Promise<{ tempId?: number; realId?: number }> => {
    if (!idbAvailable.current) {
      // Fallback: just call Supabase directly
      return directSupabase(table, action, id, data);
    }

    if (action === "insert") {
      const tempId = -Date.now();
      const record = { ...data, id: tempId };
      await store.put(table, record);
      await enqueue({ table, action, id: tempId, data });
      refreshPendingCount();
      return { tempId };
    }

    if (action === "update") {
      // Update local cache
      try {
        const existing = await store.getAll(table);
        const item = existing.find((r: any) => r.id === id);
        if (item) await store.put(table, { ...item, ...data });
      } catch {}
    }

    if (action === "delete") {
      try { await store.del(table, id); } catch {}
    }

    // Try Supabase if online
    if (isOnline) {
      try {
        return await directSupabase(table, action, id, data);
      } catch {
        // Failed — enqueue
        await enqueue({ table, action, id, data });
        refreshPendingCount();
        return {};
      }
    } else {
      // Offline — enqueue
      await enqueue({ table, action, id, data });
      refreshPendingCount();
      return {};
    }
  }, [isOnline]);

  // Process sync queue
  const sync = useCallback(async () => {
    if (!idbAvailable.current || syncInProgress.current) return { processed: 0, failed: 0 };
    syncInProgress.current = true;
    setIsSyncing(true);
    try {
      const result = await processQueue();
      setPendingCount(await getPendingCount());
      setLastSyncTime(new Date().toISOString());
      // Notify SW
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage("SYNC_COMPLETE");
      }
      return result;
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, []);

  const refreshPendingCount = async () => {
    try { setPendingCount(await getPendingCount()); } catch {}
  };

  const offlineState: OfflineState = { isOnline, pendingCount, isSyncing, lastSyncTime };

  return {
    offlineState,
    loadFromCache,
    saveToCache,
    offlineMutate,
    sync,
    cacheLoaded,
  };
}

// Direct Supabase call (when online and no queue needed)
async function directSupabase(
  table: string,
  action: "insert" | "update" | "delete",
  id: any,
  data?: any
): Promise<{ tempId?: number; realId?: number }> {
  if (action === "insert") {
    const insertData = { ...data };
    if (typeof insertData.id === "number" && insertData.id < 0) delete insertData.id;
    const { data: result, error } = await supabase.from(table).insert(insertData).select().single();
    if (error) throw error;
    return { realId: result?.id };
  }
  if (action === "update") {
    const { error } = await supabase.from(table).update(data).eq("id", id);
    if (error) throw error;
  }
  if (action === "delete") {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
  }
  return {};
}
