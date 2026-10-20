import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, errorMessage } from "./api";

export default function App() {
  const [status, setStatus] = useState("Checking API…");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setStatus(`✅ API is up (server time ${res.data.time})`))
      .catch((err) => setStatus(`❌ ${errorMessage(err)}`));
  }, []);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ShebaGhor</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{status}</p>
        </CardContent>
      </Card>
    </main>
  );
}
