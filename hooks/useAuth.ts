"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { profileToUser } from "@/lib/mappers";
import { useDataStore } from "@/lib/store";
import { clearAll as clearOfflineDB } from "@/lib/offline-store";

const supabase = createClient();

export function useAuth() {
  const { clear: clearStore } = useDataStore();
  const [user, sU] = useState<any>(null);
  const [authChecked, sAuthChecked] = useState(false);
  const [showPw, sShowPw] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (profile) sU(profileToUser(profile));
      }
      sAuthChecked(true);
    })();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    try { await clearOfflineDB(); } catch {}
    clearStore();
    sU(null);
  }, [clearStore]);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  }, []);

  const isAd = user && (user.role === "admin" || user.role === "superadmin");
  const isSA = user && user.role === "superadmin";
  const isPersonal = user && (user.role === "enlace" || user.role === "manager" || user.role === "usuario");

  return {
    user, sU,
    authChecked,
    showPw, sShowPw,
    logout, getToken,
    isAd, isSA, isPersonal,
  };
}
