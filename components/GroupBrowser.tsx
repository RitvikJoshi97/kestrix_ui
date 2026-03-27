"use client";

import { useEffect, useState } from "react";
import { api, GroupBy, ImageGroup, GroupDetailResponse } from "@/lib/api";

const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "property", label: "Property" },
  { value: "flight", label: "Flight" },
  { value: "azimuth", label: "Azimuth" },
  { value: "date", label: "Date" },
  { value: "property_azimuth", label: "Property × Azimuth" },
  { value: "property_flight", label: "Property × Flight" },
];

interface Props {
  onGroupSelected: (groupBy: GroupBy, groupKey: string) => void;
}

export default function GroupBrowser({ onGroupSelected }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>("property");
  const [groups, setGroups] = useState<ImageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<GroupDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    api
      .listGroups(groupBy)
      .then((res) => setGroups(res.groups))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [groupBy]);

  function handleGroupClick(g: ImageGroup) {
    setDetailLoading(true);
    api
      .getGroup(g.group_by, g.group_key)
      .then(setSelected)
      .catch(() => setSelected(null))
      .finally(() => setDetailLoading(false));
    onGroupSelected(g.group_by, g.group_key);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Group-by selector */}
      <div className="flex flex-wrap gap-1.5">
        {GROUP_BY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGroupBy(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              groupBy === opt.value
                ? "bg-[#ff4b32] text-white"
                : "bg-[#f8f7fc] text-[#6f3dcc] hover:bg-[#ece9f5]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Group list */}
      <div>
        <p className="mb-1.5 text-xs text-[#9388a8]">
          {loading ? "Loading…" : `${groups.length} group(s)`}
        </p>
        <ul className="max-h-96 overflow-y-auto rounded-xl border border-[#ece9f5] divide-y divide-[#ece9f5]">
          {groups.map((g) => (
            <li key={g.group_key}>
              <button
                onClick={() => handleGroupClick(g)}
                className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-[#f8f7fc] ${
                  selected?.group_key === g.group_key
                    ? "bg-[#f8f7fc] text-[#ff4b32]"
                    : "text-[#3a2460]"
                }`}
              >
                <span className="font-mono text-xs">{g.group_key}</span>
                <span className="ml-2 text-xs text-[#9388a8]">{g.image_count} img</span>
              </button>
            </li>
          ))}
          {!loading && groups.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-[#9388a8]">No groups</li>
          )}
        </ul>
      </div>

      {/* Group detail */}
      {detailLoading && (
        <p className="text-xs text-[#9388a8] animate-pulse">Loading detail…</p>
      )}
      {selected && !detailLoading && (
        <div>
          <p className="mb-1.5 text-xs text-[#9388a8]">
            {selected.image_count} images in{" "}
            <span className="font-mono text-[#ff4b32]">{selected.group_key}</span>
          </p>
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-[#ece9f5] divide-y divide-[#ece9f5] text-xs">
            {selected.images.map((img) => (
              <li key={img.image_id} className="flex flex-col px-3 py-2">
                <span className="font-mono text-[#3a2460]">{img.filename}</span>
                <span className="text-[#9388a8]">
                  {new Date(img.captured_at).toLocaleString()} &bull;{" "}
                  {img.compass_direction} ({img.azimuth.toFixed(1)}°)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
