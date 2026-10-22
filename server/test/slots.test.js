import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dhakaToUtc,
  utcToDhaka,
  weekdayOf,
  isValidDateStr,
} from "../src/utils/time.js";
import { getFreeSlots, overlaps } from "../src/utils/slots.js";

const day = "2026-11-01"; // a Sunday
const window = { startMin: 9 * 60, endMin: 12 * 60 }; // 09:00–12:00 Dhaka
const longAgo = new Date("2026-01-01T00:00:00Z"); // "now" far in the past → nothing is skipped

// Date → "09:30" in Dhaka time, so assertions are readable
const hhmm = (date) => {
  const { minutes } = utcToDhaka(date);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

// ── time helpers ───────────────────────────────────────────────
test("09:00 Dhaka is 03:00 UTC", () => {
  assert.equal(dhakaToUtc(day, 540).toISOString(), "2026-11-01T03:00:00.000Z");
});

test("05:00 Dhaka is the PREVIOUS day in UTC", () => {
  assert.equal(dhakaToUtc(day, 300).toISOString(), "2026-10-31T23:00:00.000Z");
});

test("utcToDhaka reverses dhakaToUtc, even across midnight UTC", () => {
  assert.deepEqual(utcToDhaka(dhakaToUtc(day, 300)), {
    dateStr: day,
    minutes: 300,
  });
});

test("weekdayOf: Sunday is 0, Friday is 5", () => {
  assert.equal(weekdayOf("2026-11-01"), 0);
  assert.equal(weekdayOf("2026-11-06"), 5);
});

test("isValidDateStr rejects impossible dates", () => {
  assert.equal(isValidDateStr("2026-11-01"), true);
  assert.equal(isValidDateStr("2026-02-30"), false);
  assert.equal(isValidDateStr("1/11/2026"), false);
});

// ── overlap ────────────────────────────────────────────────────
test("touching ranges do not overlap (10–11 and 11–12)", () => {
  const t = (min) => dhakaToUtc(day, min);
  assert.equal(overlaps(t(600), t(660), t(660), t(720)), false);
  assert.equal(overlaps(t(600), t(660), t(630), t(690)), true);
});

// ── slot calculator ────────────────────────────────────────────
test("empty day: every 30-min start that fits", () => {
  const slots = getFreeSlots({
    dateStr: day,
    window,
    durationMin: 60,
    bookings: [],
    now: longAgo,
  });
  assert.deepEqual(slots.map(hhmm), [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
  ]);
});

test("a booking 10:00–11:00 removes every overlapping start", () => {
  const bookings = [
    { startAt: dhakaToUtc(day, 600), endAt: dhakaToUtc(day, 660) },
  ];
  const slots = getFreeSlots({
    dateStr: day,
    window,
    durationMin: 60,
    bookings,
    now: longAgo,
  });
  assert.deepEqual(slots.map(hhmm), ["09:00", "11:00"]);
});

test("day off returns no slots", () => {
  assert.deepEqual(
    getFreeSlots({
      dateStr: day,
      window: null,
      durationMin: 60,
      bookings: [],
      now: longAgo,
    }),
    [],
  );
});

test("slots in the past are skipped", () => {
  const now = dhakaToUtc(day, 600); // it is 10:00 Dhaka right now
  const slots = getFreeSlots({
    dateStr: day,
    window,
    durationMin: 60,
    bookings: [],
    now,
  });
  assert.deepEqual(slots.map(hhmm), ["10:30", "11:00"]);
});

test("early-morning window that starts on the previous UTC day", () => {
  const early = { startMin: 5 * 60, endMin: 7 * 60 }; // 05:00–07:00 Dhaka
  const slots = getFreeSlots({
    dateStr: day,
    window: early,
    durationMin: 60,
    bookings: [],
    now: longAgo,
  });
  assert.equal(slots[0].toISOString(), "2026-10-31T23:00:00.000Z");
  assert.deepEqual(slots.map(hhmm), ["05:00", "05:30", "06:00"]);
});
