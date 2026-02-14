/**
 * Supabase Realtime subscription hooks.
 * Subscribe to table changes and auto-refresh data.
 */

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type SubscriptionConfig = {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: () => void;
};

/**
 * Subscribe to realtime changes on one or more tables.
 * Calls the appropriate handler when changes occur.
 * Debounces onChange to prevent rapid-fire refetches.
 */
export function useRealtime(
  configs: SubscriptionConfig[],
  enabled: boolean = true
) {
  const supabase = useRef(createClient());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configsRef = useRef(configs);
  configsRef.current = configs;

  const debouncedOnChange = useCallback((cb: () => void) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(cb, 300);
  }, []);

  useEffect(() => {
    if (!enabled || configsRef.current.length === 0) return;

    const channel = supabase.current.channel("app-realtime");

    configsRef.current.forEach((cfg) => {
      channel.on(
        "postgres_changes" as any,
        {
          event: cfg.event || "*",
          schema: "public",
          table: cfg.table,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT" && cfg.onInsert) {
            cfg.onInsert(payload.new);
          } else if (payload.eventType === "UPDATE" && cfg.onUpdate) {
            cfg.onUpdate(payload.new);
          } else if (payload.eventType === "DELETE" && cfg.onDelete) {
            cfg.onDelete(payload.old);
          }
          if (cfg.onChange) debouncedOnChange(cfg.onChange);
        }
      );
    });

    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.current.removeChannel(channel);
    };
  }, [enabled, debouncedOnChange]);
}
