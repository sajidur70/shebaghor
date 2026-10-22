const TZ = "Asia/Dhaka";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  minute: "2-digit",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
});

export const formatTaka = (n) => `৳${Number(n).toLocaleString("en-IN")}`;
export const formatTime = (iso) => timeFmt.format(new Date(iso)); // "2:00 PM"
export const formatDateTime = (iso) => dateTimeFmt.format(new Date(iso)); // "Sat, Nov 7, 2:00 PM"

// The next 14 Dhaka calendar dates as "YYYY-MM-DD"
export function next14Days() {
  const todayDhaka = new Date(Date.now() + 6 * 3600_000)
    .toISOString()
    .slice(0, 10);
  const [y, m, d] = todayDhaka.split("-").map(Number);
  return Array.from({ length: 14 }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10),
  );
}

// "2026-11-07" → "Sat, Nov 7"
export const dayLabel = (dateStr) =>
  dayFmt.format(new Date(`${dateStr}T00:00:00Z`));
