export interface RetryOptions {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const { retries = 2, backoffMs = 600, timeoutMs = 15000 } = options;

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        mode: 'cors',
        keepalive: true,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        if (attempt === retries) throw lastError;
      } else {
        return res;
      }
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt === retries) throw err;
      // exponential backoff
      const wait = backoffMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
    }

    attempt += 1;
  }

  throw lastError ?? new Error('Network error');
}
