import https from 'https';
import http from 'http';
import { URL } from 'url';

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface FetchResult {
  url: string;
  statusCode: number;
  body: unknown;
  durationMs: number;
}

export function fetchJson(url: string, options: FetchOptions = {}): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const start = Date.now();

    const req = transport.get(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        headers: {
          Accept: 'application/json',
          ...options.headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          const durationMs = Date.now() - start;
          try {
            const body = JSON.parse(raw);
            resolve({ url, statusCode: res.statusCode ?? 0, body, durationMs });
          } catch {
            reject(new Error(`Failed to parse JSON from ${url}: ${raw.slice(0, 120)}`));
          }
        });
      }
    );

    if (options.timeoutMs) {
      req.setTimeout(options.timeoutMs, () => {
        req.destroy(new Error(`Request to ${url} timed out after ${options.timeoutMs}ms`));
      });
    }

    req.on('error', reject);
  });
}
