import type { IncomingMessage, ServerResponse } from 'node:http'
import { createPhoneMiddleware } from '../server/phoneLookup.ts'

// Vercel discovers this file as /api/phone; Vite's middleware is local only.
const phone = createPhoneMiddleware()

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await phone(request, response, () => {
    response.writeHead(404, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'Unknown API route.' }))
  })
}
