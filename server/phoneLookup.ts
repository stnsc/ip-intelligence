import type { IncomingMessage, ServerResponse } from 'node:http'
import { normalizePhone } from '../shared/phone.ts'
import type { PhoneResult } from '../shared/phone.ts'

class LookupError extends Error {
  status: number
  retryAfter?: number
  constructor(status: number, message: string, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.slice(0, 200) : null
}

export function parseProviderResult(value: unknown, number: string, checkedAt: string): PhoneResult {
  if (!value || typeof value !== 'object') throw new Error('Invalid provider response')
  const data = value as Record<string, unknown>
  if (data.is_valid === false) throw new LookupError(422, 'This number could not be validated. Check the country code and number.')
  const reports = data.reports as Record<string, unknown> | undefined
  if (data.is_valid !== true || data.number !== number || !reports ||
    typeof reports.total !== 'number' || !Number.isSafeInteger(reports.total) || reports.total < 0 ||
    (reports.spam_score !== null && (typeof reports.spam_score !== 'number' ||
      !Number.isFinite(reports.spam_score) || reports.spam_score < 0 || reports.spam_score > 100))) {
    throw new Error('Invalid provider response')
  }
  const lastReported = optionalText(reports.last_reported_at)
  return {
    number,
    international: optionalText(data.international) ?? number,
    country: optionalText(data.country),
    numberType: optionalText(data.number_type),
    carrier: optionalText(data.carrier),
    location: optionalText(data.location),
    reportCount: reports.total,
    // Zero reports means unknown reputation, even if the provider returns a zero score.
    spamScore: reports.total === 0 ? null : reports.spam_score as number | null,
    lastReported: lastReported && Number.isFinite(Date.parse(lastReported)) ? lastReported : null,
    checkedAt,
  }
}

export function createPhoneLookup(fetcher: typeof fetch = fetch, now = Date.now) {
  const cache = new Map<string, { expires: number; result: PhoneResult }>()
  const pending = new Map<string, Promise<PhoneResult>>()
  let requests: number[] = []
  let blockedUntil = 0

  async function query(number: string): Promise<PhoneResult> {
    const timestamp = now()
    const cached = cache.get(number)
    if (cached && cached.expires > timestamp) return cached.result
    cache.delete(number)
    const running = pending.get(number)
    if (running) return running
    requests = requests.filter(time => time > timestamp - 60_000)
    const retryAt = Math.max(blockedUntil, requests.length >= 10 ? requests[0] + 60_000 : 0)
    if (retryAt > timestamp) {
      throw new LookupError(429, 'The free lookup service is busy. Please try again shortly.', Math.ceil((retryAt - timestamp) / 1000))
    }
    requests.push(timestamp)
    const task = (async () => {
      try {
        const response = await fetcher(`https://calltracer.io/api/lookup/${number.slice(1)}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(12_000),
          redirect: 'error',
        })
        if (response.status === 429) {
          const header = response.headers.get('retry-after')
          const seconds = header && /^\d+$/.test(header) ? Number(header) : 60
          const retryAfter = Math.min(3600, Math.max(1, seconds))
          blockedUntil = now() + retryAfter * 1000
          throw new LookupError(429, 'The reputation provider reached its free request limit. Please try again shortly.', retryAfter)
        }
        if (response.status === 400 || response.status === 422) {
          throw new LookupError(422, 'This number could not be validated. Check the country code and number.')
        }
        if (!response.ok) throw new Error('Provider unavailable')
        const result = parseProviderResult(await response.json(), number, new Date(now()).toISOString())
        if (cache.size >= 500) cache.delete(cache.keys().next().value!)
        cache.set(number, { expires: now() + 15 * 60_000, result })
        return result
      } catch (error) {
        if (error instanceof LookupError) throw error
        throw new LookupError(502, 'Phone reputation is temporarily unavailable. Please try again later.')
      }
    })()
    pending.set(number, task)
    try {
      return await task
    } finally {
      pending.delete(number)
    }
  }

  return async (input: unknown) => {
    let number: string
    try { number = normalizePhone(input) } catch (error) {
      throw new LookupError(400, (error as Error).message)
    }
    return query(number)
  }
}

export function createPhoneMiddleware(lookup = createPhoneLookup()) {
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (request.url?.split('?')[0] !== '/api/phone') { next(); return }
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    try {
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST')
        throw new LookupError(405, 'Use POST for phone lookups.')
      }
      if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
        throw new LookupError(415, 'Send the number as JSON.')
      }
      // Keep the endpoint same-origin and reject cross-site browser submissions.
      if (request.headers['sec-fetch-site'] === 'cross-site') throw new LookupError(403, 'Cross-site requests are not supported.')
      let body = ''
      for await (const chunk of request) {
        body += chunk.toString()
        if (Buffer.byteLength(body) > 256) throw new LookupError(413, 'Request is too large.')
      }
      let input: unknown
      try { input = JSON.parse(body) } catch { throw new LookupError(400, 'Invalid JSON request.') }
      const phone = input && typeof input === 'object' ? (input as Record<string, unknown>).phone : undefined
      response.end(JSON.stringify(await lookup(phone)))
    } catch (error) {
      const failure = error instanceof LookupError ? error : new LookupError(500, 'The lookup could not be completed.')
      response.statusCode = failure.status
      if (failure.retryAfter) response.setHeader('Retry-After', failure.retryAfter)
      response.end(JSON.stringify({ error: failure.message, retryAfter: failure.retryAfter }))
    }
  }
}
