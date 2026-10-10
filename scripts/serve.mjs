// A tiny web server for the site folder. Used by `pnpm dev` and by the browser tests.
// It also applies the rules in site/_headers, so what you test is what Cloudflare serves.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

/** Read site/_headers into [{ prefix, headers }]. Only "/*" and "/folder/*" patterns are supported. */
function readRules(root) {
  const file = join(root, '_headers');
  if (!existsSync(file)) return [];
  const rules = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) {
      rules.push({ prefix: line.trim().replace(/\*$/, ''), headers: {} });
    } else if (rules.length) {
      const i = line.indexOf(':');
      rules[rules.length - 1].headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

export function startServer(root = 'site', port = 0) {
  const base = resolve(root);
  const rules = readRules(base);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      let path = normalize(decodeURIComponent(url.pathname));
      let file = resolve(join(base, path));
      if (file !== base && !file.startsWith(base + sep)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      const info = await stat(file).catch(() => null);
      if (info && info.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: url.pathname + '/' }).end();
          return;
        }
        file = join(file, 'index.html');
        path = join(path, 'index.html');
      }
      const body = await readFile(file);
      const headers = { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' };
      for (const r of rules) if (url.pathname.startsWith(r.prefix)) Object.assign(headers, r.headers);
      res.writeHead(200, headers).end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    }
  });
  return new Promise((done) => server.listen(port, '127.0.0.1', () => done(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = await startServer('site', Number(process.env.PORT) || 4173);
  const addr = server.address();
  console.log('UteDocs is running. Open http://localhost:' + (typeof addr === 'object' && addr ? addr.port : '4173') + '/app/');
}
