/**
 * Internal UI types used by the main app (page.tsx).
 * These are the "legacy" shapes with abbreviated keys that the
 * components use. They map from the DB types in supabase/types.ts.
 */

export interface AppUser {
  id: string;
  n: string;          // first_name
  a: string;          // last_name
  role: string;
  dId: number;        // dept_id
  div: string;        // division
  mail: string;       // email
  tel: string;        // phone
}

export interface AppTask {
  id: number;
  div: string;        // division
  cId: string;        // creator_id
  cN: string;         // creator_name
  dId: number;        // dept_id
  tipo: string;
  desc: string;       // description
  fReq: string;       // due_date
  urg: string;        // urgency
  st: string;         // status
  asTo: string | null; // assigned_to
  rG: boolean;        // requires_expense
  eOk: boolean | null; // expense_ok
  resp: string;       // resolution
  cAt: string;        // created_at
  monto: number | null; // amount
  log: AppLogEntry[];
}

export interface AppLogEntry {
  dt: string;         // datetime
  uid: string;        // user_id
  by: string;         // user_name
  act: string;        // content/action
  t: string;          // type ("sys" | "msg")
}

export interface AppOrgMember {
  id: string;
  t: string;          // type ("cd" | "se")
  cargo: string;
  n: string;          // first_name
  a: string;          // last_name
  mail: string;
  tel: string;
}

export interface AppHito {
  id: number;
  fase: string;       // phase
  name: string;
  periodo: string;    // period
  pct: number;
  color: string;
}

export interface AppAgenda {
  id: number;
  type: string;
  areaName: string;
  date: string;
  sections: any[];
  presentes: string[];
  status: string;
  createdAt: string;
}

export interface AppMinuta {
  id: number;
  type: string;
  areaName: string;
  agendaId: number | null;
  date: string;
  horaInicio: string;
  horaCierre: string;
  lugar: string;
  presentes: string[];
  ausentes: string[];
  sections: any[];
  tareas: any[];
  status: string;
  createdAt: string;
}

export interface AppPresu {
  id: number;
  task_id: number;
  proveedor_id: number | null;
  proveedor_nombre: string;
  proveedor_contacto: string;
  descripcion: string;
  monto: number;
  moneda: string;
  archivo_url: string;
  notas: string;
  status: string;
  solicitado_por: string;
  solicitado_at: string;
  recibido_at: string;
  resuelto_por: string;
  resuelto_at: string;
  created_at: string;
}

export interface AppProv {
  id: number;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  rubro: string;
  notas: string;
  created_at: string;
}

export interface AppArea {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface AppDepto {
  id: number;
  name: string;
  aId: number;
}

export interface AppNotification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface ToastMsg {
  msg: string;
  type: "ok" | "err";
}

export interface NavItem {
  k: string;
  l: string;
  sh: boolean;
}

export interface ComputedNotif {
  t: string;
  c: string;
  act?: string;
  filter?: string;
  first?: AppTask;
  link?: string;
  dbId?: number;
}
