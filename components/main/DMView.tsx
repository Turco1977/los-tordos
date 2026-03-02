"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { T, fn } from "@/lib/constants";
import { useC } from "@/lib/theme-context";
import { MentionInput, renderMentions } from "@/components/MentionInput";
import { Btn } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

function dmKey(a: string, b: string) { return [a, b].sort().join("_"); }

export function DMView({ user, users, dmMsgs, sDmMsgs, dmPeer, sDmPeer, mob, onSendDm, onDeleteDm, onDeleteConvo }: any) {
  const { colors, isDark, cardBg } = useC();
  const [activePeer, setActivePeer] = useState<string | null>(dmPeer || null);
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
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

  // Search: filter all users (excluding self) by name
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    return users.filter((u: any) => u.id !== user.id && fn(u).toLowerCase().includes(q)).slice(0, 10);
  }, [searchQ, users, user.id]);

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

  // Active chat messages mapped to Thread format (with id for delete)
  const chatLog = useMemo(() => {
    if (!activePeer) return [];
    return dmMsgs
      .filter((m: any) => dmKey(m.sender_id, m.receiver_id) === dmKey(user.id, activePeer))
      .map((m: any) => ({ id: m.id, dt: m.created_at || "", uid: m.sender_id, by: m.sender_name || peerName(m.sender_id), act: m.content, t: m.type || "msg" }));
  }, [dmMsgs, activePeer, user.id, users]);

  const handleSend = (txt: string) => {
    if (!activePeer || !txt.trim()) return;
    onSendDm(activePeer, txt.trim());
  };

  const showList = !activePeer || !mob;
  const showChat = !!activePeer;

  const convoList = (
    <div ref={listRef} style={{ width: mob ? "100%" : 280, minWidth: mob ? undefined : 280, borderRight: mob ? "none" : "1px solid " + colors.g2, display: "flex", flexDirection: "column" as const, height: "100%" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid " + colors.g2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: colors.nv }}>Mensajes Directos</h3>
          <button onClick={() => { setShowSearch(!showSearch); setSearchQ(""); }} style={{ background: showSearch ? colors.bl + "15" : colors.g1, border: "1px solid " + (showSearch ? colors.bl : colors.g2), borderRadius: 8, fontSize: 14, cursor: "pointer", color: showSearch ? colors.bl : colors.nv, padding: "4px 10px", fontWeight: 600 }} title="Buscar persona">🔍 Nuevo</button>
        </div>
        {showSearch && <div style={{ position: "relative" }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar por nombre..." autoFocus style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid " + colors.g3, fontSize: 12, outline: "none", boxSizing: "border-box" as const, background: cardBg, color: colors.nv }} />
          {searchResults.length > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: cardBg, border: "1px solid " + colors.g2, borderRadius: 8, marginTop: 2, zIndex: 10, maxHeight: 200, overflowY: "auto" as const, boxShadow: "0 4px 12px rgba(0,0,0,.12)" }}>
            {searchResults.map((u: any) => (
              <div key={u.id} onClick={() => { setActivePeer(u.id); sDmPeer(u.id); setSearchQ(""); setShowSearch(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid " + colors.g2 + "44" }} onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.03)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: colors.bl + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: colors.bl, flexShrink: 0 }}>{fn(u).charAt(0).toUpperCase()}</div>
                <div><div style={{ fontSize: 12, fontWeight: 600, color: colors.nv }}>{fn(u)}</div><div style={{ fontSize: 10, color: colors.g4 }}>{u.role || ""}</div></div>
              </div>
            ))}
          </div>}
          {searchQ.trim() && searchResults.length === 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: cardBg, border: "1px solid " + colors.g2, borderRadius: 8, marginTop: 2, padding: "10px 12px", fontSize: 11, color: colors.g4, textAlign: "center" as const }}>No se encontraron resultados</div>}
        </div>}
      </div>
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "4px 0" }}>
        {convos.length === 0 && !activePeer && !showSearch && <div style={{ textAlign: "center" as const, color: colors.g4, fontSize: 12, padding: 30 }}>No hay conversaciones aun.<br />Busca una persona con 🔍 o usa 💬 en el Organigrama.</div>}
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
              {onDeleteConvo && <button onClick={(e: any) => { e.stopPropagation(); if (confirm("Borrar toda la conversacion con " + peerName(c.peerId) + "?")) { onDeleteConvo(c.peerId); if (activePeer === c.peerId) { setActivePeer(null); sDmPeer(null); } } }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.g4, padding: 2, opacity: 0.3, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.3")} title="Borrar conversacion">🗑️</button>}
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

  const [msg, setMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLog.length]);

  const renderContent = (act: string) => { const m = act.match(/(https?:\/\/\S+)/); if (m) { const parts = act.split(m[1]); return <>{parts[0]}<a href={m[1]} target="_blank" rel="noopener noreferrer" style={{ color: T.bl, textDecoration: "underline", wordBreak: "break-all" as const }}>{m[1]}</a>{parts[1]}</>; } return renderMentions(act); };

  const chatPanel = activePeer ? (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, height: "100%" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid " + colors.g2, display: "flex", alignItems: "center", gap: 10 }}>
        {mob && <button onClick={() => { setActivePeer(null); sDmPeer(null); }} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: colors.nv, padding: "0 4px" }}>←</button>}
        <div style={{ width: 32, height: 32, borderRadius: 16, background: colors.bl + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: colors.bl }}>{peerName(activePeer).charAt(0).toUpperCase()}</div>
        <div><div style={{ fontSize: 13, fontWeight: 700, color: colors.nv }}>{peerName(activePeer)}</div><div style={{ fontSize: 10, color: colors.g4 }}>{peerUser(activePeer)?.role || ""}</div></div>
      </div>
      <div style={{ flex: 1, padding: "8px 12px", overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {chatLog.map((l: any, i: number) => {
          const isMe = l.uid === user.id;
          return (
            <div key={l.id || i} style={{ display: "flex", flexDirection: "column" as const, alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "85%", alignSelf: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ fontSize: 9, color: colors.g4, marginBottom: 2, paddingLeft: 4, paddingRight: 4 }}>{l.by} · {l.dt.slice(5, 16)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexDirection: isMe ? "row-reverse" as const : "row" as const }}>
                <div style={{ background: isMe ? "#DCF8C6" : cardBg, border: "1px solid " + (isMe ? "#B7E89E" : colors.g2), borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "8px 12px", fontSize: 12, color: colors.nv, lineHeight: 1.4 }}>{renderContent(l.act)}</div>
                {isMe && onDeleteDm && <button onClick={() => onDeleteDm(l.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: colors.g4, padding: 2, opacity: 0.4 }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")} title="Borrar mensaje">🗑️</button>}
              </div>
            </div>
          );
        })}
        {chatLog.length === 0 && <div style={{ textAlign: "center" as const, color: colors.g4, fontSize: 12, padding: 20 }}>Sin mensajes aun</div>}
        <div ref={chatEndRef} />
      </div>
      <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderTop: "1px solid " + colors.g2 }}>
        <MentionInput as="input" users={users || []} value={msg} onChange={setMsg} onKeyDown={(e: any) => { if (e.key === "Enter" && msg.trim()) { handleSend(msg.trim()); setMsg(""); } }} placeholder="Escribi un mensaje..." style={{ width: "100%", padding: "8px 12px", borderRadius: 20, border: "1px solid " + colors.g3, fontSize: 12, outline: "none" }} containerStyle={{ flex: 1 }} />
        <button onClick={() => { if (msg.trim()) { handleSend(msg.trim()); setMsg(""); } }} disabled={!msg.trim()} style={{ width: 36, height: 36, borderRadius: 18, background: msg.trim() ? colors.nv : colors.g2, color: "#fff", border: "none", cursor: msg.trim() ? "pointer" : "default", fontSize: 14 }}>➤</button>
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
