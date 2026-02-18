import { create } from "zustand";

type Setter<T> = (fn: (prev: T[]) => T[]) => void;

interface DataStore {
  // Data slices
  users: any[];
  om: any[];
  peds: any[];
  hitos: any[];
  agendas: any[];
  minutas: any[];
  presu: any[];
  provs: any[];
  reminders: any[];
  projects: any[];
  projTasks: any[];
  taskTemplates: any[];
  projBudgets: any[];
  inventory: any[];
  bookings: any[];
  sponsors: any[];
  dbNotifs: any[];

  // Batch setter (for fetchAll)
  setAll: (data: Partial<Pick<DataStore, "users"|"om"|"peds"|"hitos"|"agendas"|"minutas"|"presu"|"provs"|"reminders"|"projects"|"projTasks"|"taskTemplates"|"projBudgets"|"inventory"|"bookings"|"sponsors"|"dbNotifs">>) => void;

  // Functional setters (same API as useState setters)
  sUs: Setter<any>;
  sOm: Setter<any>;
  sPd: Setter<any>;
  sHi: Setter<any>;
  sAgs: Setter<any>;
  sMins: Setter<any>;
  sPr: Setter<any>;
  sPv: Setter<any>;
  sRems: Setter<any>;
  sProjects: Setter<any>;
  sProjTasks: Setter<any>;
  sTaskTemplates: Setter<any>;
  sProjBudgets: Setter<any>;
  sInventory: Setter<any>;
  sBookings: Setter<any>;
  sSponsors: Setter<any>;
  sDbNotifs: Setter<any>;

  // Reset all data (logout)
  clear: () => void;
}

const empty: any[] = [];

export const useDataStore = create<DataStore>((set) => ({
  users: empty,
  om: empty,
  peds: empty,
  hitos: empty,
  agendas: empty,
  minutas: empty,
  presu: empty,
  provs: empty,
  reminders: empty,
  projects: empty,
  projTasks: empty,
  taskTemplates: empty,
  projBudgets: empty,
  inventory: empty,
  bookings: empty,
  sponsors: empty,
  dbNotifs: empty,

  setAll: (data) => set(data),

  sUs: (fn) => set((s) => ({ users: fn(s.users) })),
  sOm: (fn) => set((s) => ({ om: fn(s.om) })),
  sPd: (fn) => set((s) => ({ peds: fn(s.peds) })),
  sHi: (fn) => set((s) => ({ hitos: fn(s.hitos) })),
  sAgs: (fn) => set((s) => ({ agendas: fn(s.agendas) })),
  sMins: (fn) => set((s) => ({ minutas: fn(s.minutas) })),
  sPr: (fn) => set((s) => ({ presu: fn(s.presu) })),
  sPv: (fn) => set((s) => ({ provs: fn(s.provs) })),
  sRems: (fn) => set((s) => ({ reminders: fn(s.reminders) })),
  sProjects: (fn) => set((s) => ({ projects: fn(s.projects) })),
  sProjTasks: (fn) => set((s) => ({ projTasks: fn(s.projTasks) })),
  sTaskTemplates: (fn) => set((s) => ({ taskTemplates: fn(s.taskTemplates) })),
  sProjBudgets: (fn) => set((s) => ({ projBudgets: fn(s.projBudgets) })),
  sInventory: (fn) => set((s) => ({ inventory: fn(s.inventory) })),
  sBookings: (fn) => set((s) => ({ bookings: fn(s.bookings) })),
  sSponsors: (fn) => set((s) => ({ sponsors: fn(s.sponsors) })),
  sDbNotifs: (fn) => set((s) => ({ dbNotifs: fn(s.dbNotifs) })),

  clear: () => set({
    users: empty,
    om: empty,
    peds: empty,
    hitos: empty,
    agendas: empty,
    minutas: empty,
    presu: empty,
    provs: empty,
    reminders: empty,
    projects: empty,
    projTasks: empty,
    taskTemplates: empty,
    projBudgets: empty,
    inventory: empty,
    bookings: empty,
    sponsors: empty,
    dbNotifs: empty,
  }),
}));
