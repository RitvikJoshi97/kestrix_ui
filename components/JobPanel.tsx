"use client";

import { useEffect, useRef, useState } from "react";
import { api, JobResponse, JobStatus } from "@/lib/api";

const STATUS_COLORS: Record<JobStatus, string> = {
  PENDING: "text-yellow-400",
  RUNNING: "text-blue-400",
  COMPLETE: "text-emerald-400",
  FAILED: "text-red-400",
};

interface Props {
  jobId: string;
}

export default function JobPanel({ jobId }: Props) {
  const [job, setJob] = useState<JobResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function fetchJob() {
      api.getJob(jobId).then((j) => {
        setJob(j);
        if (j.status === "COMPLETE" || j.status === "FAILED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      });
    }

    fetchJob();
    intervalRef.current = setInterval(fetchJob, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  if (!job)
    return (
      <p className="animate-pulse text-xs text-zinc-500">Loading job…</p>
    );

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-zinc-500">{job.job_id}</span>
        <span
          className={`font-semibold ${STATUS_COLORS[job.status]} ${
            job.status === "RUNNING" ? "animate-pulse" : ""
          }`}
        >
          {job.status}
        </span>
      </div>

      <div className="text-xs text-zinc-400 space-y-0.5 mb-3">
        <p>
          <span className="text-zinc-600">Group:</span>{" "}
          <span className="font-mono text-zinc-200">
            {job.spec.group_by} / {job.spec.group_key}
          </span>
        </p>
        <p>
          <span className="text-zinc-600">Palette:</span> {job.spec.palette}
        </p>
        <p>
          <span className="text-zinc-600">Percentiles:</span>{" "}
          {job.spec.low_percentile}% – {job.spec.high_percentile}%
        </p>
      </div>

      {job.status === "COMPLETE" && job.result && (
        <div className="rounded bg-zinc-800 px-3 py-2 text-xs space-y-1">
          <p className="text-emerald-400 font-medium mb-1">Result</p>
          <p>
            <span className="text-zinc-500">Rendered:</span>{" "}
            {job.result.rendered_count} images in{" "}
            {job.result.duration_seconds.toFixed(2)}s
          </p>
          <p>
            <span className="text-zinc-500">Temp range:</span>{" "}
            {job.result.temperature_range.min_temp.toFixed(1)} –{" "}
            {job.result.temperature_range.max_temp.toFixed(1)}°C
            {job.result.temperature_range.clamped && (
              <span className="ml-1 text-yellow-500">(clamped)</span>
            )}
          </p>
          {Object.keys(job.result.output_paths).length > 0 && (
            <div>
              <p className="text-zinc-500 mt-1">Outputs:</p>
              <ul className="mt-0.5 space-y-0.5 font-mono text-zinc-300">
                {Object.entries(job.result.output_paths).map(([k, v]) => (
                  <li key={k}>
                    <span className="text-zinc-600">{k}:</span> {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {job.status === "FAILED" && job.error && (
        <div className="rounded border border-red-800 bg-red-900/20 px-3 py-2 text-xs text-red-300">
          {job.error}
        </div>
      )}

      {(job.status === "PENDING" || job.status === "RUNNING") && (
        <div className="h-1 w-full overflow-hidden rounded bg-zinc-800 mt-2">
          <div className="h-full animate-pulse rounded bg-orange-600 w-2/3" />
        </div>
      )}
    </div>
  );
}
