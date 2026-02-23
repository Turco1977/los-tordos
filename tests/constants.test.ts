import { describe, it, expect } from "vitest";
import { T, TD, AREAS, DEPTOS, ROLES, RK, DIV, TIPOS, ST, SC, fn, isOD, daysDiff, PST, PSC, MONEDAS, RUBROS, DEP_ROLES, DEP_POSITIONS, DEP_DIV } from "@/lib/constants";

describe("Theme colors", () => {
  it("T has all required color keys", () => {
    expect(T).toHaveProperty("nv");
    expect(T).toHaveProperty("rd");
    expect(T).toHaveProperty("g1");
    expect(T).toHaveProperty("g2");
    expect(T).toHaveProperty("g3");
    expect(T).toHaveProperty("g4");
    expect(T).toHaveProperty("g5");
    expect(T).toHaveProperty("gn");
    expect(T).toHaveProperty("yl");
    expect(T).toHaveProperty("bl");
    expect(T).toHaveProperty("pr");
  });

  it("TD has matching keys for dark mode", () => {
    const tKeys = Object.keys(T).sort();
    const tdKeys = Object.keys(TD).sort();
    expect(tdKeys).toEqual(tKeys);
  });

  it("all color values are valid hex", () => {
    const hexRe = /^#[0-9A-Fa-f]{6}$/;
    for (const v of Object.values(T)) expect(v).toMatch(hexRe);
    for (const v of Object.values(TD)) expect(v).toMatch(hexRe);
  });
});

describe("AREAS & DEPTOS", () => {
  it("AREAS has unique ids", () => {
    const ids = AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("DEPTOS all reference valid area ids", () => {
    const areaIds = new Set(AREAS.map((a) => a.id));
    for (const d of DEPTOS) {
      expect(areaIds.has(d.aId)).toBe(true);
    }
  });

  it("DEPTOS has unique ids", () => {
    const ids = DEPTOS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("ROLES", () => {
  it("RK matches ROLES keys", () => {
    expect(RK.sort()).toEqual(Object.keys(ROLES).sort());
  });

  it("each role has label, icon, and level", () => {
    for (const r of Object.values(ROLES)) {
      expect(r).toHaveProperty("l");
      expect(r).toHaveProperty("i");
      expect(r).toHaveProperty("lv");
      expect(r.lv).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("fn() - full name formatter", () => {
  it("combines first_name and last_name", () => {
    expect(fn({ first_name: "Juan", last_name: "Perez" })).toBe("Juan Perez");
  });

  it("falls back to n/a keys", () => {
    expect(fn({ n: "Carlos", a: "Lopez" })).toBe("Carlos Lopez");
  });

  it("handles missing fields", () => {
    expect(fn({})).toBe(" ");
    expect(fn({ first_name: "Ana" })).toBe("Ana ");
  });
});

describe("isOD() - overdue check", () => {
  it("returns true for past dates", () => {
    expect(isOD("2020-01-01")).toBe(true);
  });

  it("returns false for future dates", () => {
    expect(isOD("2099-12-31")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isOD("")).toBe(false);
  });
});

describe("daysDiff()", () => {
  it("calculates positive difference", () => {
    expect(daysDiff("2024-01-01", "2024-01-11")).toBe(10);
  });

  it("returns 0 for same dates", () => {
    expect(daysDiff("2024-06-15", "2024-06-15")).toBe(0);
  });

  it("returns negative for reversed dates", () => {
    expect(daysDiff("2024-01-11", "2024-01-01")).toBe(-10);
  });
});

describe("Status constants", () => {
  it("ST has expected statuses", () => {
    expect(ST.P).toBe("pend");
    expect(ST.C).toBe("curso");
    expect(ST.E).toBe("emb");
    expect(ST.V).toBe("valid");
    expect(ST.OK).toBe("ok");
  });

  it("SC has config for each ST value", () => {
    for (const v of Object.values(ST)) {
      expect(SC).toHaveProperty(v);
      expect(SC[v]).toHaveProperty("l");
      expect(SC[v]).toHaveProperty("c");
      expect(SC[v]).toHaveProperty("bg");
      expect(SC[v]).toHaveProperty("i");
    }
  });

  it("PST has expected presupuesto statuses", () => {
    expect(PST.SOL).toBe("solicitado");
    expect(PST.REC).toBe("recibido");
    expect(PST.APR).toBe("aprobado");
    expect(PST.RECH).toBe("rechazado");
  });

  it("PSC has config for each PST value", () => {
    for (const v of Object.values(PST)) {
      expect(PSC).toHaveProperty(v);
    }
  });
});

describe("Deportivo constants", () => {
  it("DEP_ROLES has valid structure", () => {
    for (const r of Object.values(DEP_ROLES)) {
      expect(r).toHaveProperty("l");
      expect(r).toHaveProperty("i");
      expect(r).toHaveProperty("lv");
    }
  });

  it("DEP_POSITIONS has 13 rugby positions", () => {
    expect(DEP_POSITIONS.length).toBe(13);
  });

  it("DEP_DIV has M19", () => {
    expect(DEP_DIV).toContain("M19");
  });
});

describe("Other constants", () => {
  it("DIV has divisions", () => {
    expect(DIV.length).toBeGreaterThan(0);
    expect(DIV).toContain("Plantel Superior");
  });

  it("TIPOS has task types", () => {
    expect(TIPOS.length).toBeGreaterThan(0);
  });

  it("MONEDAS has ARS and USD", () => {
    expect(MONEDAS).toContain("ARS");
    expect(MONEDAS).toContain("USD");
  });

  it("RUBROS has at least one rubro", () => {
    expect(RUBROS.length).toBeGreaterThan(0);
  });
});
