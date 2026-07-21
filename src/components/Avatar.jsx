// Warm pastel pairs from the editorial design — soft bg, deep tone text
const colors = [
  ['#EFE3D3', '#8A6A2A'],
  ['#E3E7DB', '#4E6A3D'],
  ['#F0DFDB', '#9C4A3C'],
  ['#E6E2EF', '#6E4A8E'],
  ['#DDE4E8', '#3F6577'],
  ['#E8E1D6', '#5C554B'],
]

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export default function Avatar({ name, size = 26, src }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const [bg, text] = colors[hashCode(name || '') % colors.length]

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, color: text, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  )
}
