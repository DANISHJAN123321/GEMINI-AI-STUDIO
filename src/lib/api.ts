/**
 * Robust API fetch client for server-side Gemini and backend endpoints.
 * Prevents JSON parsing errors when server returns HTML or text error responses.
 */

export class ApiError extends Error {
  status: number;
  isQuotaExceeded: boolean;
  details?: string;

  constructor(message: string, status: number, isQuotaExceeded = false, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isQuotaExceeded = isQuotaExceeded;
    this.details = details;
  }
}

export async function fetchApi<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    const rawText = await res.text().catch(() => '');
    if (!res.ok) {
      const isQuota = res.status === 429;
      throw new ApiError(
        isQuota
          ? 'Quota exceeded for this model. Switch to Flash Lite or configure a paid API key.'
          : `Server error (${res.status}): ${rawText.slice(0, 120)}`,
        res.status,
        isQuota
      );
    }
  }

  if (!res.ok) {
    const isQuota =
      res.status === 429 ||
      Boolean(data?.isQuotaExceeded) ||
      (data?.error && typeof data.error === 'string' && data.error.includes('Quota'));

    const errorMsg =
      data?.error ||
      data?.message ||
      `Request failed with status ${res.status}`;

    throw new ApiError(errorMsg, res.status, isQuota, data?.details);
  }

  return data as T;
}
