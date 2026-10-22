import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import Field from "../components/Field";
import { api, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import { AREAS } from "../constants";
import { formatTaka } from "../utils/format";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const emptyForm = {
    title: "",
    description: "",
    categoryId: "",
    price: 500,
    durationMin: 60,
    area: user.provider?.area || "",
  };

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const loadServices = () =>
    api.get("/services/mine").then((res) => setServices(res.data.services));

  useEffect(() => {
    loadServices();
    api.get("/categories").then((res) => setCategories(res.data.categories));
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function addService(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/services", form);
      setForm(emptyForm);
      loadServices();
      toast.success("Service added");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function removeService(id) {
    if (!confirm("Remove this service? Past bookings will keep it.")) return;
    await api.delete(`/services/${id}`);
    loadServices();
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Provider dashboard</h1>

      {!user.provider?.approved && (
        <Alert className="border-amber-300 bg-amber-50">
          <Clock />
          <AlertTitle>Waiting for admin approval</AlertTitle>
          <AlertDescription>
            You can set everything up now, but customers won't see your services
            until you're approved.
          </AlertDescription>
        </Alert>
      )}

      {/* Day 4: <HoursEditor /> goes here */}

      <Card>
        <CardHeader>
          <CardTitle>My services</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 && (
            <p className="text-muted-foreground">
              No services yet. Add your first one below.
            </p>
          )}
          <div className="divide-y">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.category.name} · {s.durationMin} min · {s.area}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatTaka(s.price)}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeService(s.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a service</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={addService}>
            <Field label="Title" id="title">
              <Input
                id="title"
                required
                value={form.title}
                onChange={set("title")}
              />
            </Field>
            <Field label="Description" id="description">
              <Textarea
                id="description"
                required
                rows={3}
                value={form.description}
                onChange={set("description")}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" id="categoryId">
                <NativeSelect
                  id="categoryId"
                  className="w-full"
                  required
                  value={form.categoryId}
                  onChange={set("categoryId")}
                >
                  <NativeSelectOption value="">Choose…</NativeSelectOption>
                  {categories.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Area" id="area">
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
              <Field label="Price (৳)" id="price">
                <Input
                  id="price"
                  type="number"
                  min={50}
                  required
                  value={form.price}
                  onChange={set("price")}
                />
              </Field>
              <Field label="Duration" id="durationMin">
                <NativeSelect
                  id="durationMin"
                  className="w-full"
                  value={form.durationMin}
                  onChange={set("durationMin")}
                >
                  {[30, 60, 90, 120, 180].map((m) => (
                    <NativeSelectOption key={m} value={m}>
                      {m} min
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="justify-self-start">
              Add service
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
