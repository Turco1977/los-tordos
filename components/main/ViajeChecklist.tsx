"use client";
import { useState, useEffect, useMemo } from "react";
import { useC } from "@/lib/theme-context";

const DATA = [
  { emoji: "🏑", title: "Equipamiento deportivo", color: "#E8F4FD", items: [
    { text: "Palo de hockey", detail: "Verificar tamaño correcto para su altura" },
    { text: "Canilleras", detail: "Par completo, que cubra bien la tibia" },
    { text: "Protector bucal", detail: "Imprescindible — que esté moldeado a su boca" },
    { text: "Guante de hockey", detail: "Mano izquierda (recomendado para nenas)" },
    { text: "Funda para el palo", detail: "Para protegerlo en el micro/auto" },
    { text: "Anteojos deportivos", detail: "Solo si usa anteojos, no llevar los comunes" },
  ]},
  { emoji: "👕", title: "Ropa de partido", color: "#E8F8E8", items: [
    { text: "Camiseta titular del equipo", detail: "La oficial de Los Tordos, limpia" },
    { text: "Camiseta suplente", detail: "Si el equipo la tiene" },
    { text: "Pollera o short de juego", detail: "El oficial del equipo" },
    { text: "Medias de hockey", detail: "2 pares (por si se mojan o rompen)" },
    { text: "Botines / Zapatillas con tapones", detail: "Para césped sintético, no usar los de fútbol" },
    { text: "Calza corta deportiva", detail: "Para usar debajo de la pollera" },
    { text: "Top deportivo / Corpiño", detail: "Si ya lo necesita" },
  ]},
  { emoji: "🧥", title: "Ropa de abrigo y calentamiento", color: "#F3E8FD", items: [
    { text: "Campera o buzo del equipo", detail: "Para entrada en calor y estar en el banco" },
    { text: "Pantalón largo deportivo", detail: "Para antes y después de jugar" },
    { text: "Remera de entrenamiento", detail: "Para calentamiento previo al partido" },
    { text: "Campera de lluvia / Rompeviento", detail: "Siempre llevar, el clima cambia" },
  ]},
  { emoji: "👟", title: "Ropa general y calzado", color: "#FFF0E0", items: [
    { text: "Mudas de ropa interior", detail: "1 por día + 1 extra" },
    { text: "Remeras / Camisetas casuales", detail: "1 por día" },
    { text: "Short o pantalón casual", detail: "Para el hotel y paseos" },
    { text: "Medias comunes", detail: "1 par por día" },
    { text: "Zapatillas para caminar", detail: "Cómodas, no las de juego" },
    { text: "Ojotas / Sandalias", detail: "Para la ducha y el hotel" },
    { text: "Pijama", detail: "1 o 2 según los días de viaje" },
    { text: "Abrigo para la noche", detail: "Buzo o campera por si refresca" },
  ]},
  { emoji: "💇‍♀️", title: "Pelo y accesorios de cancha", color: "#FDE8E8", items: [
    { text: "Colitas de pelo", detail: "Llevar varias de repuesto (se pierden siempre)" },
    { text: "Vinchas / Hebillas", detail: "Para sujetar bien el pelo durante el partido" },
    { text: "Gorra o visera", detail: "Para el sol entre partidos" },
  ]},
  { emoji: "🧴", title: "Higiene y limpieza", color: "#E8F4FD", items: [
    { text: "Shampoo y acondicionador", detail: "Tamaño viaje o sachet" },
    { text: "Jabón o gel de ducha", detail: "" },
    { text: "Desodorante", detail: "" },
    { text: "Cepillo de dientes + Pasta", detail: "" },
    { text: "Peine o cepillo de pelo", detail: "" },
    { text: "Protector solar", detail: "SPF 50+, imprescindible para la cancha" },
    { text: "Toalla", detail: "Chequear si el hotel/alojamiento provee" },
    { text: "Bolsa para ropa sucia", detail: "Una bolsa de residuo sirve perfecto" },
  ]},
  { emoji: "🎒", title: "Varios e imprescindibles", color: "#FFF8E1", items: [
    { text: "DNI original", detail: "Obligatorio para competir y viajar" },
    { text: "Certificado médico", detail: "Fotocopia o foto en el celular del padre/madre" },
    { text: "Carnet de obra social / Prepaga", detail: "Por cualquier emergencia" },
    { text: "Botella de agua reutilizable", detail: "Mínimo 750ml, que cierre bien" },
    { text: "Snacks saludables", detail: "Barras de cereal, frutas, galletitas" },
    { text: "Bolso deportivo", detail: "Que entre todo lo de cancha" },
    { text: "Mochila chica", detail: "Para llevar al día (agua, snacks, abrigo)" },
    { text: "Dinero / Plata para emergencias", detail: "Billete chico por las dudas" },
  ]},
  { emoji: "📱", title: "Entretenimiento y comunicación", color: "#F3E8FD", items: [
    { text: "Celular + Cargador", detail: "Si tiene, para comunicarse con la familia" },
    { text: "Auriculares", detail: "Para el viaje en micro" },
    { text: "Juegos de cartas / Entretenimiento", detail: "UNO, cartas, libros — para el viaje" },
    { text: "Almohada de viaje", detail: "Para el micro si el viaje es largo" },
  ]},
  { emoji: "🩹", title: "Botiquín personal", color: "#FDE8E8", items: [
    { text: "Curitas / Banditas", detail: "Siempre alguna ampolla aparece" },
    { text: "Medicación personal", detail: "Si toma alguna — con indicaciones escritas" },
    { text: "Repelente de insectos", detail: "Según el destino" },
    { text: "Protector labial", detail: "Con filtro solar" },
  ]},
];

