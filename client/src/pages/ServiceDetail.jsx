import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
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
import { Input } from "@/components/ui/input";
import Field from "../components/Field";
import { api, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import Stars from "../components/Stars";
import { formatTaka, formatTime, next14Days, dayLabel } from "../utils/format";

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const days = useMemo(() => next14Days(), []);

  const [service, setService] = useState(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(days[0]);
  const [slots, setSlots] = useState(null);
  const [selected, setSelected] = useState(null);
  const [address, setAddress] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then((res) => setService(res.data.service))
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  // useCallback keeps the same function between renders unless service/date change,
  // so we can safely call it from the effect AND after a 409.
  const loadSlots = useCallback(() => {
    if (!service) return;
    api
      .get(`/providers/${service.providerId}/slots`, {
        params: { serviceId: service.id, date },
      })
      .then((res) => setSlots(res.data.slots))
      .catch((err) => setError(errorMessage(err)));
  }, [service, date]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Clear the old day's slots in the same click, so React renders once.
  function pickDay(d) {
    setDate(d);
    setSlots(null);
    setSelected(null);
  }
  async function book(e) {
    e.preventDefault();
    setBusy(true);
    setBookingError("");
    try {
      await api.post("/bookings", {
        serviceId: service.id,
        startAt: selected,
        address,
      });
      navigate("/bookings");
    } catch (err) {
      setBookingError(errorMessage(err));
      if (err.response?.status === 409) {
        setSelected(null); // the time they picked is gone
        loadSlots(); // someone just took it, show fresh slots
      }
    } finally {
      setBusy(false);
    }
  }

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
                onClick={() => pickDay(d)}
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

          {bookingError && (
            <p className="text-sm text-destructive">{bookingError}</p>
          )}

          {selected && !user && (
            <p className="text-sm">
              <Link
                to="/login"
                state={{ from: `/services/${id}` }}
                className="font-medium text-primary hover:underline"
              >
                Log in
              </Link>{" "}
              as a customer to book {formatTime(selected)}.
            </p>
          )}
          {selected && user && user.role !== "CUSTOMER" && (
            <p className="text-sm text-muted-foreground">
              Only customer accounts can make bookings.
            </p>
          )}
          {selected && user?.role === "CUSTOMER" && (
            <form className="grid max-w-md gap-4" onSubmit={book}>
              <Field label="Service address" id="address">
                <Input
                  id="address"
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, road, area"
                />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Booking…"
                  : `Book ${dayLabel(date)}, ${formatTime(selected)} for ${formatTaka(service.price)}`}
              </Button>
              <p className="text-sm text-muted-foreground">
                The slot is held for you for 15 minutes while you pay.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
