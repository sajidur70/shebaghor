import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "../api";
import { AREAS } from "../constants";
import ServiceCard from "../components/ServiceCard";

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ key: null, result: null, error: "" });

  const [q, setQ] = useState(params.get("q") || "");

  // Load categories once.
  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data.categories))
      .catch(() => {});
  }, []);

  // Reload services whenever the URL query changes.
  // "key" is the query as text, e.g. "q=fan&area=Mirpur".
  const key = params.toString();
  useEffect(() => {
    let ignore = false; // set to true if the user searches again before this answer arrives
    api
      .get("/services", {
        params: Object.fromEntries(new URLSearchParams(key)),
      })
      .then((res) => !ignore && setData({ key, result: res.data, error: "" }))
      .catch(
        (err) =>
          !ignore && setData({ key, result: null, error: errorMessage(err) }),
      );
    return () => {
      ignore = true;
    };
  }, [key]);

  // The saved answer belongs to an older search → we're loading the new one.
  const loading = data.key !== key;
  const result = loading ? null : data.result; // { services, total, page, totalPages }
  const error = loading ? "" : data.error;

  // Change some filters in the URL. Changing a filter resets to page 1.
  function updateFilters(changes) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  }

  const page = Number(params.get("page") || 1);
  const activeCategory = params.get("category") || "";

  return (
    <>
      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Book trusted home services in Dhaka
        </h1>
        <p className="mt-1 text-muted-foreground">
          Electricians, plumbers, AC technicians and tutors, with real free time
          slots.
        </p>

        <form
          className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            updateFilters({ q: q.trim() });
          }}
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “fan repair” or “math”"
          />
          <NativeSelect
            className="w-full"
            value={params.get("area") || ""}
            onChange={(e) => updateFilters({ area: e.target.value })}
          >
            <NativeSelectOption value="">All areas</NativeSelectOption>
            {AREAS.map((a) => (
              <NativeSelectOption key={a} value={a}>
                {a}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="submit">
            <Search /> Search
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-full"
            variant={!activeCategory ? "default" : "outline"}
            onClick={() => updateFilters({ category: "" })}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              className="rounded-full"
              variant={activeCategory === c.slug ? "default" : "outline"}
              onClick={() => updateFilters({ category: c.slug })}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!result && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}
      {result?.services.length === 0 && (
        <p className="text-muted-foreground">No services match your search.</p>
      )}

      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>

          {result.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: String(page - 1) })}
              >
                ← Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {result.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= result.totalPages}
                onClick={() => updateFilters({ page: String(page + 1) })}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
