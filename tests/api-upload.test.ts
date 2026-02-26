import { describe, it, expect, vi, beforeEach } from "vitest";

// Must use vi.hoisted() because vi.mock is hoisted above variable declarations
const { mockVerifyUser, mockUpload, mockGetPublicUrl } = vi.hoisted(() => ({
  mockVerifyUser: vi.fn(),
  mockUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  verifyUser: (...args: any[]) => mockVerifyUser(...args),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

import { POST } from "@/app/api/upload/route";

function createFormData(fields: Record<string, any>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  return fd;
}

function makeFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  const file = new File([buffer], name, { type });
  // jsdom File may not have arrayBuffer() — polyfill it
  if (!file.arrayBuffer) {
    (file as any).arrayBuffer = () => Promise.resolve(buffer);
  }
  return file;
}

function mockReq(formData: FormData): any {
  return {
    formData: () => Promise.resolve(formData),
    headers: { get: (name: string) => name === "authorization" ? "Bearer valid-token" : null },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyUser.mockResolvedValue({ user: { id: "user-1" } });
  mockUpload.mockResolvedValue({ error: null });
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://storage.example.com/file.jpg" } });
});

describe("POST /api/upload", () => {
  it("returns 401 when not authenticated", async () => {
    mockVerifyUser.mockResolvedValue({ error: "No autorizado", status: 401 });
    const fd = createFormData({ file: makeFile("test.jpg", 100, "image/jpeg") });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file provided", async () => {
    const fd = new FormData();
    const res = await POST(mockReq(fd));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("No file provided");
  });

  it("returns 400 when file exceeds 4MB", async () => {
    const bigFile = makeFile("big.jpg", 5 * 1024 * 1024, "image/jpeg");
    const fd = createFormData({ file: bigFile });
    const res = await POST(mockReq(fd));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/4MB/);
  });

  it("returns 400 for disallowed MIME type (.exe)", async () => {
    const exe = makeFile("virus.exe", 100, "application/x-msdownload");
    const fd = createFormData({ file: exe });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/tipo/i);
  });

  it("returns 400 for disallowed extension", async () => {
    const file = makeFile("script.sh", 100, "image/jpeg");
    const fd = createFormData({ file });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/extensión/i);
  });

  it("returns 400 for path traversal in folder", async () => {
    const file = makeFile("test.jpg", 100, "image/jpeg");
    const fd = createFormData({ file, folder: "../../../etc" });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/carpeta/i);
  });

  it("returns 400 for disallowed folder", async () => {
    const file = makeFile("test.jpg", 100, "image/jpeg");
    const fd = createFormData({ file, folder: "secrets" });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/carpeta/i);
  });

  it("succeeds with valid file and folder", async () => {
    const file = makeFile("photo.jpg", 1000, "image/jpeg");
    const fd = createFormData({ file, folder: "tasks" });
    const res = await POST(mockReq(fd));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.url).toBeDefined();
    expect(json.path).toMatch(/^tasks\//);
  });

  it("succeeds with PDF upload", async () => {
    const file = makeFile("document.pdf", 2000, "application/pdf");
    const fd = createFormData({ file, folder: "general" });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(200);
  });

  it("defaults folder to general when not specified", async () => {
    const file = makeFile("photo.png", 500, "image/png");
    const fd = createFormData({ file });
    const res = await POST(mockReq(fd));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.path).toMatch(/^general\//);
  });

  it("returns 500 when storage upload fails", async () => {
    mockUpload.mockResolvedValue({ error: { message: "Storage full" } });
    const file = makeFile("test.jpg", 100, "image/jpeg");
    const fd = createFormData({ file, folder: "tasks" });
    const res = await POST(mockReq(fd));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Storage full");
  });
});
