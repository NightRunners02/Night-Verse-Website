// NightVerse Supabase REST API Integration Layer
// Connects directly to Supabase PostgREST (/rest/v1/) with zero external SDK overhead

const DEFAULT_SUPABASE_URL = "https://njrwobbhtcotaxvqqkpz.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcndvYmJodGNvdGF4dnFxa3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyODM1NDcsImV4cCI6MjExMDg1OTU0N30.UA03ZnDEGxPRZJmD0NHkE8S_7bJHRoIaTntTju-ErnE";

const rawEnv = ((import.meta as any)?.env || {}) as Record<string, string | undefined>;

const resolveBaseUrl = (): string => {
  const candidate = (rawEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  return candidate.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
};

export const SUPABASE_URL = resolveBaseUrl();
export const SUPABASE_ANON_KEY = (rawEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();
export const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1`;

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("MY_SUPABASE_URL"));

const buildHeaders = (extra?: Record<string, string>): Record<string, string> => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

export interface SupabaseResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  missingTable?: boolean;
  error?: string;
}

export async function supabaseSelect<T = Record<string, any>>(
  table: string,
  query = "select=*"
): Promise<SupabaseResult<T[]>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, status: 0, data: null, error: "Supabase not configured" };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(`${SUPABASE_REST_URL}/${table}?${query}`, {
      method: "GET",
      headers: buildHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const missingTable =
        res.status === 404 ||
        errText.includes("PGRST205") ||
        errText.includes("does not exist");
      return {
        ok: false,
        status: res.status,
        data: null,
        missingTable,
        error: errText || `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as T[];
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Network error",
    };
  }
}

export async function supabaseUpsert<T extends Record<string, any>>(
  table: string,
  rows: T[],
  onConflict = "id"
): Promise<SupabaseResult<null>> {
  if (!isSupabaseConfigured() || rows.length === 0) {
    return { ok: true, status: 200, data: null };
  }

  const sendBatch = async (batch: T[]): Promise<SupabaseResult<null>> => {
    try {
      const res = await fetch(
        `${SUPABASE_REST_URL}/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
        {
          method: "POST",
          headers: buildHeaders({
            Prefer: "resolution=merge-duplicates,return=minimal",
          }),
          body: JSON.stringify(batch),
        }
      );
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return {
          ok: false,
          status: res.status,
          data: null,
          missingTable: res.status === 404 || errText.includes("PGRST205"),
          error: errText || `HTTP ${res.status}`,
        };
      }
      return { ok: true, status: res.status, data: null };
    } catch (err: any) {
      return { ok: false, status: 0, data: null, error: err?.message || "Network error" };
    }
  };

  const CHUNK_SIZE = 20;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const result = await sendBatch(chunk);
    if (!result.ok) {
      if (result.missingTable) return result;
      // Fallback row-by-row so one oversized/problematic payload doesn't drop other valid rows
      if (chunk.length > 1) {
        for (const row of chunk) {
          const single = await sendBatch([row]);
          if (!single.ok) {
            console.warn(`[Supabase] Upsert skipped row in ${table}:`, single.error);
          }
        }
      } else {
        console.warn(`[Supabase] Upsert warning for ${table}:`, result.error);
      }
    }
  }

  return { ok: true, status: 200, data: null };
}

export async function supabaseDeleteIds(
  table: string,
  ids: string[],
  idColumn = "id"
): Promise<SupabaseResult<null>> {
  if (!isSupabaseConfigured() || ids.length === 0) {
    return { ok: true, status: 200, data: null };
  }

  try {
    const encodedList = ids
      .map((id) => `"${String(id).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
      .join(",");
    const res = await fetch(
      `${SUPABASE_REST_URL}/${table}?${encodeURIComponent(idColumn)}=in.(${encodeURIComponent(encodedList)})`,
      {
        method: "DELETE",
        headers: buildHeaders({ Prefer: "return=minimal" }),
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, status: res.status, data: null, error: errText };
    }
    return { ok: true, status: res.status, data: null };
  } catch (err: any) {
    return { ok: false, status: 0, data: null, error: err?.message || "Network error" };
  }
}

export async function supabaseDeleteFollows(
  pairs: Array<{ followerId: string; followingId: string }>
): Promise<void> {
  if (!isSupabaseConfigured() || pairs.length === 0) return;
  await Promise.allSettled(
    pairs.map((p) =>
      fetch(
        `${SUPABASE_REST_URL}/follows?follower_id=eq.${encodeURIComponent(p.followerId)}&following_id=eq.${encodeURIComponent(p.followingId)}`,
        {
          method: "DELETE",
          headers: buildHeaders({ Prefer: "return=minimal" }),
        }
      )
    )
  );
}
