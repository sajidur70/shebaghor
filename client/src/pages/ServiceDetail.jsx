import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, errorMessage } from "../api";
import Stars from "../components/Stars";
import { formatTaka, formatTime, next14Days, dayLabel } from "../utils/format";

export default function ServiceDetail() {
  const { id } = useParams();
  const days = useMemo(() => next14Days(), []);
  const [service, setService] = useState(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(days[0]);
  const [slotsData, setSlotsData] = useState({ date: null, slots: null });

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then((res) => setService(res.data.service))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  useEffect(() => {
    if (!service) return;
    let ignore = false; // the user picked another day before this answer came back
    api
      .get(`/providers/${service.providerId}/slots`, {
        params: { serviceId: service.id, date },
      })
      .then((res) => !ignore && setSlotsData({ date, slots: res.data.slots }))
      .catch((err) => !ignore && setError(errorMessage(err)));
    return () => {
      ignore = true;
    };
  }, [service, date]);

  // The saved slots belong to another day → we're loading the new day.
  const slots = slotsData.date === date ? slotsData.slots : null;

  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!service) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <Badge variant="secondary">{service.category.name}</Badge>
          <CardTitle className="text-2xl">{service.title}</CardTitle>
          <CardDescription>
            by {service.provider.user.name} · {service.area}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Stars
            value={service.provider.ratingAvg}
            count={service.provider.ratingCount}
          />
          <p>{service.description}</p>
          <p className="text-lg font-semibold">
            {formatTaka(service.price)} · {service.durationMin} min
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pick a day</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <Button
                key={d}
                size="sm"
                className="rounded-full"
                variant={d === date ? "default" : "outline"}
                onClick={() => {
                  setDate(d);
                  setSelected(null);
                }}
              >
                {dayLabel(d)}
              </Button>
            ))}
          </div>

          <div className="grid gap-3">
            <h3 className="font-medium">
              Free times{" "}
              <span className="text-sm font-normal text-muted-foreground">
                (Dhaka time)
              </span>
            </h3>
            {!slots && (
              <p className="text-sm text-muted-foreground">Loading slots…</p>
            )}
            {slots?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No free times this day. Try another day.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {slots?.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === selected ? "default" : "outline"}
                  onClick={() => setSelected(s)}
                >
                  {formatTime(s)}
                </Button>
              ))}
            </div>
          </div>
          {/* Day 5: the booking form goes here */}
        </CardContent>
      </Card>
    </div>
  );
}
