/**
 * Supabase Realtime subscription hooks.
 * Subscribe to table changes and auto-refresh data.
 */

import { useEffect, useRef } from "react";
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
 */
export function useRealtime(
  configs: SubscriptionConfig[],
  enabled: boolean = true
) {
  const supabase = useRef(createClient());

  useEffect(() => {
    if (!enabled || configs.length === 0) return;

    const channel = supabase.current.channel("app-realtime");

    configs.forEach((cfg) => {
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
          if (cfg.onChange) cfg.onChange();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.current.removeChannel(channel);
    };
  }, [enabled, configs.length]);
}
