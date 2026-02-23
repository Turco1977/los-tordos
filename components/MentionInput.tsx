"use client";
import { useState, useRef } from "react";
import { T, ROLES, fn } from "@/lib/constants";
import { useC } from "@/lib/theme-context";

interface MentionInputProps {
  as?: "input" | "textarea";
  users: any[];
  value: string;
  onChange: (val: string) => void;
  onMentionState?: (open: boolean) => void;
  rows?: number;
  placeholder?: string;
  style?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  className?: string;
  containerStyle?: React.CSSProperties;
}

export function MentionInput({ as = "textarea", users, value, onChange, onMentionState, rows, placeholder, style, onKeyDown, autoFocus, className, containerStyle }: MentionInputProps) {
  const [mentionOpen, sMentionOpen] = useState(false);
  const [mentionQ, sMentionQ] = useState("");
  const [mentionIdx, sMentionIdx] = useState(0);
  const ref = useRef<any>(null);
  const { colors, cardBg } = useC();

  const filtUsers = (users || []).filter((u: any) => fn(u).toLowerCase().includes(mentionQ)).slice(0, 5);

  const setOpen = (open: boolean) => {
    sMentionOpen(open);
    onMentionState?.(open);
  };

  const handleChange = (val: string) => {
    onChange(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx >= 0 && (atIdx === 0 || val[atIdx - 1] === " " || val[atIdx - 1] === "\n")) {
      const q = val.slice(atIdx + 1);
      if (!q.includes(" ") && !q.includes("\n")) {
        setOpen(true);
        sMentionQ(q.toLowerCase());
        sMentionIdx(0);
        return;
      }
    }
    setOpen(false);
  };

  const insertMention = (u: any) => {
    const atIdx = value.lastIndexOf("@");
    const before = value.slice(0, atIdx);
    onChange(before + "@" + fn(u) + " ");
    setOpen(false);
    ref.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionOpen && filtUsers.length > 0) {
      if (e.key === "Escape") { setOpen(false); e.preventDefault(); return; }
      if (e.key === "ArrowDown") { sMentionIdx(i => (i + 1) % filtUsers.length); e.preventDefault(); return; }
      if (e.key === "ArrowUp") { sMentionIdx(i => (i - 1 + filtUsers.length) % filtUsers.length); e.preventDefault(); return; }
      if (e.key === "Enter") { insertMention(filtUsers[mentionIdx]); e.preventDefault(); return; }
    }
    onKeyDown?.(e);
  };

  const El: any = as === "input" ? "input" : "textarea";

  return (
    <div style={{ position: "relative", ...containerStyle }}>
      {mentionOpen && filtUsers.length > 0 && (
        <div style={{ position: "absolute", bottom: "100%", left: 0, background: cardBg || "#fff", border: "1px solid " + colors.g3, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,.1)", maxHeight: 140, overflowY: "auto", zIndex: 10, width: 220, marginBottom: 2 }}>
          {filtUsers.map((u: any, i: number) => (
            <div key={u.id} onClick={() => insertMention(u)} style={{ padding: "6px 10px", fontSize: 11, cursor: "pointer", borderBottom: "1px solid " + colors.g1, fontWeight: 600, color: colors.nv, background: i === mentionIdx ? colors.g1 : "transparent" }}>
              {"\uD83D\uDC64"} {fn(u)} <span style={{ color: colors.g4, fontWeight: 400 }}>({ROLES[u.role]?.l || ""})</span>
            </div>
          ))}
        </div>
      )}
      <El
        ref={ref}
        value={value}
        onChange={(e: any) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        {...(as === "textarea" && rows ? { rows } : {})}
        placeholder={placeholder}
        style={style}
        autoFocus={autoFocus}
        className={className}
      />
    </div>
  );
}

export function renderMentions(text: string) {
  const mentionRx = /@[\w\s]+/g;
  const parts = text.split(mentionRx);
  const mentions = text.match(mentionRx);
  if (mentions) {
    return <>{parts.map((pt: string, i: number) => <span key={i}>{pt}{mentions[i] ? <span style={{ color: T.bl, fontWeight: 700 }}>{mentions[i]}</span> : null}</span>)}</>;
  }
  return text;
}
