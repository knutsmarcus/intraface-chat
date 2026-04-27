"use client";

import { useEffect, useState } from "react";

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

interface MeetingBookingFormProps {
  onBooked: (confirmationMessage: string) => void;
}

export default function MeetingBookingForm({ onBooked }: MeetingBookingFormProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/available-slots")
      .then((r) => r.json())
      .then((data) => {
        if (data.slots) setSlots(data.slots);
        else setSlotsError(true);
      })
      .catch(() => setSlotsError(true))
      .finally(() => setLoadingSlots(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !name || !email) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/book-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: name,
          visitorEmail: email,
          topic,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      const meetLine = data.meetLink ? `\n\nGoogle Meet link: ${data.meetLink}` : "";
      onBooked(
        `Your meeting is confirmed! 🎉\n\n📅 ${selectedSlot.label}\n📧 A calendar invite has been sent to ${email}.${meetLine}\n\nLooking forward to talking with you, ${name}!`
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm p-5 max-w-[80%] text-sm shadow-sm">
      <p className="font-semibold text-gray-900 mb-4">Book a meeting with Marcus</p>

      {loadingSlots && (
        <p className="text-gray-400 text-xs">Checking Marcus&apos;s availability...</p>
      )}

      {slotsError && (
        <p className="text-red-500 text-xs">
          Could not load available times right now. Please email marcus@intraface.se directly.
        </p>
      )}

      {!loadingSlots && !slotsError && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Slot picker */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Available times (next 7 days)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                    selectedSlot?.start === slot.start
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gray-400"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gray-400"
                placeholder="jane@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              What would you like to discuss? (optional)
            </label>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gray-400 resize-none"
              placeholder="Role discussion, portfolio review, general intro..."
            />
          </div>

          {submitError && (
            <p className="text-red-500 text-xs">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={!selectedSlot || !name || !email || submitting}
            className="w-full bg-gray-900 text-white text-xs font-medium py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Booking..." : "Confirm meeting"}
          </button>
        </form>
      )}
    </div>
  );
}
