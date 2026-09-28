import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, resolve, sep } from 'node:path'
import { createPhoneMiddleware } from './phoneLookup.ts'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const phone = createPhoneMiddleware()
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json',
}

const server = createServer((request, response) => {
  void phone(request, response, () => {
    void (async () => {
      try {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return
        }
        const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
        const file = resolve(dist, `.${path === '/' ? '/index.html' : path}`)
        if (!file.startsWith(resolve(dist) + sep)) { response.writeHead(403).end(); return }
        const content = await readFile(file)
        response.writeHead(200, {
          'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        })
        response.end(request.method === 'HEAD' ? undefined : content)
      } catch {
        response.writeHead(404).end('Not found')
      }
    })()
  })
})
server.requestTimeout = 15_000
server.headersTimeout = 10_000
server.listen(Number(process.env.PORT ?? 8787), process.env.HOST ?? '127.0.0.1', () => {
  console.log('IP Intelligence server listening on', server.address())
})
