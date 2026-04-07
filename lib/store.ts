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
  archivos: any[];
  dbNotifs: any[];
  notifPrefs: any;
  viajes: any[];
  rentalConfig: any[];
  dmMsgs: any[];
  dmPeer: string | null;
  torneos: any[];
  torneoHitos: any[];
  torneoClubes: any[];
  fixtures: any[];
  becas: any[];
  asCasos: any[];
  tarifario: any[];
  sponContracts: any[];
  sponPipeline: any[];
  sponContactos: any[];
  sponPropuestas: any[];
  sponPropVotos: any[];
  sponPropMsgs: any[];
  hospInvitaciones: any[];
  sponMateriales: any[];
  sponPagos: any[];
  torneoMsgs: any[];
  projMsgs: any[];
  votaciones: any[];
  votos: any[];

  // Batch setter (for fetchAll)
  setAll: (data: Partial<Pick<DataStore, "users"|"om"|"peds"|"hitos"|"agendas"|"minutas"|"presu"|"provs"|"reminders"|"projects"|"projTasks"|"taskTemplates"|"projBudgets"|"inventory"|"invMaint"|"invDist"|"bookings"|"sponsors"|"sponMsgs"|"sponDeliveries"|"dbNotifs"|"archivos"|"viajes"|"rentalConfig"|"dmMsgs"|"torneos"|"torneoHitos"|"torneoClubes"|"fixtures"|"becas"|"asCasos"|"tarifario"|"sponContracts"|"sponPipeline"|"sponContactos"|"sponPropuestas"|"sponPropVotos"|"sponPropMsgs"|"hospInvitaciones"|"sponMateriales"|"sponPagos"|"torneoMsgs"|"projMsgs"|"votaciones"|"votos">>) => void;

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
  sArchivos: Setter<any>;
  sDbNotifs: Setter<any>;
  sNotifPrefs: (fn: (prev: any) => any) => void;
  sViajes: Setter<any>;
  sRentalConfig: Setter<any>;
  sDmMsgs: Setter<any>;
  sDmPeer: (peer: string | null) => void;
  sTorneos: Setter<any>;
  sTorneoHitos: Setter<any>;
  sTorneoClubes: Setter<any>;
  sFixtures: Setter<any>;
  sBecas: Setter<any>;
  sAsCasos: Setter<any>;
  sTarifario: Setter<any>;
  sSponContracts: Setter<any>;
  sSponPipeline: Setter<any>;
  sSponContactos: Setter<any>;
  sSponPropuestas: Setter<any>;
  sSponPropVotos: Setter<any>;
  sSponPropMsgs: Setter<any>;
  sHospInvitaciones: Setter<any>;
  sSponMateriales: Setter<any>;
  sSponPagos: Setter<any>;
  sTorneoMsgs: Setter<any>;
  sProjMsgs: Setter<any>;
  sVotaciones: Setter<any>;
  sVotos: Setter<any>;

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
  archivos: empty,
  dbNotifs: empty,
  notifPrefs: null,
  viajes: empty,
  rentalConfig: empty,
  dmMsgs: empty,
  dmPeer: null,
  torneos: empty,
  torneoHitos: empty,
  torneoClubes: empty,
  fixtures: empty,
  becas: empty,
  asCasos: empty,
  tarifario: empty,
  sponContracts: empty,
  sponPipeline: empty,
  sponContactos: empty,
  sponPropuestas: empty,
  sponPropVotos: empty,
  sponPropMsgs: empty,
  hospInvitaciones: empty,
  sponMateriales: empty,
  sponPagos: empty,
  torneoMsgs: empty,
  projMsgs: empty,
  votaciones: empty,
  votos: empty,

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
  sArchivos: (fn) => set((s) => ({ archivos: fn(s.archivos) })),
  sDbNotifs: (fn) => set((s) => ({ dbNotifs: fn(s.dbNotifs) })),
  sNotifPrefs: (fn) => set((s) => ({ notifPrefs: fn(s.notifPrefs) })),
  sViajes: (fn) => set((s) => ({ viajes: fn(s.viajes) })),
  sRentalConfig: (fn) => set((s) => ({ rentalConfig: fn(s.rentalConfig) })),
  sDmMsgs: (fn) => set((s) => ({ dmMsgs: fn(s.dmMsgs) })),
  sDmPeer: (peer) => set({ dmPeer: peer }),
  sTorneos: (fn) => set((s) => ({ torneos: fn(s.torneos) })),
  sTorneoHitos: (fn) => set((s) => ({ torneoHitos: fn(s.torneoHitos) })),
  sTorneoClubes: (fn) => set((s) => ({ torneoClubes: fn(s.torneoClubes) })),
  sFixtures: (fn) => set((s) => ({ fixtures: fn(s.fixtures) })),
  sBecas: (fn) => set((s) => ({ becas: fn(s.becas) })),
  sAsCasos: (fn) => set((s) => ({ asCasos: fn(s.asCasos) })),
  sTarifario: (fn) => set((s) => ({ tarifario: fn(s.tarifario) })),
  sSponContracts: (fn) => set((s) => ({ sponContracts: fn(s.sponContracts) })),
  sSponPipeline: (fn) => set((s) => ({ sponPipeline: fn(s.sponPipeline) })),
  sSponContactos: (fn) => set((s) => ({ sponContactos: fn(s.sponContactos) })),
  sSponPropuestas: (fn) => set((s) => ({ sponPropuestas: fn(s.sponPropuestas) })),
  sSponPropVotos: (fn) => set((s) => ({ sponPropVotos: fn(s.sponPropVotos) })),
  sSponPropMsgs: (fn) => set((s) => ({ sponPropMsgs: fn(s.sponPropMsgs) })),
  sHospInvitaciones: (fn) => set((s) => ({ hospInvitaciones: fn(s.hospInvitaciones) })),
  sSponMateriales: (fn) => set((s) => ({ sponMateriales: fn(s.sponMateriales) })),
  sSponPagos: (fn) => set((s) => ({ sponPagos: fn(s.sponPagos) })),
  sTorneoMsgs: (fn) => set((s) => ({ torneoMsgs: fn(s.torneoMsgs) })),
  sProjMsgs: (fn) => set((s) => ({ projMsgs: fn(s.projMsgs) })),
  sVotaciones: (fn) => set((s) => ({ votaciones: fn(s.votaciones) })),
  sVotos: (fn) => set((s) => ({ votos: fn(s.votos) })),

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
    archivos: empty,
    dbNotifs: empty,
    notifPrefs: null,
    viajes: empty,
    rentalConfig: empty,
    dmMsgs: empty,
    dmPeer: null,
    torneos: empty,
    torneoHitos: empty,
    torneoClubes: empty,
    fixtures: empty,
    becas: empty,
    asCasos: empty,
    tarifario: empty,
    sponContracts: empty,
    sponPipeline: empty,
    sponContactos: empty,
    sponPropuestas: empty,
    sponPropVotos: empty,
    sponPropMsgs: empty,
    hospInvitaciones: empty,
    sponMateriales: empty,
    sponPagos: empty,
    torneoMsgs: empty,
    projMsgs: empty,
    votaciones: empty,
    votos: empty,
  }),
}));
