import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../api";
import { formatDateTime } from "../utils/format";

export default function ReviewList({ providerId }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .get(`/providers/${providerId}/reviews`, { params: { page } })
      .then((res) => setData(res.data));
  }, [providerId, page]);

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews ({data.total})</CardTitle>
      </CardHeader>
      <CardContent>
        {data.reviews.length === 0 && (
          <p className="text-muted-foreground">No reviews yet.</p>
        )}
        <div className="divide-y">
          {data.reviews.map((r) => (
            <div key={r.id} className="py-3">
              <p className="text-sm">
                <span className="text-amber-500">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>{" "}
                <span className="text-muted-foreground">
                  {r.customer.name} · {formatDateTime(r.createdAt)}
                </span>
              </p>
              {r.comment && <p className="mt-1">{r.comment}</p>}
            </div>
          ))}
        </div>
        {data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ←
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
