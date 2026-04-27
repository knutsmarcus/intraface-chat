import { createMeeting, BookingDetails } from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body: BookingDetails = await req.json();

    if (!body.visitorName || !body.visitorEmail || !body.slotStart || !body.slotEnd) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await createMeeting(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("book-meeting error:", err);
    return NextResponse.json({ error: "Could not create meeting" }, { status: 500 });
  }
}
