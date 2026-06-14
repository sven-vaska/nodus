const colors = ['#4f46e5', '#16a34a', '#d97706', '#e11d48', '#64748b', '#0891b2']

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export default function Avatar({ name, size = 26 }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const bg = colors[hashCode(name || '') % colors.length]

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}
