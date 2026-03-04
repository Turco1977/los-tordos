/* Load SheetJS (xlsx) from CDN — Turbopack can't bundle the npm package */
let cached: any = null;

export async function loadXLSX(): Promise<any> {
  if (cached) return cached;
  const w = window as any;
  if (w.XLSX) { cached = w.XLSX; return cached; }

  // Strategy 1: script tag
  const err1 = await new Promise<string | null>((resolve) => {
    try {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = () => {
        if (w.XLSX) { cached = w.XLSX; resolve(null); }
        else resolve("Script loaded but XLSX not defined");
      };
      s.onerror = () => resolve("Script tag failed to load");
      document.head.appendChild(s);
    } catch (e: any) { resolve("Script tag error: " + e.message); }
  });
  if (cached) return cached;

  // Strategy 2: fetch + Function (safer than eval, avoids some CSP issues)
  const err2 = await (async () => {
    try {
      const resp = await fetch("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
      if (!resp.ok) return "Fetch failed: " + resp.status;
      const code = await resp.text();
      new Function(code)();
      if (w.XLSX) { cached = w.XLSX; return null; }
      return "Function executed but XLSX not defined";
    } catch (e: any) { return "Fetch/eval error: " + e.message; }
  })();
  if (cached) return cached;

  throw new Error(`xlsx load failed. 1: ${err1}. 2: ${err2}`);
}
