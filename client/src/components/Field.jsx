import { Label } from "@/components/ui/label";

// One form field: label on top, input below. Saves repeating the same 3 lines on every form.
export default function Field({ label, id, children }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
