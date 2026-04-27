import { getAvailableSlots } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const slots = await getAvailableSlots();
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("available-slots error:", err);
    return NextResponse.json({ error: "Could not fetch availability" }, { status: 500 });
  }
}
