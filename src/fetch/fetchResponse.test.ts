import http from 'http';
import { fetchJson } from './fetchResponse';

let server: http.Server;
let port: number;

beforeAll((done) => {
  server = http.createServer((req, res) => {
    if (req.url === '/timeout') {
      // never respond
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ user: { id: 1, name: 'Alice' } }));
  });
  server.listen(0, () => {
    port = (server.address() as { port: number }).port;
    done();
  });
});

afterAll((done) => server.close(done));

describe('fetchJson', () => {
  it('fetches and parses JSON', async () => {
    const result = await fetchJson(`http://localhost:${port}/api`);
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({ user: { id: 1, name: 'Alice' } });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.url).toContain('localhost');
  });

  it('rejects on timeout', async () => {
    await expect(
      fetchJson(`http://localhost:${port}/timeout`, { timeoutMs: 50 })
    ).rejects.toThrow(/timed out/);
  });

  it('rejects on invalid JSON', async () => {
    const badServer = http.createServer((_, res) => {
      res.writeHead(200);
      res.end('not-json');
    });
    await new Promise<void>((r) => badServer.listen(0, r));
    const badPort = (badServer.address() as { port: number }).port;
    await expect(fetchJson(`http://localhost:${badPort}/`)).rejects.toThrow(/Failed to parse JSON/);
    await new Promise<void>((r) => badServer.close(r));
  });
});
