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
