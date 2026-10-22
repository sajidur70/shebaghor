export const DHAKA_OFFSET_MIN = 6 * 60; // UTC+6, no daylight saving
const MS_PER_MIN = 60_000;

// ("2026-11-01", 540) → Date for 09:00 Dhaka = 2026-11-01T03:00:00Z
export function dhakaToUtc(dateStr, minutes) {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Date.UTC handles negative/overflowing minutes: 05:00 Dhaka → previous UTC day.
  return new Date(Date.UTC(y, m - 1, d, 0, minutes - DHAKA_OFFSET_MIN));
}

// Date → { dateStr: "2026-11-01", minutes: 540 } in Dhaka time
export function utcToDhaka(date) {
  const shifted = new Date(date.getTime() + DHAKA_OFFSET_MIN * MS_PER_MIN);
  return {
    dateStr: shifted.toISOString().slice(0, 10),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

// 0 = Sunday … 5 = Friday, 6 = Saturday (for a Dhaka calendar date)
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * MS_PER_MIN);
}

// "2026-11-01" ✔   "2026-02-30" ✘   "1/11/2026" ✘
export function isValidDateStr(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10) === s;
}
