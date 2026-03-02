"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { T, fn } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { Thread } from "@/components/main/Thread";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

function dmKey(a: string, b: string) { return [a, b].sort().join("_"); }

export function DMView({ user, users, dmMsgs, sDmMsgs, dmPeer, sDmPeer, mob, onSendDm }: any) {
  const { colors, isDark, cardBg } = useC();
  const [activePeer, setActivePeer] = useState<string | null>(dmPeer || null);
  const listRef = useRef<HTMLDivElement>(null);

  // If dmPeer changes externally (from Org click), sync it
  useEffect(() => { if (dmPeer) setActivePeer(dmPeer); }, [dmPeer]);

  // Build conversation list from dmMsgs
  const convos = useMemo(() => {
    const map: Record<string, { peerId: string; msgs: any[]; lastMsg: any; unread: number }> = {};
    for (const m of dmMsgs) {
      const peer = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!map[peer]) map[peer] = { peerId: peer, msgs: [], lastMsg: null, unread: 0 };
      map[peer].msgs.push(m);
      map[peer].lastMsg = m;
      if (m.receiver_id === user.id && !m.read) map[peer].unread++;
    }
    return Object.values(map).sort((a, b) => {
      const ta = a.lastMsg?.created_at || "";
      const tb = b.lastMsg?.created_at || "";
      return tb.localeCompare(ta);
    });
  }, [dmMsgs, user.id]);

  // If activePeer was set from Org but has no messages yet, still show
  const peerInList = convos.some(c => c.peerId === activePeer);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (!activePeer) return;
    const unread = dmMsgs.filter((m: any) => m.sender_id === activePeer && m.receiver_id === user.id && !m.read);
    if (unread.length === 0) return;
    const ids = unread.map((m: any) => m.id);
    // Optimistic
    sDmMsgs((prev: any[]) => prev.map(m => ids.includes(m.id) ? { ...m, read: true } : m));
    // Persist
    supabase.from("dm_messages").update({ read: true }).in("id", ids).then(() => {});
  }, [activePeer, dmMsgs, user.id, sDmMsgs]);

  const peerUser = (id: string) => users.find((u: any) => u.id === id);
  const peerName = (id: string) => { const u = peerUser(id); return u ? fn(u) : "Usuario"; };

  // Active chat messages mapped to Thread format
  const chatLog = useMemo(() => {
    if (!activePeer) return [];
    return dmMsgs
      .filter((m: any) => dmKey(m.sender_id, m.receiver_id) === dmKey(user.id, activePeer))
      .map((m: any) => ({ dt: m.created_at || "", uid: m.sender_id, by: m.sender_name || peerName(m.sender_id), act: m.content, t: m.type || "msg" }));
  }, [dmMsgs, activePeer, user.id, users]);

  const handleSend = (txt: string) => {
    if (!activePeer || !txt.trim()) return;
    onSendDm(activePeer, txt.trim());
  };

  const showList = !activePeer || !mob;
  const showChat = !!activePeer;

  const convoList = (
    <div ref={listRef} style={{ width: mob ? "100%" : 280, minWidth: mob ? undefined : 280, borderRight: mob ? "none" : "1px solid " + colors.g2, display: "flex", flexDirection: "column" as const, height: "100%" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid " + colors.g2 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colors.nv }}>Mensajes Directos</h3>
      </div>
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "4px 0" }}>
        {convos.length === 0 && !activePeer && <div style={{ textAlign: "center" as const, color: colors.g4, fontSize: 12, padding: 30 }}>No hay conversaciones aun.<br />Usa el boton en el Organigrama para iniciar una.</div>}
        {convos.map(c => {
          const isActive = activePeer === c.peerId;
          const lastTxt = c.lastMsg?.content || "";
          const lastTime = c.lastMsg?.created_at ? new Date(c.lastMsg.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "";
          return (
            <div key={c.peerId} onClick={() => { setActivePeer(c.peerId); sDmPeer(c.peerId); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: isActive ? (isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.04)") : "transparent", borderLeft: isActive ? "3px solid " + colors.bl : "3px solid transparent" }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: colors.bl + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: colors.bl, flexShrink: 0 }}>{peerName(c.peerId).charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{peerName(c.peerId)}</span>
                  <span style={{ fontSize: 9, color: colors.g4 }}>{lastTime}</span>
                </div>
                <div style={{ fontSize: 11, color: colors.g4, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{lastTxt.slice(0, 40)}</div>
              </div>
              {c.unread > 0 && <span style={{ background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 10, padding: "1px 6px", minWidth: 16, textAlign: "center" as const, lineHeight: "14px" }}>{c.unread}</span>}
            </div>
          );
        })}
        {/* Show active peer entry if no messages yet */}
        {activePeer && !peerInList && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.04)", borderLeft: "3px solid " + colors.bl }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: colors.bl + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: colors.bl, flexShrink: 0 }}>{peerName(activePeer).charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>{peerName(activePeer)}</span>
              <div style={{ fontSize: 11, color: colors.g4, fontStyle: "italic" }}>Nueva conversacion</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const chatPanel = activePeer ? (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, height: "100%" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid " + colors.g2, display: "flex", alignItems: "center", gap: 10 }}>
        {mob && <button onClick={() => { setActivePeer(null); sDmPeer(null); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: colors.nv, padding: "0 4px" }}>←</button>}
        <div style={{ width: 32, height: 32, borderRadius: 16, background: colors.bl + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: colors.bl }}>{peerName(activePeer).charAt(0).toUpperCase()}</div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{peerName(activePeer)}</div><div style={{ fontSize: 10, color: colors.g4 }}>{peerUser(activePeer)?.role || ""}</div></div>
      </div>
      <div style={{ flex: 1, padding: "8px 12px", overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
        <Thread log={chatLog} userId={user.id} onSend={handleSend} users={users} />
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: colors.g4, fontSize: 13 }}>Selecciona una conversacion</div>
  );

  return (
    <div style={{ display: "flex", height: mob ? "calc(100vh - 120px)" : "calc(100vh - 100px)", background: cardBg, borderRadius: 14, border: "1px solid " + colors.g2, overflow: "hidden" }}>
      {mob ? (showChat && activePeer ? chatPanel : convoList) : <>{convoList}{chatPanel}</>}
    </div>
  );
}
