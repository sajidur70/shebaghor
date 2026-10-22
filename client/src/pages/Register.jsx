import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";
import { AREAS, HOME_BY_ROLE } from "../constants";

const ROLES = [
  ["CUSTOMER", "I need a service"],
  ["PROVIDER", "I provide a service"],
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
    area: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        area: form.role === "PROVIDER" ? form.area : undefined,
      };
      const user = await register(payload);
      navigate(HOME_BY_ROLE[user.role]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Book a service, or offer your own.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* RadioGroup hands you the new value directly (not an event), so it doesn't use set() */}
          <RadioGroup
            value={form.role}
            onValueChange={(role) => setForm({ ...form, role })}
            className="grid-cols-2"
          >
            {ROLES.map(([value, label]) => (
              <Label
                key={value}
                htmlFor={value}
                className="cursor-pointer rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary"
              >
                <RadioGroupItem id={value} value={value} />
                {label}
              </Label>
            ))}
          </RadioGroup>

          <Field label="Full name" id="name">
            <Input
              id="name"
              required
              value={form.name}
              onChange={set("name")}
            />
          </Field>
          <Field label="Email" id="email">
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
            />
          </Field>
          <Field label="Phone" id="phone">
            <Input
              id="phone"
              value={form.phone}
              onChange={set("phone")}
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Field label="Password" id="password">
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set("password")}
            />
          </Field>

          {form.role === "PROVIDER" && (
            <Field label="Your area" id="area">
              <NativeSelect
                id="area"
                className="w-full"
                required
                value={form.area}
                onChange={set("area")}
              >
                <NativeSelectOption value="">Choose…</NativeSelectOption>
                {AREAS.map((a) => (
                  <NativeSelectOption key={a} value={a}>
                    {a}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-muted-foreground">
        Already have an account?&nbsp;
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </CardFooter>
    </Card>
  );
}
