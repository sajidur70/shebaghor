import { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import StatusBadge from "../components/StatusBadge";
import { api, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, formatTaka } from "../utils/format";

function ReviewForm({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/reviews", {
        bookingId: booking.id,
        rating,
        comment: comment || undefined,
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form
      className="grid gap-3 rounded-lg border bg-muted/40 p-3"
      onSubmit={submit}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} stars`}
          >
            <Star
              className={cn(
                "size-6",
                n <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        rows={2}
        maxLength={500}
        placeholder="How was the job? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="sm"
        className="justify-self-start"
        disabled={busy}
      >
        Submit review
      </Button>
    </form>
  );
}

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
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

  async function pay(b) {
    setError("");
    try {
      const { data } = await api.post(`/payments/init/${b.id}`);
      window.location.assign(data.url); // full page change: to SSLCommerz, or to /payment/success in mock mode
    } catch (err) {
      setError(errorMessage(err));
    }
  }

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
                  <p>⌛ The 15-minute hold expired. Please book again.</p>
                )}
                {b.payment?.refundRequired && <p>💸 Refund pending</p>}
                {b.review && (
                  <p className="text-amber-600">
                    You rated {"★".repeat(b.review.rating)}
                  </p>
                )}
              </div>

              {/* empty:hidden hides this row when no button applies */}
              <div className="flex flex-wrap gap-2 empty:hidden">
                {isCustomer &&
                  b.status === "PENDING_PAYMENT" &&
                  b.holdActive && (
                    <Button size="sm" onClick={() => pay(b)}>
                      Pay {formatTaka(b.price)}
                    </Button>
                  )}
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
                {isCustomer &&
                  b.status === "COMPLETED" &&
                  !b.review &&
                  reviewingId !== b.id && (
                    <Button size="sm" onClick={() => setReviewingId(b.id)}>
                      Write a review
                    </Button>
                  )}
                {!isCustomer && b.status === "CONFIRMED" && !future && (
                  <Button size="sm" onClick={() => complete(b)}>
                    Mark complete
                  </Button>
                )}
              </div>

              {reviewingId === b.id && (
                <ReviewForm
                  booking={b}
                  onDone={() => {
                    setReviewingId(null);
                    load();
                  }}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
