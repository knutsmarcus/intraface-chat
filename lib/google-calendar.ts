import { google } from "googleapis";

function getOAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

const SLOT_DURATION_MINUTES = 30;
const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 17;
const DAYS_AHEAD = 7;
const CALENDAR_IDS = (process.env.GOOGLE_CALENDAR_IDS ?? "primary").split(",");

export interface TimeSlot {
  start: string; // ISO string
  end: string;
  label: string; // "Mon 28 Apr, 09:00–09:30"
}

export async function getAvailableSlots(): Promise<TimeSlot[]> {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setHours(WORKING_HOURS_START, 0, 0, 0);
  if (now > timeMin) timeMin.setDate(timeMin.getDate() + 1);

  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + DAYS_AHEAD);

  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: CALENDAR_IDS.map((id) => ({ id: id.trim() })),
    },
  });

  const busyPeriods: { start: Date; end: Date }[] = [];
  const calendars = freeBusyResponse.data.calendars ?? {};
  for (const calId of CALENDAR_IDS) {
    const busy = calendars[calId.trim()]?.busy ?? [];
    for (const period of busy) {
      if (period.start && period.end) {
        busyPeriods.push({
          start: new Date(period.start),
          end: new Date(period.end),
        });
      }
    }
  }

  const slots: TimeSlot[] = [];
  const cursor = new Date(timeMin);

  while (cursor < timeMax && slots.length < 20) {
    const dayOfWeek = cursor.getDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(WORKING_HOURS_START, 0, 0, 0);
      continue;
    }

    cursor.setHours(WORKING_HOURS_START, 0, 0, 0);

    while (
      cursor.getHours() < WORKING_HOURS_END &&
      cursor < timeMax &&
      slots.length < 20
    ) {
      const slotEnd = new Date(cursor.getTime() + SLOT_DURATION_MINUTES * 60000);

      if (slotEnd.getHours() <= WORKING_HOURS_END) {
        const overlaps = busyPeriods.some(
          (busy) => cursor < busy.end && slotEnd > busy.start
        );

        if (!overlaps) {
          const label = cursor.toLocaleString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Stockholm",
          }) + "–" + slotEnd.toLocaleString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Stockholm",
          });

          slots.push({
            start: cursor.toISOString(),
            end: slotEnd.toISOString(),
            label,
          });
        }
      }

      cursor.setMinutes(cursor.getMinutes() + SLOT_DURATION_MINUTES);
    }

    cursor.setDate(cursor.getDate() + 1);
    cursor.setHours(WORKING_HOURS_START, 0, 0, 0);
  }

  return slots;
}

export interface BookingDetails {
  visitorName: string;
  visitorEmail: string;
  topic: string;
  slotStart: string;
  slotEnd: string;
}

export async function createMeeting(details: BookingDetails) {
  const auth = getOAuthClient();
  const calendar = google.calendar({ version: "v3", auth });

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: `Meeting with ${details.visitorName} via Intraface.se`,
      description: `Topic: ${details.topic}\n\nBooked via Marcus Hansson's portfolio chatbot at Intraface.se.`,
      start: {
        dateTime: details.slotStart,
        timeZone: "Europe/Stockholm",
      },
      end: {
        dateTime: details.slotEnd,
        timeZone: "Europe/Stockholm",
      },
      attendees: [
        { email: process.env.MARCUS_EMAIL ?? "marcus@intraface.se" },
        { email: details.visitorEmail, displayName: details.visitorName },
      ],
      conferenceData: {
        createRequest: {
          requestId: `intraface-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return {
    eventId: event.data.id,
    meetLink: event.data.conferenceData?.entryPoints?.[0]?.uri ?? null,
    htmlLink: event.data.htmlLink,
  };
}
