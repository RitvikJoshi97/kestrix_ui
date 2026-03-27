"use client";

import { useState, useEffect } from "react";
import { api, GroupBy, PaletteType, AlignResponse } from "@/lib/api";

const PALETTE_OPTIONS: { value: PaletteType; label: string }[] = [
  { value: "IRON", label: "Iron" },
  { value: "WHITE_HOT", label: "White Hot" },
  { value: "ARCTIC", label: "Arctic" },
  { value: "RAINBOW_HC", label: "Rainbow HC" },
];

interface Props {
  initialGroupBy?: GroupBy;
  initialGroupKey?: string;
  onJobSubmitted: (jobId: string) => void;
}

export default function AlignForm({
  initialGroupBy = "property",
  initialGroupKey = "",
  onJobSubmitted,
}: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>(initialGroupBy);
  const [groupKey, setGroupKey] = useState(initialGroupKey);
  const [palette, setPalette] = useState<PaletteType>("IRON");
  const [lowPct, setLowPct] = useState(2);
  const [highPct, setHighPct] = useState(98);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sync when parent updates selection
  useEffect(() => {
    setGroupBy(initialGroupBy);
    setGroupKey(initialGroupKey);
  }, [initialGroupBy, initialGroupKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res: AlignResponse = await api.submitAlign({
        group_by: groupBy,
        group_key: groupKey,
        palette,
        low_percentile: lowPct,
        high_percentile: highPct,
      });
      onJobSubmitted(res.job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const labelCls = "block text-xs text-zinc-500 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Group by</label>
          <select
            className={inputCls}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          >
            <option value="property">Property</option>
            <option value="flight">Flight</option>
            <option value="azimuth">Azimuth</option>
            <option value="date">Date</option>
            <option value="property_azimuth">Property × Azimuth</option>
            <option value="property_flight">Property × Flight</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Group key</label>
          <input
            className={inputCls}
            value={groupKey}
            onChange={(e) => setGroupKey(e.target.value)}
            placeholder="e.g. PROP_001"
            required
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Palette</label>
        <div className="flex gap-2 flex-wrap">
          {PALETTE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPalette(opt.value)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                palette === opt.value
                  ? "bg-orange-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>
            Low percentile &nbsp;
            <span className="text-orange-400 font-mono">{lowPct}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={49}
            step={0.5}
            value={lowPct}
            onChange={(e) => setLowPct(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
        <div>
          <label className={labelCls}>
            High percentile &nbsp;
            <span className="text-orange-400 font-mono">{highPct}%</span>
          </label>
          <input
            type="range"
            min={51}
            max={100}
            step={0.5}
            value={highPct}
            onChange={(e) => setHighPct(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-800 bg-red-900/30 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !groupKey}
        className="rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Run alignment"}
      </button>
    </form>
  );
}
