"use client";
import { useC } from "@/lib/theme-context";
import { AST, ASC } from "@/lib/constants";
import { Card } from "@/components/ui";

export function AtencionSocioView({ user, mob }: any) {
  const { colors, isDark, cardBg } = useC();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: mob ? 16 : 19, color: colors.nv, fontWeight: 800 }}>🤝 Atención al Socio</h2>
          <p style={{ margin: 0, fontSize: 11, color: colors.g4 }}>Gestión de deudas, condonaciones y planes de pago</p>
        </div>
      </div>

      {/* KPIs placeholder */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { l: "Becas activas", v: "0", i: "🎓", c: "#10B981" },
          { l: "Casos deuda", v: "0", i: "📊", c: colors.nv },
          { l: "Condonaciones aprobadas", v: "0", i: "✅", c: "#10B981" },
          { l: "Pendientes resolución", v: "0", i: "🟡", c: "#F59E0B" },
        ].map((k, i) => (
          <Card key={i} style={{ padding: mob ? 12 : 14, textAlign: "center" as const }}>
            <div style={{ fontSize: 22 }}>{k.i}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 10, color: colors.g4 }}>{k.l}</div>
          </Card>
        ))}
      </div>

      {/* States reference */}
      <Card style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: colors.nv }}>Estados del flujo</h3>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          {Object.keys(ASC).map(k => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, background: ASC[k].bg, color: ASC[k].c, fontSize: 11, fontWeight: 600 }}>
              {ASC[k].i} {ASC[k].l}
            </span>
          ))}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 12, color: colors.g4, textAlign: "center" as const }}>
          Módulo en construcción. Próximamente: becas aprobadas, gestión de deudores, propuestas de condonación y aprobación SE.
        </p>
      </Card>
    </div>
  );
}