const TIPS: Record<number, string> = {
  0: "💡 Tip para papás — Marquen el palo y las canilleras con el nombre de la nena. En los torneos se mezclan los equipos y es fácil perder cosas.",
  5: "☀️ Protector solar — Aplicar 30 min antes de salir a la cancha y reaplicar en el entretiempo. Las nenas se olvidan — pedirle al DT que les recuerde.",
};

const TOTAL = DATA.reduce((s, sec) => s + sec.items.length, 0);

export default function ViajeChecklist({ viajeId }: { viajeId: string }) {
  const { colors, isDark } = useC();
  const key = `viaje-checklist-${viajeId}`;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setChecked(JSON.parse(raw)); else setChecked({}); } catch { setChecked({}); }
  }, [key]);

  const save = (next: Record<string, boolean>) => { setChecked(next); localStorage.setItem(key, JSON.stringify(next)); };
  const toggle = (si: number, ii: number) => { const k = `${si}-${ii}`; save({ ...checked, [k]: !checked[k] }); };
  const reset = () => { if (confirm("¿Reiniciar todo el checklist?")) { setChecked({}); localStorage.removeItem(key); } };

  const doneCount = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);
  const pct = TOTAL ? Math.round(doneCount / TOTAL * 100) : 0;

  return (
    <div style={{ marginTop: 14 }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: colors.nv, marginBottom: 4 }}>
          <span>📋 Checklist de Viaje</span>
          <span>{doneCount}/{TOTAL} ({pct}%)</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: isDark ? colors.g3 : "#E5E7EB", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, width: pct + "%", background: pct === 100 ? colors.gn : `linear-gradient(90deg, ${colors.bl}, ${colors.pr})`, transition: "width .4s ease" }} />
        </div>
      </div>

      {/* Sections */}
      {DATA.map((sec, si) => {
        const secDone = sec.items.filter((_, ii) => checked[`${si}-${ii}`]).length;
        const isOpen = open[si] !== false; // default open
        return (
          <div key={si}>
            <div
              onClick={() => setOpen({ ...open, [si]: !isOpen })}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, background: isDark ? colors.g2 : sec.color, cursor: "pointer", marginBottom: 4, userSelect: "none" }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.nv }}>
                {isOpen ? "▼" : "▶"} {sec.emoji} {sec.title}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: secDone === sec.items.length ? colors.gn : colors.g4 }}>
                {secDone}/{sec.items.length}
              </span>
            </div>
            {isOpen && (
              <div style={{ paddingLeft: 6, marginBottom: 6 }}>
                {sec.items.map((item, ii) => {
                  const k = `${si}-${ii}`;
                  const done = !!checked[k];
                  return (
                    <label key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 6px", cursor: "pointer", borderRadius: 6 }}>
                      <input type="checkbox" checked={done} onChange={() => toggle(si, ii)} style={{ marginTop: 2, accentColor: colors.gn, cursor: "pointer" }} />
                      <div>
                        <div style={{ fontSize: 12, color: colors.nv, fontWeight: 500, textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>{item.text}</div>
                        {item.detail && <div style={{ fontSize: 10, color: colors.g4, marginTop: 1 }}>{item.detail}</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            {/* Tips after sections 0 and 5 */}
            {TIPS[si] && (
              <div style={{ margin: "4px 0 8px", padding: "8px 12px", borderRadius: 8, background: isDark ? colors.bl + "20" : "#FEF9C3", fontSize: 11, color: isDark ? colors.yl : "#92400E", fontWeight: 500, lineHeight: 1.5 }}>
                {TIPS[si]}
              </div>
            )}
          </div>
        );
      })}

      {/* Reset */}
      <div style={{ marginTop: 12, textAlign: "center" as const }}>
        <button onClick={reset} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid " + colors.rd, background: "transparent", color: colors.rd, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          🔄 Reiniciar checklist
        </button>
      </div>
    </div>
  );
}
