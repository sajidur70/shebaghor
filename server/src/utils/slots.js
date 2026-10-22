import { dhakaToUtc, addMinutes } from "./time.js";

// Two ranges overlap when A starts before B ends AND A ends after B starts.
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * PURE function: no database, no clock.
 * @param dateStr     "2026-11-01" (Dhaka calendar date)
 * @param window      { startMin, endMin } or null for a day off
 * @param durationMin length of the service
 * @param bookings    [{ startAt: Date, endAt: Date }] that block time
 * @param now         current time (passed in, so tests can control it)
 * @returns Date[]    free start times in UTC
 */
export function getFreeSlots({
  dateStr,
  window,
  durationMin,
  bookings,
  now,
  stepMin = 30,
}) {
  if (!window) return [];

  const free = [];
  for (
    let m = window.startMin;
    m + durationMin <= window.endMin;
    m += stepMin
  ) {
    const start = dhakaToUtc(dateStr, m);
    const end = addMinutes(start, durationMin);

    if (start <= now) continue; // in the past
    if (bookings.some((b) => overlaps(start, end, b.startAt, b.endAt)))
      continue; // taken

    free.push(start);
  }
  return free;
}
