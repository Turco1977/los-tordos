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
  invMaint: any[];
  invDist: any[];
  bookings: any[];
  sponsors: any[];
  sponMsgs: any[];
  sponDeliveries: any[];
  dbNotifs: any[];
  notifPrefs: any;
  // Phase 2: Hockey
  hkSesiones: any[];
  hkRegistros: any[];
  hkPartidos: any[];
  hkConvocadas: any[];
  hkEventos: any[];
  hkCalendario: any[];

  // Batch setter (for fetchAll)
  setAll: (data: Partial<Pick<DataStore, "users"|"om"|"peds"|"hitos"|"agendas"|"minutas"|"presu"|"provs"|"reminders"|"projects"|"projTasks"|"taskTemplates"|"projBudgets"|"inventory"|"invMaint"|"invDist"|"bookings"|"sponsors"|"sponMsgs"|"sponDeliveries"|"dbNotifs"|"hkSesiones"|"hkRegistros"|"hkPartidos"|"hkConvocadas"|"hkEventos"|"hkCalendario">>) => void;

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
  sInvMaint: Setter<any>;
  sInvDist: Setter<any>;
  sBookings: Setter<any>;
  sSponsors: Setter<any>;
  sSponMsgs: Setter<any>;
  sSponDeliveries: Setter<any>;
  sDbNotifs: Setter<any>;
  sNotifPrefs: (fn: (prev: any) => any) => void;
  // Phase 2
  sHkSesiones: Setter<any>;
  sHkRegistros: Setter<any>;
  sHkPartidos: Setter<any>;
  sHkConvocadas: Setter<any>;
  sHkEventos: Setter<any>;
  sHkCalendario: Setter<any>;

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
  invMaint: empty,
  invDist: empty,
  bookings: empty,
  sponsors: empty,
  sponMsgs: empty,
  sponDeliveries: empty,
  dbNotifs: empty,
  notifPrefs: null,
  hkSesiones: empty,
  hkRegistros: empty,
  hkPartidos: empty,
  hkConvocadas: empty,
  hkEventos: empty,
  hkCalendario: empty,

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
  sInvMaint: (fn) => set((s) => ({ invMaint: fn(s.invMaint) })),
  sInvDist: (fn) => set((s) => ({ invDist: fn(s.invDist) })),
  sBookings: (fn) => set((s) => ({ bookings: fn(s.bookings) })),
  sSponsors: (fn) => set((s) => ({ sponsors: fn(s.sponsors) })),
  sSponMsgs: (fn) => set((s) => ({ sponMsgs: fn(s.sponMsgs) })),
  sSponDeliveries: (fn) => set((s) => ({ sponDeliveries: fn(s.sponDeliveries) })),
  sDbNotifs: (fn) => set((s) => ({ dbNotifs: fn(s.dbNotifs) })),
  sNotifPrefs: (fn) => set((s) => ({ notifPrefs: fn(s.notifPrefs) })),
  sHkSesiones: (fn) => set((s) => ({ hkSesiones: fn(s.hkSesiones) })),
  sHkRegistros: (fn) => set((s) => ({ hkRegistros: fn(s.hkRegistros) })),
  sHkPartidos: (fn) => set((s) => ({ hkPartidos: fn(s.hkPartidos) })),
  sHkConvocadas: (fn) => set((s) => ({ hkConvocadas: fn(s.hkConvocadas) })),
  sHkEventos: (fn) => set((s) => ({ hkEventos: fn(s.hkEventos) })),
  sHkCalendario: (fn) => set((s) => ({ hkCalendario: fn(s.hkCalendario) })),

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
    invMaint: empty,
    invDist: empty,
    bookings: empty,
    sponsors: empty,
    sponMsgs: empty,
    sponDeliveries: empty,
    dbNotifs: empty,
    notifPrefs: null,
    hkSesiones: empty,
    hkRegistros: empty,
    hkPartidos: empty,
    hkConvocadas: empty,
    hkEventos: empty,
    hkCalendario: empty,
  }),
}));
