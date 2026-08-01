const WEEKDAY_MAP: Record<string, string> = {
  Mon: 'MON',
  Tue: 'TUE',
  Wed: 'WED',
  Thu: 'THU',
  Fri: 'FRI',
  Sat: 'SAT',
  Sun: 'SUN',
}

export interface ZonedNow {
  date: string
  time: string
  weekday: string
  minutes: number
}

/** Horloge locale dans un fuseau IANA (ex. Europe/Paris). */
export function getZonedNow(timeZone: string, reference = new Date()): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(reference)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  const weekdayShort = get('weekday')
  const weekday = WEEKDAY_MAP[weekdayShort] ?? 'MON'
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`

  return {
    date: `${year}-${month}-${day}`,
    time,
    weekday,
    minutes: Number(hour) * 60 + Number(minute),
  }
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function normalizeTime(value: string | Date): string {
  if (value instanceof Date) {
    const h = String(value.getUTCHours()).padStart(2, '0')
    const m = String(value.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  return value.slice(0, 5)
}
