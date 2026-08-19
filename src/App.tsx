import { useEffect, useState } from 'react'
import './App.css'
import IpModal from './components/IpModal'

type FraudTier = 'low' | 'medium' | 'high' | 'critical'

function getFraudTier(score: number): FraudTier {
  if (score <= 29) return 'low'
  if (score <= 59) return 'medium'
  if (score <= 79) return 'high'
  return 'critical'
}

function formatIpForDisplay(ip: string): string {
  const isIPv6 = ip.includes(':')
  const shouldShorten = isIPv6 && ip.length > 16

  if (!shouldShorten) return ip

  const prefixLength = 9
  const suffixLength = 9

  return `${ip.slice(0, prefixLength)}:...:${ip.slice(-suffixLength)}`
}

// placeholder data
const ipData = {
  "ip": "8.8.8.8",
  "risk": {
    "score": 3,
    "reasons": []
  },
  network: {
    asn: 'AS15169',
    organization: 'Google LLC',
    domain: 'google.com'
  },
  location: {
    country: 'United States',
    countryCode: 'US',
    continent: 'North America'
  },
  abuse: {
    confidenceScore: 0,
    totalReports: 0,
    distinctReporters: 0,
    lastReportedAt: null,
    isTor: false,
    usageType: null,
    isp: null,
    domain: null,
    hostnames: []
  },
  sources: {
    ipinfo: 'success',
    abuseipdb: 'success'
  }
}

function App() {
  const [ipAddress, setIpAddress] = useState(ipData.ip)
  const [modalOpen, setModalOpen] = useState(false)
  const [fraudScore, setFraudScore] = useState(ipData.risk.score)

  const tier = getFraudTier(fraudScore)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !modalOpen) {
        event.preventDefault()
        setModalOpen(true)
      } else if (event.code === 'Escape' && modalOpen) {
        setModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalOpen])

  const handleIpSubmit = (ip: string) => {
    setIpAddress(ip)
  }

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'N/A'
    if (Array.isArray(value) && value.length === 0) return 'None'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  return (
    <>
      <section id="background" className="background-element"></section>
      <section id="foreground" className="foreground-element">
          <div className="box ip-display">
            <p id="ip-address-text">IP Address:</p>
            <p id="ip-address-value" className="font-xanh-mono">{formatIpForDisplay(ipAddress)}</p>
          </div>

          <div className={`fraud-score-container ${tier}`}>
            <div className="fraud-score">
              <p id="fraud-score-text">Fraud Score:</p>
              <p id="fraud-score-value">{ipData.risk.score}%</p>
            </div>
          </div>

          <div className="info-boxes-container">
            <div className="box info-box network-location-box" >
              <h2 className="info-box-title">Network & Location</h2>
              <div className="info-sections">
                <div className="info-section">
                  <h3>Network</h3>
                  <div className="info-row"><span>ASN</span><span>{ipData.network.asn}</span></div>
                  <div className="info-row"><span>Organization</span><span>{ipData.network.organization}</span></div>
                  <div className="info-row"><span>Domain</span><span>{ipData.network.domain}</span></div>
                </div>
                <div className="info-section">
                  <h3>Location</h3>
                  <div className="info-row"><span>Country</span><span>{ipData.location.country}</span></div>
                  <div className="info-row"><span>Country Code</span><span>{ipData.location.countryCode}</span></div>
                  <div className="info-row"><span>Continent</span><span>{ipData.location.continent}</span></div>
                </div>
              </div>
            </div>

            <div className="box info-box abuse-box">
              <h2 className="info-box-title">Abuse</h2>
              <div className="info-sections">
                <div className="info-section">
                  <div className="info-row"><span>Confidence Score</span><span>{formatValue(ipData.abuse.confidenceScore)}</span></div>
                  <div className="info-row"><span>Total Reports</span><span>{formatValue(ipData.abuse.totalReports)}</span></div>
                  <div className="info-row"><span>Distinct Reporters</span><span>{formatValue(ipData.abuse.distinctReporters)}</span></div>
                  <div className="info-row"><span>Last Reported At</span><span>{formatValue(ipData.abuse.lastReportedAt)}</span></div>
                  <div className="info-row"><span>Is Tor</span><span>{formatValue(ipData.abuse.isTor)}</span></div>
                  <div className="info-row"><span>Usage Type</span><span>{formatValue(ipData.abuse.usageType)}</span></div>
                  <div className="info-row"><span>ISP</span><span>{formatValue(ipData.abuse.isp)}</span></div>
                  <div className="info-row"><span>Domain</span><span>{formatValue(ipData.abuse.domain)}</span></div>
                  <div className="info-row"><span>Hostnames</span><span>{formatValue(ipData.abuse.hostnames)}</span></div>
                </div>
              </div>
            </div>

            <div className="box info-box sources-box">
              <h2 className="info-box-title">Sources</h2>
              <div className="info-sections">
                <div className="info-section">
                  <div className="info-row"><span>IPinfo</span><span>{ipData.sources.ipinfo}</span></div>
                  <div className="info-row"><span>AbuseIPDB</span><span>{ipData.sources.abuseipdb}</span></div>
                </div>
              </div>
            </div>
          </div>
      </section>

      <section id="footer" className="footer-element">
        <p className="font-xanh-mono italic" style={{ fontSize: '1.3rem' }}>IP Intelligence</p>
        <p className="font-xanh-mono">made by Vlad in 2026.</p>
        <p className="font-xanh-mono"><a href="https://stnsc.net" target="_blank" rel="noopener noreferrer">stnsc.net</a></p>
      </section>

      <IpModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleIpSubmit}
      />
    </>
  )
}

export default App
