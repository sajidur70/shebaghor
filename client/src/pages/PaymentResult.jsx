import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MESSAGES = {
  success: {
    title: "✅ Payment successful",
    text: "Your booking is confirmed. See you soon!",
  },
  refund: {
    title: "⚠️ Slot no longer available",
    text:
      "Your payment arrived after the 15-minute hold expired and someone else booked this time. " +
      "Your booking was cancelled and the payment is flagged for a refund.",
  },
  failed: {
    title: "❌ Payment failed",
    text: "No money was taken. You can try again from My bookings while your hold is active.",
  },
  cancelled: {
    title: "Payment cancelled",
    text: "You can still pay from My bookings within 15 minutes of booking.",
  },
};

export default function PaymentResult() {
  const { result } = useParams();
  const message = MESSAGES[result] || MESSAGES.failed;
  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">{message.title}</CardTitle>
        <CardDescription>{message.text}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/bookings">Go to My bookings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
