import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportCSV, exportPDF } from "@/lib/export";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("exportCSV()", () => {
  it("generates CSV with BOM and triggers download", () => {
    let capturedContent = "";
    const origBlob = globalThis.Blob;
    vi.spyOn(globalThis, "Blob" as any).mockImplementation(function(parts: any[]) {
      capturedContent = parts.join("");
      return new origBlob(parts, { type: "text/csv" });
    } as any);

    const mockUrl = "blob:mock-url";
    vi.spyOn(URL, "createObjectURL").mockReturnValue(mockUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const mockA = { href: "", download: "", click: vi.fn() } as any;
    vi.spyOn(document, "createElement").mockReturnValue(mockA);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockA);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockA);

    exportCSV("test", ["Name", "Age"], [["Alice", "30"], ["Bob", "25"]]);

    expect(capturedContent).toContain("\uFEFF"); // BOM
    expect(capturedContent).toContain("Name,Age");
    expect(capturedContent).toContain("Alice,30");
    expect(capturedContent).toContain("Bob,25");
    expect(mockA.click).toHaveBeenCalled();
    expect(mockA.download).toBe("test.csv");
  });

  it("escapes commas and quotes in values", () => {
    let capturedContent = "";
    const origBlob = globalThis.Blob;
    vi.spyOn(globalThis, "Blob" as any).mockImplementation(function(parts: any[]) {
      capturedContent = parts.join("");
      return new origBlob(parts, { type: "text/csv" });
    } as any);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const mockA = { href: "", download: "", click: vi.fn() } as any;
    vi.spyOn(document, "createElement").mockReturnValue(mockA);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockA);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockA);

    exportCSV("test", ["Desc"], [['He said "hello"'], ["A, B, C"]]);

    expect(capturedContent).toContain('"He said ""hello"""');
    expect(capturedContent).toContain('"A, B, C"');
  });
});

describe("exportPDF()", () => {
  it("opens a new window with HTML content", () => {
    let writtenHtml = "";
    const mockWindow = {
      document: {
        write: (html: string) => { writtenHtml = html; },
        close: vi.fn(),
      },
    };
    vi.spyOn(window, "open").mockReturnValue(mockWindow as any);

    exportPDF("Test Report", ["Col1", "Col2"], [["A", "B"]]);

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(writtenHtml).toContain("Test Report");
    expect(writtenHtml).toContain("<th>Col1</th>");
    expect(writtenHtml).toContain("<td>A</td>");
    expect(mockWindow.document.close).toHaveBeenCalled();
  });

  it("escapes HTML entities", () => {
    let writtenHtml = "";
    const mockWindow = {
      document: {
        write: (html: string) => { writtenHtml = html; },
        close: vi.fn(),
      },
    };
    vi.spyOn(window, "open").mockReturnValue(mockWindow as any);

    exportPDF("<script>", ["H&T"], [["a<b"]]);

    expect(writtenHtml).toContain("&lt;script&gt;");
    expect(writtenHtml).toContain("H&amp;T");
    expect(writtenHtml).toContain("a&lt;b");
  });

  it("supports landscape option", () => {
    let writtenHtml = "";
    const mockWindow = {
      document: {
        write: (html: string) => { writtenHtml = html; },
        close: vi.fn(),
      },
    };
    vi.spyOn(window, "open").mockReturnValue(mockWindow as any);

    exportPDF("Title", [], [], { landscape: true });

    expect(writtenHtml).toContain("size: landscape");
  });
});
