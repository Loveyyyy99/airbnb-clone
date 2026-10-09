// Thin typed fetch wrapper around the FastAPI backend.
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'airbnb-clone-token';

export const getToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch {}
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const detailText = (d: unknown): string => {
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d
      .map((e) => {
        const m = (e?.msg as string) || 'Invalid value';
        return m.replace(/^Value error, /, '');
      })
      .join('. ');
  }
  return 'Something went wrong';
};

type Q = Record<string, string | number | boolean | undefined | null | string[]>;
export const qs = (q?: Q) => {
  if (!q) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

async function request<T>(method: string, path: string, body?: unknown, q?: Q, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {};
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}${qs(q)}`, { method, headers, body: payload, signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }
  if (res.status === 204) return undefined as T;
  let data: any = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new ApiError(res.status, detailText(data?.detail));
  return data as T;
}

// Downscale big photos in the browser (serverless request bodies are limited to ~4.5 MB).
async function shrink(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || (file.size < 1_000_000 && file.type !== '')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export const api = {
  get: <T,>(path: string, q?: Q, signal?: AbortSignal) => request<T>('GET', path, undefined, q, signal),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T,>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}),
  patch: <T,>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  del: <T,>(path: string) => request<T>('DELETE', path),
  upload: async (file: File) => {
    const f = new FormData();
    f.append('file', await shrink(file), file.name);
    return request<{ url: string }>('POST', '/uploads', f);
  },
};

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
