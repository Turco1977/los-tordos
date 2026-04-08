import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// One-time migration: fix bookings that shifted from weekdays to Sunday due to timezone bug
export async function GET() {
  return fix();
}
export async function POST() {
  return fix();
}

async function fix() {
  try {
    const admin = createAdminClient();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { data: allBookings, error: fetchErr } = await admin
      .from("bookings")
      .select("id, date, title, start_time")
      .gte("date", todayStr)
      .order("date");

    if (fetchErr) return NextResponse.json({ error: fetchErr.message, code: fetchErr.code }, { status: 500 });
    if (!allBookings || !allBookings.length) {
      return NextResponse.json({ message: "No bookings found", fixed: 0 });
    }

    // Filter only Sunday bookings (day 0)
    const sundayBookings = allBookings.filter((b: any) => {
      const [y, m, d] = b.date.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.getDay() === 0;
    });

    if (!sundayBookings.length) {
      return NextResponse.json({ message: "No Sunday bookings to fix", fixed: 0, total: allBookings.length });
    }

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
      total: allBookings.length,
      sundayFound: sundayBookings.length,
      details: fixes,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 200) }, { status: 500 });
  }
}
