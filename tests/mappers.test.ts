import { describe, it, expect } from "vitest";
import { profileToUser, taskFromDB, taskToDB, presuFromDB, presuToDB, provFromDB, rlv, fmtD } from "@/lib/mappers";

describe("profileToUser", () => {
  it("maps Profile fields to compact user object", () => {
    const profile = {
      id: "abc-123",
      first_name: "Juan",
      last_name: "Perez",
      role: "admin",
      dept_id: 2,
      division: "Plantel Superior",
      email: "juan@test.com",
      phone: "123456",
    };
    const result = profileToUser(profile as any);
    expect(result.id).toBe("abc-123");
    expect(result.n).toBe("Juan");
    expect(result.a).toBe("Perez");
    expect(result.role).toBe("admin");
    expect(result.dId).toBe(2);
    expect(result.div).toBe("Plantel Superior");
    expect(result.mail).toBe("juan@test.com");
    expect(result.tel).toBe("123456");
  });

  it("handles missing optional fields", () => {
    const profile = { id: "x", first_name: "", last_name: "", role: "usuario", dept_id: 1, division: "", email: "", phone: "" };
    const result = profileToUser(profile as any);
    expect(result.id).toBe("x");
    expect(result.so).toBe(0);
  });
});

describe("taskFromDB", () => {
  it("maps Task + messages to compact format", () => {
    const task = {
      id: 42,
      division: "Juveniles",
      creator_id: "c1",
      creator_name: "Ana Lopez",
      dept_id: 3,
      tipo: "Logística",
      title: "Comprar pelotas",
      description: "Necesitamos 10 pelotas",
      due_date: "2024-06-15",
      urgency: "Alta",
      status: "pend",
      assigned_to: "u2",
      requires_expense: true,
      expense_ok: null,
      resolution: "",
      created_at: "2024-06-01",
      amount: 5000,
    };
    const msgs = [
      { created_at: "2024-06-01T10:00", user_id: "c1", user_name: "Ana", content: "Creó tarea", type: "sys" },
    ];

    const result = taskFromDB(task as any, msgs as any);
    expect(result.id).toBe(42);
    expect(result.div).toBe("Juveniles");
    expect(result.cN).toBe("Ana Lopez");
    expect(result.tit).toBe("Comprar pelotas");
    expect(result.desc).toBe("Necesitamos 10 pelotas");
    expect(result.urg).toBe("Alta");
    expect(result.st).toBe("pend");
    expect(result.rG).toBe(true);
    expect(result.monto).toBe(5000);
    expect(result.log).toHaveLength(1);
    expect(result.log[0].by).toBe("Ana");
    expect(result.log[0].t).toBe("sys");
  });

  it("handles empty messages array", () => {
    const task = { id: 1, division: "", creator_id: "", creator_name: "", dept_id: 1, tipo: "", title: "", description: "", due_date: "", urgency: "", status: "pend", assigned_to: null, requires_expense: false, expense_ok: null, resolution: "", created_at: "", amount: null };
    const result = taskFromDB(task as any, []);
    expect(result.log).toEqual([]);
  });
});

describe("taskToDB — roundtrip", () => {
  it("converts compact format back to DB format", () => {
    const compact = { div: "Senior", cId: "c1", cN: "Ana", dId: 2, tipo: "Administrativo", tit: "Test", desc: "Description", fReq: "2024-12-01", urg: "Normal", st: "curso", asTo: "u1", rG: false, eOk: null, resp: "Done", cAt: "2024-01-01", monto: 100 };
    const db = taskToDB(compact);
    expect(db.division).toBe("Senior");
    expect(db.creator_id).toBe("c1");
    expect(db.title).toBe("Test");
    expect(db.description).toBe("Description");
    expect(db.status).toBe("curso");
    expect(db.amount).toBe(100);
  });
});

describe("presuFromDB", () => {
  it("maps presupuesto with defaults for missing fields", () => {
    const raw = { id: 10, task_id: 5, proveedor_id: null, monto: "15000.50", created_at: "2024-01-01" };
    const result = presuFromDB(raw);
    expect(result.id).toBe(10);
    expect(result.monto).toBe(15000.5);
    expect(result.moneda).toBe("ARS");
    expect(result.status).toBe("solicitado");
    expect(result.proveedor_nombre).toBe("");
    expect(result.is_canje).toBe(false);
  });

  it("parses is_canje correctly", () => {
    const raw = { id: 1, task_id: 1, is_canje: true, monto: 0, created_at: "" };
    expect(presuFromDB(raw).is_canje).toBe(true);
  });
});

describe("presuToDB", () => {
  it("maps compact format to DB fields with defaults", () => {
    const result = presuToDB({ task_id: 3, monto: 500, moneda: "USD" });
    expect(result.task_id).toBe(3);
    expect(result.monto).toBe(500);
    expect(result.moneda).toBe("USD");
    expect(result.status).toBe("solicitado");
    expect(result.proveedor_nombre).toBe("");
  });
});

describe("provFromDB", () => {
  it("maps proveedor from DB", () => {
    const raw = { id: 7, nombre: "Proveedor X", contacto: "Juan", email: "x@x.com", telefono: "123", rubro: "Deportes", notas: "", created_at: "2024-01-01" };
    const result = provFromDB(raw);
    expect(result.id).toBe(7);
    expect(result.nombre).toBe("Proveedor X");
    expect(result.rubro).toBe("Deportes");
  });

  it("defaults empty strings for missing fields", () => {
    const result = provFromDB({ id: 1 });
    expect(result.nombre).toBe("");
    expect(result.email).toBe("");
  });
});

describe("rlv — role level", () => {
  it("returns level for valid roles", () => {
    expect(rlv("superadmin")).toBeGreaterThan(rlv("admin"));
    expect(rlv("admin")).toBeGreaterThan(rlv("usuario"));
  });

  it("returns 0 for unknown role", () => {
    expect(rlv("hacker")).toBe(0);
    expect(rlv("")).toBe(0);
  });
});

describe("fmtD — date formatter", () => {
  it("converts YYYY-MM-DD to DD/MM/YYYY", () => {
    expect(fmtD("2024-06-15")).toBe("15/06/2024");
  });

  it("returns dash for empty string", () => {
    expect(fmtD("")).toBe("–");
  });

  it("returns original string if not in expected format", () => {
    expect(fmtD("invalid")).toBe("invalid");
  });

  it("handles single-digit day/month", () => {
    expect(fmtD("2024-01-05")).toBe("05/01/2024");
  });
});
