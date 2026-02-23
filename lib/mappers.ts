import type { Profile, Task, TaskMessage } from "@/lib/supabase/types";
import { ROLES, ST, isOD } from "@/lib/constants";

export const profileToUser = (p: Profile) => ({ id: p.id, n: p.first_name, a: p.last_name, role: p.role, dId: p.dept_id, div: p.division, mail: p.email, tel: p.phone, so: (p as any).sort_order || 0 });

export const taskFromDB = (t: Task, msgs: TaskMessage[]) => ({ id: t.id, div: t.division, cId: t.creator_id, cN: t.creator_name, dId: t.dept_id, tipo: t.tipo, tit: t.title || "", desc: t.description, fReq: t.due_date, urg: t.urgency, st: t.status, asTo: t.assigned_to, rG: t.requires_expense, eOk: t.expense_ok, resp: t.resolution, cAt: t.created_at, monto: t.amount, log: msgs.map(m => ({ dt: m.created_at || "", uid: m.user_id, by: m.user_name, act: m.content, t: m.type })) });

export const taskToDB = (p: any): Partial<Task> => ({ division: p.div || "", creator_id: p.cId, creator_name: p.cN, dept_id: p.dId, tipo: p.tipo, title: p.tit || "", description: p.desc, due_date: p.fReq, urgency: p.urg, status: p.st, assigned_to: p.asTo, requires_expense: p.rG, expense_ok: p.eOk, resolution: p.resp, created_at: p.cAt, amount: p.monto });

export const presuFromDB=(p:any)=>({id:p.id,task_id:p.task_id,proveedor_id:p.proveedor_id,proveedor_nombre:p.proveedor_nombre||"",proveedor_contacto:p.proveedor_contacto||"",descripcion:p.descripcion||"",monto:Number(p.monto)||0,moneda:p.moneda||"ARS",archivo_url:p.archivo_url||"",notas:p.notas||"",status:p.status||"solicitado",solicitado_por:p.solicitado_por||"",solicitado_at:p.solicitado_at||"",recibido_at:p.recibido_at||"",resuelto_por:p.resuelto_por||"",resuelto_at:p.resuelto_at||"",is_canje:!!p.is_canje,sponsor_id:p.sponsor_id||null,created_at:p.created_at});

export const presuToDB=(p:any)=>({task_id:p.task_id,proveedor_id:p.proveedor_id||null,proveedor_nombre:p.proveedor_nombre||"",proveedor_contacto:p.proveedor_contacto||"",descripcion:p.descripcion||"",monto:p.monto||0,moneda:p.moneda||"ARS",archivo_url:p.archivo_url||"",notas:p.notas||"",status:p.status||"solicitado",solicitado_por:p.solicitado_por||"",solicitado_at:p.solicitado_at||"",recibido_at:p.recibido_at||"",resuelto_por:p.resuelto_por||"",resuelto_at:p.resuelto_at||"",is_canje:!!p.is_canje,sponsor_id:p.sponsor_id||null});

export const provFromDB=(p:any)=>({id:p.id,nombre:p.nombre||"",contacto:p.contacto||"",email:p.email||"",telefono:p.telefono||"",rubro:p.rubro||"",notas:p.notas||"",created_at:p.created_at});

export const rlv=(role:string)=>ROLES[role]?.lv||0;

export function fmtD(d:string){if(!d)return"–";const p=d.split("-");return p.length===3?p[2]+"/"+p[1]+"/"+p[0]:d;}
