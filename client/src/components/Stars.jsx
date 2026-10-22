import { Star } from "lucide-react";

export default function Stars({ value = 0, count = 0 }) {
  if (!count)
    return (
      <span className="text-sm text-muted-foreground">No reviews yet</span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
      <Star className="size-4 fill-current" />
      {value.toFixed(1)}{" "}
      <span className="font-normal text-muted-foreground">({count})</span>
    </span>
  );
}
