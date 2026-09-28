import { useEffect, useRef, useState } from 'react'
import { normalizePhone } from '../../shared/phone'
import type { PhoneResult } from '../../shared/phone'

function PhoneLookup() {
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<PhoneResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    controller.current?.abort()
    setResult(null)
    setError(null)
    let number: string
    try { number = normalizePhone(phone) } catch (error) {
      setError((error as Error).message)
      return
    }
    const current = new AbortController()
    controller.current = current
    setLoading(true)
    try {
      const response = await fetch('/api/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: number }),
        signal: AbortSignal.any([current.signal, AbortSignal.timeout(20_000)]),
      })
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('The phone lookup service is unavailable. Please try again later.')
      }
      const data = await response.json()
      if (!response.ok) {
        const retry = typeof data.retryAfter === 'number' ? ` Retry in ${data.retryAfter} seconds.` : ''
        throw new Error((data.error || 'The lookup could not be completed.') + retry)
      }
      if (!current.signal.aborted) setResult(data as PhoneResult)
    } catch (error) {
      if (!current.signal.aborted) {
        setError(error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError'
          ? error.message : 'The phone lookup service could not be reached. Please try again.')
      }
    } finally {
      if (!current.signal.aborted) setLoading(false)
    }
  }

  return (
    <section className="phone-page" aria-labelledby="phone-title">
      <header className="lookup-heading">
        <h1 id="phone-title">Phone number reputation</h1>
        <p>Look up international number details and community spam reports.</p>
      </header>
      <form className="box phone-form" onSubmit={submit}>
        <label htmlFor="phone-number">Phone number</label>
        <div className="phone-input-row">
          <input id="phone-number" type="tel" autoComplete="off" inputMode="tel"
            value={phone} onChange={event => setPhone(event.target.value)}
            placeholder="+40 712 345 678" maxLength={64} required disabled={loading}
            aria-describedby="phone-hint" />
          <button type="submit" disabled={loading}>{loading ? 'Looking up…' : 'Lookup'}</button>
        </div>
        <p id="phone-hint" className="phone-note">Include the country code with + or 00. The number is sent to CallTracer when you look it up.</p>
      </form>
      {loading && <p role="status" className="phone-status">Checking community reports…</p>}
      {error && <p className="lookup-error" role="alert">{error}</p>}
      {result && (
        <div className="phone-results" aria-live="polite">
          <div className="box phone-summary">
            <p className="font-xanh-mono phone-number">{result.international}</p>
            <h2>{result.reportCount > 0 ? 'Community reports found' : 'No community reports found'}</h2>
            <div className="phone-metrics">
              <div><span>Reports</span><strong>{result.reportCount.toLocaleString()}</strong></div>
              <div><span>CallTracer spam score</span><strong>{result.spamScore === null ? 'Unknown' : `${result.spamScore} / 100`}</strong></div>
            </div>
            <p className="phone-note">{result.reportCount === 0
              ? 'This source has no reports for this number. Its reputation is unknown; no reports does not mean it is safe.'
              : 'This is a community signal, not a verified fraud verdict or a carrier’s “Spam Likely” label. Caller ID can be spoofed.'}</p>
          </div>
          <div className="box info-box">
            <h2 className="info-box-title">Number details</h2>
            {[
              ['International number', result.number],
              ['Country / territory', result.country],
              ['Line type', result.numberType],
              ['Carrier', result.carrier],
              ['Numbering region', result.location],
              ['Last reported', result.lastReported ? new Date(result.lastReported).toLocaleDateString() : null],
              ['Retrieved', new Date(result.checkedAt).toLocaleString()],
            ].map(([label, value]) => (
              <div className="info-row" key={label}><span>{label}</span><span>{value || 'Not available'}</span></div>
            ))}
            <p className="phone-note">Number details describe its numbering plan; they do not verify the caller’s identity, current location, or whether the line is active.</p>
          </div>
        </div>
      )}
      <p className="lookup-source">Source: <a href="https://calltracer.io/" target="_blank" rel="noopener noreferrer">CallTracer</a>. Coverage varies by number and country. Results may be cached for 15 minutes.</p>
    </section>
  )
}

export default PhoneLookup
