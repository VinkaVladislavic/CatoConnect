const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

// "hace 2 horas", "ayer", "hace 3 días"...
export function timeAgo(dateString) {
  const seconds = Math.round((new Date(dateString).getTime() - Date.now()) / 1000)
  for (const [unit, secs] of UNITS) {
    if (Math.abs(seconds) >= secs) return rtf.format(Math.round(seconds / secs), unit)
  }
  return 'justo ahora'
}

// "Andrés Choque" -> "AC"
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
