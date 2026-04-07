import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// One-time migration: fix bookings that shifted from weekdays to Sunday due to timezone bug
// Moves Sunday bookings back to Thursday (3 days earlier) for future dates
export async function POST() {
  try {
    const admin = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Get all bookings on Sundays from today onward
    const { data: allBookings, error: fetchErr } = await admin
      .from("bookings")
      .select("id, date, title, space_id, start_time")
      .gte("date", today)
      .order("date");

    if (fetchErr) throw new Error(fetchErr.message);
    if (!allBookings || !allBookings.length) {
      return NextResponse.json({ message: "No bookings found", fixed: 0 });
    }

    // Filter only Sunday bookings (day 0)
    const sundayBookings = allBookings.filter((b: any) => {
      const [y, m, d] = b.date.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.getDay() === 0; // Sunday
    });

    if (!sundayBookings.length) {
      return NextResponse.json({ message: "No Sunday bookings to fix", fixed: 0 });
    }

    // Move each Sunday booking back 3 days to Thursday
    const fixes: any[] = [];
    for (const b of sundayBookings) {
      const [y, m, d] = b.date.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - 3); // Sunday -> Thursday
      const newDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

      const { error } = await admin
        .from("bookings")
        .update({ date: newDate })
        .eq("id", b.id);

      if (!error) {
        fixes.push({ id: b.id, title: b.title, from: b.date, to: newDate });
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixes.length} bookings (Sunday -> Thursday)`,
      fixed: fixes.length,
      details: fixes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
