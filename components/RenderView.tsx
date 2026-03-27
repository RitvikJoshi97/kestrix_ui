"use client";

import { useEffect, useState, useRef } from "react";
import {
  api,
  GroupBy,
  GroupDetailResponse,
  ImageRecordDetail,
  PaletteType,
  originalImageUrl,
  renderedImageUrl,
} from "@/lib/api";

const PALETTE_OPTIONS: { value: PaletteType; label: string }[] = [
  { value: "IRON", label: "Iron" },
  { value: "WHITE_HOT", label: "White Hot" },
  { value: "ARCTIC", label: "Arctic" },
  { value: "RAINBOW_HC", label: "Rainbow HC" },
];

const PAGE_SIZE = 6;
const DEBOUNCE_MS = 300;

interface RenderMeta {
  objectUrl: string;
  renderMs: number;
  cache: "HIT" | "MISS";
}

interface ImagePairProps {
  image: ImageRecordDetail;
  groupBy: GroupBy;
  groupKey: string;
  palette: PaletteType;
  low: number;
  high: number;
}

function ImagePair({ image, groupBy, groupKey, palette, low, high }: ImagePairProps) {
  const [meta, setMeta] = useState<RenderMeta | null>(null);
  const alignedSrc = renderedImageUrl(groupBy, groupKey, image.image_id, palette, low, high);

  useEffect(() => {
    setMeta(null);
    const controller = new AbortController();
    fetch(alignedSrc, { signal: controller.signal })
      .then(async (res) => {
        const renderMs = Number(res.headers.get("X-Render-Ms") ?? 0);
        const cache = (res.headers.get("X-Cache") ?? "MISS") as "HIT" | "MISS";
        const blob = await res.blob();
        setMeta({ objectUrl: URL.createObjectURL(blob), renderMs, cache });
      })
      .catch(() => {});
    return () => {
      controller.abort();
      setMeta((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return null;
      });
    };
  }, [alignedSrc]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#ece9f5] bg-white p-3">
      <p className="truncate font-mono text-xs text-[#9388a8]">{image.filename}</p>
      <div className="grid grid-cols-2 gap-2">
        {/* Original */}
        <div className="flex flex-col gap-1">
          <span className="text-center text-xs font-medium text-[#9388a8]">Original</span>
          <img
            src={originalImageUrl(image.image_id)}
            alt="original"
            className="w-full rounded-lg object-cover"
          />
        </div>
        {/* Aligned */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#ff4b32]">Aligned</span>
            {meta ? (
              <span className="text-xs text-[#9388a8]">
                {meta.renderMs}ms &bull;{" "}
                <span className={meta.cache === "HIT" ? "text-emerald-600" : "text-[#8e57ef]"}>
                  {meta.cache}
                </span>
              </span>
            ) : (
              <span className="animate-pulse text-xs text-[#9388a8]">rendering…</span>
            )}
          </div>
          <div className="relative min-h-16">
            {!meta && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#f8f7fc]">
                <span className="animate-pulse text-xs text-[#9388a8]">rendering…</span>
              </div>
            )}
            {meta && (
              <img
                src={meta.objectUrl}
                alt="aligned"
                className="w-full rounded-lg object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  groupBy: GroupBy;
  groupKey: string;
}

export default function RenderView({ groupBy, groupKey }: Props) {
  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [palette, setPalette] = useState<PaletteType>("IRON");
  const [low, setLow] = useState(2);
  const [high, setHigh] = useState(98);
  const [debouncedLow, setDebouncedLow] = useState(2);
  const [debouncedHigh, setDebouncedHigh] = useState(98);
  const [page, setPage] = useState(1);
  const lowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    api
      .getGroup(groupBy, groupKey)
      .then(setGroup)
      .finally(() => setLoading(false));
  }, [groupBy, groupKey]);

  if (loading)
    return <p className="animate-pulse text-xs text-[#9388a8]">Loading group…</p>;
  if (!group) return null;

  const visible = group.images.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < group.images.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#ece9f5] bg-[#f8f7fc] p-4">
        <div>
          <p className="mb-2 text-xs font-medium text-[#9388a8]">Palette</p>
          <div className="flex flex-wrap gap-1.5">
            {PALETTE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPalette(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  palette === opt.value
                    ? "bg-[#ff4b32] text-white"
                    : "bg-white text-[#6f3dcc] ring-1 ring-[#ece9f5] hover:bg-[#ece9f5]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-1 text-xs font-medium text-[#9388a8]">
              Low percentile{" "}
              <span className="font-mono text-[#ff4b32]">{low}%</span>
            </p>
            <input
              type="range"
              min={0}
              max={49}
              step={0.5}
              value={low}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLow(v);
                if (lowTimer.current) clearTimeout(lowTimer.current);
                lowTimer.current = setTimeout(() => setDebouncedLow(v), DEBOUNCE_MS);
              }}
              className="w-full accent-[#ff4b32]"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-[#9388a8]">
              High percentile{" "}
              <span className="font-mono text-[#ff4b32]">{high}%</span>
            </p>
            <input
              type="range"
              min={51}
              max={100}
              step={0.5}
              value={high}
              onChange={(e) => {
                const v = Number(e.target.value);
                setHigh(v);
                if (highTimer.current) clearTimeout(highTimer.current);
                highTimer.current = setTimeout(() => setDebouncedHigh(v), DEBOUNCE_MS);
              }}
              className="w-full accent-[#ff4b32]"
            />
          </div>
        </div>

        <p className="text-xs text-[#9388a8]">
          {group.image_count} image{group.image_count !== 1 ? "s" : ""} in{" "}
          <span className="font-mono text-[#ff4b32]">{groupBy} / {groupKey}</span>
        </p>
      </div>

      {/* Before/after grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((img) => (
          <ImagePair
            key={img.image_id}
            image={img}
            groupBy={groupBy}
            groupKey={groupKey}
            palette={palette}
            low={debouncedLow}
            high={debouncedHigh}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rounded-full border border-[#ece9f5] px-5 py-2 text-sm font-medium text-[#6f3dcc] transition-colors hover:bg-[#f8f7fc]"
        >
          Show more ({group.image_count - visible.length} remaining)
        </button>
      )}
    </div>
  );
}
