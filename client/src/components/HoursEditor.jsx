import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "../api";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export default function HoursEditor() {
  const [days, setDays] = useState(null); // 7 rows: { weekday, on, start, end }

  useEffect(() => {
    api.get("/providers/me").then((res) => {
      const saved = res.data.profile.availability;
      setDays(
        WEEKDAYS.map((_, weekday) => {
          const row = saved.find((a) => a.weekday === weekday);
          return {
            weekday,
            on: Boolean(row),
            start: toHHMM(row?.startMin ?? 540),
            end: toHHMM(row?.endMin ?? 1080),
          };
        }),
      );
    });
  }, []);

  function update(index, changes) {
    setDays(days.map((d, i) => (i === index ? { ...d, ...changes } : d)));
  }

  async function save() {
    try {
      const payload = days
        .filter((d) => d.on)
        .map((d) => ({
          weekday: d.weekday,
          startMin: toMin(d.start),
          endMin: toMin(d.end),
        }));
      await api.put("/providers/me/availability", { days: payload });
      toast.success("Working hours saved");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (!days) return <p className="text-muted-foreground">Loading hours…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly working hours</CardTitle>
        <CardDescription>
          Dhaka time. Untick a day to take it off.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {days.map((d, i) => (
          <div
            key={d.weekday}
            className="grid items-center gap-2 sm:grid-cols-[160px_1fr]"
          >
            <div className="flex items-center gap-2">
              {/* shadcn's Checkbox uses onCheckedChange(true/false), not onChange(event) */}
              <Checkbox
                id={`day-${d.weekday}`}
                checked={d.on}
                onCheckedChange={(checked) =>
                  update(i, { on: checked === true })
                }
              />
              <Label htmlFor={`day-${d.weekday}`}>{WEEKDAYS[d.weekday]}</Label>
            </div>
            {d.on ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  step={1800}
                  className="w-32"
                  value={d.start}
                  onChange={(e) => update(i, { start: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  step={1800}
                  className="w-32"
                  value={d.end}
                  onChange={(e) => update(i, { end: e.target.value })}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Day off</span>
            )}
          </div>
        ))}
        <Button className="justify-self-start" onClick={save}>
          Save hours
        </Button>
      </CardContent>
    </Card>
  );
}
