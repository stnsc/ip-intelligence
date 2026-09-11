export interface Signal {
  type: string
  weight: number
  matched: boolean
  detail: string
}

export interface IpData {
  ip: string
  verdict: string
  score: number
  confidence: number
  isVpn: boolean
  isProxy: boolean
  vpnProvider: string | null
  asn: string
  org: string
  isp: string
  country: string
  countryCode: string
  city: string
  lat: number
  lon: number
  type: string
  signals: Signal[]
  requestId: string
}

interface PublicIpResponse {
  ip: string
}

interface DnsResponse {
  Answer?: Array<{ type: number; data: string }>
}

interface IpLogsResponse {
  verdict: string
  score: number
  is_vpn: boolean
  confidence: number
  ip_info: {
    ip: string
    asn: string
    org: string
    isp: string
    country: string
    country_code: string
    city: string
    lat: number
    lon: number
    type: string
    is_vpn: boolean
    is_proxy: boolean
    vpn_provider: string | null
  }
  signals: Signal[]
  request_id: string
}

export async function fetchIpData(ip: string): Promise<IpData> {
  const response = await fetch('https://iplogs.com/v1/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ip })
  })

  if (!response.ok) {
    throw new Error(`IPLogs request failed with status ${response.status}`)
  }

  const data: IpLogsResponse = await response.json()

  return {
    ip: data.ip_info.ip,
    verdict: data.verdict,
    score: data.score,
    confidence: data.confidence,
    isVpn: data.is_vpn,
    isProxy: data.ip_info.is_proxy,
    vpnProvider: data.ip_info.vpn_provider,
    asn: data.ip_info.asn,
    org: data.ip_info.org,
    isp: data.ip_info.isp,
    country: data.ip_info.country,
    countryCode: data.ip_info.country_code,
    city: data.ip_info.city,
    lat: data.ip_info.lat,
    lon: data.ip_info.lon,
    type: data.ip_info.type,
    signals: data.signals,
    requestId: data.request_id
  }
}

export async function fetchPublicIp(): Promise<string> {
  const response = await fetch('https://api64.ipify.org?format=json')

  if (!response.ok) {
    throw new Error(`Public IP request failed with status ${response.status}`)
  }

  const data: PublicIpResponse = await response.json()
  return data.ip
}

function getReverseDnsName(ip: string): string {
  if (ip.includes(':')) {
    const normalized = ip
      .replace(/^::ffff:/i, '')
      .split('::')

    if (normalized.length === 2) {
      const left = normalized[0] ? normalized[0].split(':') : []
      const right = normalized[1] ? normalized[1].split(':') : []
      const missingGroups = 8 - left.length - right.length
      ip = [...left, ...Array(missingGroups).fill('0'), ...right]
        .map(group => group.padStart(4, '0'))
        .join('')
    } else {
      ip = ip.split(':').map(group => group.padStart(4, '0')).join('')
    }

    return `${ip.split('').reverse().join('.')}.ip6.arpa`
  }

  return `${ip.split('.').reverse().join('.')}.in-addr.arpa`
}

export async function fetchReverseDns(ip: string): Promise<string | null> {
  const name = getReverseDnsName(ip)
  const response = await fetch(`https://dns.google/resolve?name=${name}&type=PTR`)

  if (!response.ok) {
    throw new Error(`Reverse DNS request failed with status ${response.status}`)
  }

  const data: DnsResponse = await response.json()
  return data.Answer?.find(answer => answer.type === 12)?.data.replace(/\.$/, '') ?? null
}
