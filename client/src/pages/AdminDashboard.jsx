import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "../api";
import { formatTaka, formatDateTime } from "../utils/format";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [categoryName, setCategoryName] = useState("");

  function load() {
    api.get("/admin/stats").then((res) => setStats(res.data));
    api
      .get("/admin/providers", { params: { approved: false } })
      .then((res) => setPending(res.data.providers));
    api
      .get("/admin/providers", { params: { approved: true } })
      .then((res) => setApproved(res.data.providers));
  }

  useEffect(() => {
    load();
  }, []);

  async function setApproval(id, value) {
    await api.patch(`/admin/providers/${id}/approve`, { approved: value });
    load();
  }

  async function addCategory(e) {
    e.preventDefault();
    try {
      await api.post("/categories", { name: categoryName });
      toast.success(`Added "${categoryName}"`);
      setCategoryName("");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (!stats) return <p className="text-muted-foreground">Loading…</p>;

  const tiles = [
    ["Customers", stats.usersByRole.CUSTOMER ?? 0],
    ["Providers", stats.usersByRole.PROVIDER ?? 0],
    ["Pending approval", stats.pendingProviders],
    ["Confirmed", stats.bookingsByStatus.CONFIRMED ?? 0],
    ["Completed", stats.bookingsByStatus.COMPLETED ?? 0],
    ["Revenue", formatTaka(stats.revenue)],
  ];

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Providers waiting for approval</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 && (
            <p className="text-muted-foreground">Nobody is waiting. 🎉</p>
          )}
          <div className="divide-y">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium">{p.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.user.email} · {p.area} · {p._count.services} services
                  </p>
                </div>
                <Button size="sm" onClick={() => setApproval(p.id, true)}>
                  Approve
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {approved.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium">{p.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.area} · ★ {p.ratingAvg.toFixed(1)} ({p.ratingCount})
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApproval(p.id, false)}
                >
                  Suspend
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refunds to process</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.refunds.length === 0 && (
            <p className="text-muted-foreground">None.</p>
          )}
          <div className="divide-y text-sm">
            {stats.refunds.map((r) => (
              <p key={r.id} className="py-2">
                <span className="font-semibold">{formatTaka(r.amount)}</span> ·{" "}
                {r.booking.customer.name} ({r.booking.customer.email}) · tran{" "}
                {r.tranId} · {formatDateTime(r.updatedAt)}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a category</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={addCategory}>
            <Input
              required
              minLength={2}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Painter"
            />
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
