import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUser } from "@/lib/api/auth";

const BUCKET = "attachments";

const ALLOWED_MIME: Set<string> = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

const ALLOWED_EXT: Set<string> = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "svg",
  "pdf", "doc", "docx", "xls", "xlsx", "csv",
]);

const ALLOWED_FOLDERS: Set<string> = new Set([
  "general", "tasks", "presupuestos", "sponsors", "inventory", "profiles",
]);

const MAX_SIZE = 4 * 1024 * 1024; // 4MB

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await verifyUser(req);
  if ("error" in auth)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Archivo excede 4MB" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Validate extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "Extensión de archivo no permitida" }, { status: 400 });
    }

    // Sanitize folder — prevent path traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!ALLOWED_FOLDERS.has(safeFolder)) {
      return NextResponse.json({ error: "Carpeta no permitida" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const path = `${safeFolder}/${Date.now()}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, path });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
