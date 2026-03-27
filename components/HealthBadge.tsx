"use client";

import { useEffect, useState } from "react";
import { api, HealthResponse } from "@/lib/api";

export default function HealthBadge() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  if (error)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs text-red-500 ring-1 ring-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        API unreachable
      </span>
    );

  if (!health)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f7fc] px-3 py-1 text-xs text-[#9388a8] ring-1 ring-[#ece9f5] animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9388a8]" />
        connecting…
      </span>
    );

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      v{health.version} &bull; {health.image_count} images
    </span>
  );
}
