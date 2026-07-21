import { activityIcons, activityTypeColors } from './constants'
import { MoreHorizontal } from 'lucide-react'

// Colored icon chip for activity/email types — shared by the Overview and
// Activity timelines.
export default function TypeIcon({ type, size = 24 }) {
  const Icon = activityIcons[type] || MoreHorizontal
  const c = activityTypeColors[type] || { bg: '#F2EDE5', text: '#7C756A' }
  return (
    <span
      className="rounded-md flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: c.bg, color: c.text }}
    >
      <Icon size={Math.round(size * 0.55)} />
    </span>
  )
}
