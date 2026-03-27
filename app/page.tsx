"use client";

import { useState } from "react";
import { GroupBy } from "@/lib/api";
import HealthBadge from "@/components/HealthBadge";
import GroupBrowser from "@/components/GroupBrowser";
import RenderView from "@/components/RenderView";

export default function Home() {
  const [selected, setSelected] = useState<{ groupBy: GroupBy; groupKey: string } | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#3a2460]">
      {/* Header */}
      <header className="border-b border-[#ece9f5] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#ff4b32]" />
          <div>
            <h1 className="text-base font-semibold text-[#3a2460]" style={{ fontFamily: "var(--font-figtree)" }}>
              Thermal Palette
            </h1>
            <p className="text-xs text-[#9388a8]">Kestrix alignment service</p>
          </div>
        </div>
        <HealthBadge />
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        {/* Left: group browser */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9388a8]">
            Browse groups
          </p>
          <GroupBrowser
            onGroupSelected={(groupBy, groupKey) => setSelected({ groupBy, groupKey })}
          />
        </div>

        {/* Right: before/after render view */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9388a8]">
            Before / After
          </p>
          {selected ? (
            <RenderView groupBy={selected.groupBy} groupKey={selected.groupKey} />
          ) : (
            <div className="rounded-xl border border-[#ece9f5] bg-[#f8f7fc] px-8 py-12 text-center">
              <p className="text-sm text-[#9388a8]">
                Select a group on the left to compare original vs aligned images.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
