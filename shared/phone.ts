export interface PhoneResult {
  number: string
  international: string
  country: string | null
  numberType: string | null
  carrier: string | null
  location: string | null
  reportCount: number
  spamScore: number | null
  lastReported: string | null
  checkedAt: string
}

// Require an explicit country prefix rather than guessing the user's country.
export function normalizePhone(value: unknown): string {
  if (typeof value !== 'string' || value.length > 64 || !/^[+\d\s().-]+$/.test(value)) {
    throw new Error('Enter a phone number with its country code, such as +40 712 345 678.')
  }
  const number = value.trim().replace(/[\s().-]/g, '').replace(/^00/, '+')
  if (!/^\+[1-9]\d{6,14}$/.test(number)) {
    throw new Error('Include + or 00 and the country code, followed by 7–15 digits in total. Extensions are not supported.')
  }
  return number
}
