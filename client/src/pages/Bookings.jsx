import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusBadge from "../components/StatusBadge";
import { api, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, formatTaka } from "../utils/format";

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const isCustomer = user.role === "CUSTOMER";

  const load = () =>
    api
      .get("/bookings/me")
      .then((res) => setBookings(res.data.bookings))
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    load();
  }, []);

  async function run(action) {
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const cancel = (b) =>
    confirm("Cancel this booking?") &&
    run(() => api.patch(`/bookings/${b.id}/cancel`));
  const complete = (b) => run(() => api.patch(`/bookings/${b.id}/complete`));

  if (!bookings) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {isCustomer ? "My bookings" : "My jobs"}
      </h1>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {bookings.length === 0 && (
        <p className="text-muted-foreground">Nothing here yet.</p>
      )}

      {bookings.map((b) => {
        const future = new Date(b.startAt) > new Date();
        const other = isCustomer ? b.provider.user : b.customer;
        return (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle>{b.service.title}</CardTitle>
              <CardAction>
                <StatusBadge status={b.status} />
              </CardAction>
              <CardDescription>
                {formatDateTime(b.startAt)} · {b.service.durationMin} min ·{" "}
                {formatTaka(b.price)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1 text-sm text-muted-foreground">
                <p>
                  {isCustomer ? "Provider" : "Customer"}: {other.name}{" "}
                  {other.phone && `· ${other.phone}`}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="size-4" /> {b.address}
                </p>
                {b.status === "PENDING_PAYMENT" && !b.holdActive && (
                  <p>
                    ⌛ The 15-minute hold expired, so this slot may be taken by
                    someone else.
                  </p>
                )}
              </div>

              {/* empty:hidden hides this row when no button applies */}
              <div className="flex flex-wrap gap-2 empty:hidden">
                {isCustomer &&
                  future &&
                  ["PENDING_PAYMENT", "CONFIRMED"].includes(b.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancel(b)}
                    >
                      Cancel
                    </Button>
                  )}
                {!isCustomer && b.status === "CONFIRMED" && !future && (
                  <Button size="sm" onClick={() => complete(b)}>
                    Mark complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
