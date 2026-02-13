/**
 * Supabase Storage helpers for file uploads.
 * Uses the "attachments" bucket. Create it in Supabase Dashboard:
 *   Storage → New bucket → "attachments" → Public: true
 */

import { createClient } from "@/lib/supabase/client";

const BUCKET = "attachments";

export async function uploadFile(
  file: File,
  folder: string = "general"
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const path = `${folder}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { error: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export function getFileIcon(name: string): string {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "📦";
  return "📎";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
