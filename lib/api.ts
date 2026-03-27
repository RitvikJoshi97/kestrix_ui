const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type GroupBy =
  | "property"
  | "flight"
  | "azimuth"
  | "date"
  | "property_azimuth"
  | "property_flight";

export type PaletteType = "WHITE_HOT" | "IRON" | "RAINBOW_HC" | "ARCTIC";

export type JobStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";

export interface HealthResponse {
  status: string;
  image_count: number;
  version: string;
}

export interface ImageGroup {
  group_key: string;
  group_by: GroupBy;
  image_count: number;
  image_ids: string[];
}

export interface GroupListResponse {
  group_by: GroupBy;
  total_groups: number;
  groups: ImageGroup[];
}

export interface ImageRecordDetail {
  image_id: string;
  filename: string;
  captured_at: string;
  azimuth: number;
  compass_direction: string;
  flight_id: string | null;
  property_id: string;
}

export interface GroupDetailResponse {
  group_key: string;
  group_by: GroupBy;
  image_count: number;
  images: ImageRecordDetail[];
}

export interface AlignRequest {
  group_by: GroupBy;
  group_key: string;
  palette: PaletteType;
  low_percentile: number;
  high_percentile: number;
}

export interface AlignResponse {
  job_id: string;
  status: JobStatus;
  spec: AlignmentSpec;
  created_at: string;
}

export interface AlignmentSpec {
  group_by: GroupBy;
  group_key: string;
  palette: PaletteType;
  low_percentile: number;
  high_percentile: number;
}

export interface TemperatureRange {
  min_temp: number;
  max_temp: number;
  low_percentile: number;
  high_percentile: number;
  clamped: boolean;
}

export interface AlignmentResult {
  spec: AlignmentSpec;
  temperature_range: TemperatureRange;
  output_paths: Record<string, string>;
  rendered_count: number;
  duration_seconds: number;
}

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  spec: AlignmentSpec;
  result: AlignmentResult | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => get<HealthResponse>("/healthz"),
  listGroups: (groupBy: GroupBy) =>
    get<GroupListResponse>(`/groups?group_by=${groupBy}`),
  getGroup: (groupBy: GroupBy, groupKey: string) =>
    get<GroupDetailResponse>(
      `/groups/${groupBy}/${encodeURIComponent(groupKey)}`
    ),
  submitAlign: (req: AlignRequest) => post<AlignResponse>("/align", req),
  getJob: (jobId: string) => get<JobResponse>(`/jobs/${jobId}`),
};

export function originalImageUrl(imageId: string): string {
  return `${BASE_URL}/images/${imageId}`;
}

export function renderedImageUrl(
  groupBy: GroupBy,
  groupKey: string,
  imageId: string,
  palette: PaletteType,
  low: number,
  high: number
): string {
  return `${BASE_URL}/render/${groupBy}/${encodeURIComponent(groupKey)}/${imageId}?palette=${palette}&low=${low}&high=${high}`;
}
