import { useEffect, useState } from "react";
import { api } from "../api";

// Render's free tier sleeps after ~15 min idle. Tell visitors why the first load is slow.
export default function WakeBanner() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 3000);
    api.get("/health").finally(() => {
      clearTimeout(timer);
      setSlow(false);
    });
    return () => clearTimeout(timer);
  }, []);

  if (!slow) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      ⏳ Waking up the free server… the first load can take up to a minute.
    </div>
  );
}
