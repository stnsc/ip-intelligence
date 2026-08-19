import { useEffect, useState } from 'react'
import './App.css'
import IpModal from './components/IpModal'
import { fetchIpData } from './services/ipLookup'
import type { IpData } from './services/ipLookup'

type FraudTier = 'low' | 'medium' | 'high' | 'critical'

function getFraudTier(score: number): FraudTier {
  if (score <= 0.29) return 'low'
  if (score <= 0.59) return 'medium'
  if (score <= 0.79) return 'high'
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

function isValidIp(ip: string): boolean {
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
  const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
  return ipv4.test(ip) || ipv6.test(ip)
}

const initialIpData: IpData = {
  ip: 'Press [SPACE]',
  verdict: '',
  score: 0,
  confidence: 0,
  isVpn: false,
  isProxy: false,
  vpnProvider: null,
  asn: 'N/A',
  org: 'N/A',
  isp: 'N/A',
  country: 'N/A',
  countryCode: 'N/A',
  city: 'N/A',
  lat: 0,
  lon: 0,
  type: 'N/A',
  signals: [],
  requestId: 'N/A'
}

function App() {
  const [ipAddress, setIpAddress] = useState(initialIpData.ip)
  const [modalOpen, setModalOpen] = useState(false)
  const [ipData, setIpData] = useState<IpData>(initialIpData)
  const [loading, setLoading] = useState(false)
  const [ipIsValid, setIpIsValid] = useState(true)

  const fraudScore = ipData.score
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

  const handleIpSubmit = async (ip: string) => {
    const trimmedIp = ip.trim()

    if (!isValidIp(trimmedIp)) {
      setIpAddress(trimmedIp)
      setIpIsValid(false)
      setLoading(false)
      return
    }

    setIpIsValid(true)
    setIpAddress(trimmedIp)
    setLoading(true)

    try {
      const data = await fetchIpData(trimmedIp)
      setIpData(data)
      setIpAddress(data.ip)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'N/A'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    return String(value)
  }

  const matchedSignals = ipData.signals.filter(signal => signal.matched).length
  const totalSignals = ipData.signals.length

  const hasCoordinates = ipData.lat !== 0 || ipData.lon !== 0
  const lonMin = ipData.lon - 0.01
  const latMin = ipData.lat - 0.01
  const lonMax = ipData.lon + 0.01
  const latMax = ipData.lat + 0.01
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lonMin}%2C${latMin}%2C${lonMax}%2C${latMax}&layer=mapnik&marker=${ipData.lat}%2C${ipData.lon}`

  return (
    <>
      <section id="background" className="background-element"></section>
      <section id="foreground" className="foreground-element">
          <div className={`box ip-display ${ipIsValid ? '' : 'invalid'}`}>
            <p id="ip-address-text">IP Address:</p>
            <p id="ip-address-value" className="font-xanh-mono">{formatIpForDisplay(ipAddress)}</p>
          </div>

          <div className={`fraud-score-container ${tier}`}>
            <div className="fraud-score">
              <p id="fraud-score-text">Risk Score:</p>
              <p id="fraud-score-value">{Math.round(fraudScore * 100)}%</p>
            </div>
          </div>

          <div className="info-boxes-container">
            <div className="box info-box network-location-box">
              <h2 className="info-box-title">Network & Location</h2>
              <div className="info-sections">
                <div className="info-section">
                  <div className="info-row"><span>ASN</span><span>{ipData.asn}</span></div>
                  <div className="info-row"><span>Organization</span><span>{ipData.org}</span></div>
                  <div className="info-row"><span>ISP</span><span>{ipData.isp}</span></div>
                  <div className="info-row"><span>Country</span><span>{ipData.country}</span></div>
                  <div className="info-row"><span>Country Code</span><span>{ipData.countryCode}</span></div>
                  <div className="info-row"><span>City</span><span>{ipData.city}</span></div>
                  <div className="info-row"><span>Coordinates</span><span>{`${ipData.lat}, ${ipData.lon}`}</span></div>
                  <div className="info-row"><span>Type</span><span>{ipData.type}</span></div>
                </div>
              </div>
            </div>

            <div className="box info-box map-box">
              <h2 className="info-box-title">Location Map</h2>
              {hasCoordinates ? (
                <iframe
                  title="IP Location Map"
                  className="map-embed"
                  src={mapSrc}
                  loading="lazy"
                />
              ) : (
                <p className="map-placeholder">Enter an IP address to see its location on the map.</p>
              )}
            </div>

            <div className="box info-box risk-box">
              <h2 className="info-box-title">VPN & Risk</h2>
              <div className="info-sections">
                <div className="info-section">
                  <div className="info-row"><span>Verdict</span><span>{ipData.verdict || 'N/A'}</span></div>
                  <div className="info-row"><span>Score</span><span>{Math.round(ipData.score * 100)}%</span></div>
                  <div className="info-row"><span>Confidence</span><span>{Math.round(ipData.confidence * 100)}%</span></div>
                  <div className="info-row"><span>VPN</span><span>{formatValue(ipData.isVpn)}</span></div>
                  <div className="info-row"><span>Proxy</span><span>{formatValue(ipData.isProxy)}</span></div>
                  <div className="info-row"><span>VPN Provider</span><span>{formatValue(ipData.vpnProvider)}</span></div>
                </div>
              </div>
            </div>

            <div className="box info-box signals-box">
              <h2 className="info-box-title">Signals & Request</h2>
              <div className="info-sections">
                <div className="info-section">
                  <div className="info-row"><span>Request ID</span><span>{ipData.requestId}</span></div>
                  <div className="info-row"><span>Matched Signals</span><span>{matchedSignals} / {totalSignals}</span></div>
                  {ipData.signals.map(signal => (
                    <div className="info-row" key={signal.type}>
                      <span>{signal.type}</span>
                      <span>{signal.matched ? 'Yes' : 'No'} ({signal.weight})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </section>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-modal">
            <div className="loading-spinner"></div>
            <p className="loading-text">Looking up IP...</p>
          </div>
        </div>
      )}

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
