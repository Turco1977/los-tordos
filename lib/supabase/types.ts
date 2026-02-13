export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  dept_id: number;
  division: string;
  email: string;
  phone: string;
  created_at?: string;
}

export interface OrgMember {
  id: string;
  type: "cd" | "se";
  cargo: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface Task {
  id: number;
  division: string;
  creator_id: string;
  creator_name: string;
  dept_id: number;
  tipo: string;
  description: string;
  due_date: string;
  urgency: string;
  status: string;
  assigned_to: string | null;
  requires_expense: boolean;
  expense_ok: boolean | null;
  resolution: string;
  created_at: string;
  amount: number | null;
}

export interface TaskMessage {
  id?: number;
  task_id: number;
  user_id: string;
  user_name: string;
  content: string;
  type: "sys" | "msg";
  created_at?: string;
}

export interface Milestone {
  id: number;
  phase: string;
  name: string;
  period: string;
  pct: number;
  color: string;
}

export interface Agenda {
  id: number;
  type: string;
  area_name?: string;
  date: string;
  sections: any;
  presentes?: string[];
  status: string;
  created_at?: string;
}

export interface Minuta {
  id: number;
  type: string;
  area_name?: string;
  agenda_id: number | null;
  date: string;
  hora_inicio?: string;
  hora_cierre?: string;
  lugar?: string;
  presentes: string[];
  ausentes: string[];
  sections: any;
  tareas: any;
  status: string;
  created_at?: string;
}

export interface DepStaff {
  id: string;
  user_id: string;
  dep_role: "dd"|"dr"|"entrenador"|"pf"|"coord_pf"|"kinesiologo"|"medico";
  divisions: string[];
  reports_to: string | null;
  active: boolean;
  created_at?: string;
  first_name?: string;
  last_name?: string;
}

export interface DepAthlete {
  id: number;
  first_name: string;
  last_name: string;
  division: string;
  position: string;
  birth_date: string;
  dni: string;
  phone: string;
  email: string;
  emergency_contact: { name?: string; phone?: string; relation?: string };
  medical_info: { blood_type?: string; allergies?: string; conditions?: string };
  photo_url: string;
  season: string;
  active: boolean;
  created_at?: string;
}

export interface DepInjury {
  id: number;
  athlete_id: number;
  reported_by: string;
  type: string;
  zone: string;
  muscle: string;
  severity: "leve" | "moderada" | "grave";
  description: string;
  date_injury: string;
  date_return: string | null;
  status: "activa" | "recuperacion" | "alta";
  notes: string;
  created_at?: string;
  athlete_name?: string;
}

export interface DepCheckin {
  id: number;
  athlete_id: number;
  date: string;
  sleep: number;
  fatigue: number;
  stress: number;
  soreness: number;
  mood: number;
  notes: string;
  recorded_by: string;
  created_at?: string;
  athlete_name?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  rubro: string;
  notas: string;
  created_at?: string;
}

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: "task" | "budget" | "deadline" | "injury" | "info";
  link: string;
  read: boolean;
  created_at?: string;
}

export interface DepTrainingSession {
  id: number;
  division: string;
  date: string;
  time_start: string;
  time_end: string;
  type: string;
  description: string;
  location: string;
  created_by: string;
  created_at?: string;
}

export interface DepAttendance {
  id: number;
  session_id: number;
  athlete_id: number;
  status: "presente" | "ausente" | "tarde" | "justificado";
  notes: string;
  recorded_by: string;
  created_at?: string;
}

export interface Presupuesto {
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
  status: "solicitado" | "recibido" | "aprobado" | "rechazado";
  solicitado_por: string;
  solicitado_at: string;
  recibido_at: string;
  resuelto_por: string;
  resuelto_at: string;
  created_at?: string;
}
