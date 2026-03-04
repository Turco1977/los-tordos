/* Load SheetJS (xlsx) from CDN — Turbopack can't bundle the npm package */
let loadPromise: Promise<any> | null = null;

export async function loadXLSX(): Promise<any> {
  const w = window as any;
  if (w.XLSX) return w.XLSX;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    // Try script tag first
    try {
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        s.onload = () => res();
        s.onerror = () => rej(new Error("CDN blocked"));
        document.head.appendChild(s);
      });
      if (w.XLSX) return w.XLSX;
    } catch { /* fallback */ }
    // Fallback: fetch + eval
    try {
      const resp = await fetch("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
      const code = await resp.text();
      (0, eval)(code);
      if (w.XLSX) return w.XLSX;
    } catch { /* */ }
    loadPromise = null;
    throw new Error("No se pudo cargar el parser de Excel");
  })();
  return loadPromise;
}
