export const PERIODS = [
  { value: 1, label: '1h' },
  { value: 6, label: '6h' },
  { value: 24, label: '24h' },
  { value: 72, label: '3d' },
  { value: 168, label: '7d' },
  { value: 720, label: '30d' },
]

export function periodLabel(hours: number): string {
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  const days = hours / 24
  return Number.isInteger(days) ? `${days} ${days === 1 ? 'day' : 'days'}` : `${hours} hours`
}
