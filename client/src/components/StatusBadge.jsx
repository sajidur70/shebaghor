import { Badge } from "@/components/ui/badge";

const STATUS = {
  PENDING_PAYMENT: {
    label: "Waiting for payment",
    className: "bg-amber-100 text-amber-800",
  },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-800" },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground",
  },
};

export default function StatusBadge({ status }) {
  const { label, className } = STATUS[status];
  return <Badge className={className}>{label}</Badge>;
}
