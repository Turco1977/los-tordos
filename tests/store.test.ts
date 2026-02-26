import { describe, it, expect, beforeEach } from "vitest";
import { useDataStore } from "@/lib/store";

beforeEach(() => {
  // Reset store to initial state before each test
  useDataStore.getState().clear();
});

describe("Zustand store — initial state", () => {
  it("starts with empty arrays", () => {
    const state = useDataStore.getState();
    expect(state.users).toEqual([]);
    expect(state.peds).toEqual([]);
    expect(state.presu).toEqual([]);
    expect(state.sponsors).toEqual([]);
    expect(state.inventory).toEqual([]);
    expect(state.bookings).toEqual([]);
    expect(state.dbNotifs).toEqual([]);
    expect(state.notifPrefs).toBeNull();
  });
});

describe("setAll — batch setter", () => {
  it("sets multiple slices at once", () => {
    useDataStore.getState().setAll({
      users: [{ id: 1, n: "A" }],
      peds: [{ id: 10, desc: "Task" }],
      presu: [{ id: 20 }],
    });

    const state = useDataStore.getState();
    expect(state.users).toHaveLength(1);
    expect(state.users[0].n).toBe("A");
    expect(state.peds).toHaveLength(1);
    expect(state.presu).toHaveLength(1);
  });

  it("does not affect other slices", () => {
    useDataStore.getState().setAll({ users: [{ id: 1 }] });
    const state = useDataStore.getState();
    expect(state.peds).toEqual([]);
    expect(state.sponsors).toEqual([]);
  });
});

describe("Functional setters", () => {
  it("sUs updates users via function", () => {
    useDataStore.getState().setAll({ users: [{ id: 1, n: "A" }] });
    useDataStore.getState().sUs((prev) => [...prev, { id: 2, n: "B" }]);
    expect(useDataStore.getState().users).toHaveLength(2);
  });

  it("sPd updates peds via function", () => {
    useDataStore.getState().setAll({ peds: [{ id: 1 }, { id: 2 }] });
    useDataStore.getState().sPd((prev) => prev.filter((p: any) => p.id !== 1));
    expect(useDataStore.getState().peds).toHaveLength(1);
    expect(useDataStore.getState().peds[0].id).toBe(2);
  });

  it("sPr updates presu via function", () => {
    useDataStore.getState().sPr(() => [{ id: 100, monto: 5000 }]);
    expect(useDataStore.getState().presu).toHaveLength(1);
    expect(useDataStore.getState().presu[0].monto).toBe(5000);
  });

  it("sDbNotifs updates dbNotifs via function", () => {
    useDataStore.getState().sDbNotifs(() => [{ id: 1, read: false }]);
    useDataStore.getState().sDbNotifs((prev: any[]) =>
      prev.map((n) => (n.id === 1 ? { ...n, read: true } : n))
    );
    expect(useDataStore.getState().dbNotifs[0].read).toBe(true);
  });

  it("sNotifPrefs updates notifPrefs via function", () => {
    useDataStore.getState().sNotifPrefs(() => ({ push_enabled: true, email_task_assign: false }));
    expect(useDataStore.getState().notifPrefs.push_enabled).toBe(true);
    expect(useDataStore.getState().notifPrefs.email_task_assign).toBe(false);
  });

  it("sSponsors updates sponsors", () => {
    useDataStore.getState().sSponsors(() => [{ id: 1, name: "Sponsor A" }]);
    expect(useDataStore.getState().sponsors).toHaveLength(1);
  });

  it("sInventory updates inventory", () => {
    useDataStore.getState().sInventory(() => [{ id: 1, item: "Ball" }]);
    expect(useDataStore.getState().inventory[0].item).toBe("Ball");
  });

  it("sBookings updates bookings", () => {
    useDataStore.getState().sBookings(() => [{ id: 1 }]);
    expect(useDataStore.getState().bookings).toHaveLength(1);
  });
});

describe("clear — reset all data", () => {
  it("resets all slices to empty", () => {
    // Set some data first
    useDataStore.getState().setAll({
      users: [{ id: 1 }],
      peds: [{ id: 2 }],
      presu: [{ id: 3 }],
      sponsors: [{ id: 4 }],
      dbNotifs: [{ id: 5 }],
    });
    useDataStore.getState().sNotifPrefs(() => ({ push_enabled: true }));

    // Verify data exists
    expect(useDataStore.getState().users).toHaveLength(1);

    // Clear
    useDataStore.getState().clear();

    const state = useDataStore.getState();
    expect(state.users).toEqual([]);
    expect(state.peds).toEqual([]);
    expect(state.presu).toEqual([]);
    expect(state.sponsors).toEqual([]);
    expect(state.dbNotifs).toEqual([]);
    expect(state.notifPrefs).toBeNull();
    expect(state.inventory).toEqual([]);
    expect(state.bookings).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.taskTemplates).toEqual([]);
  });
});
