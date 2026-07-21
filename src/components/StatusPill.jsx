import { useWorkspace } from '../lib/WorkspaceContext'

// Editorial style: colored dot + plain text instead of a filled pill
const statusDots = {
  'Research': '#9C948A',
  'In Conversation': '#4C6FBF',
  'On Hold': '#A97B1F',
  'Waiting onboarding': '#3F6577',
  'Onboarding': '#8A6A2A',
  'Trial': '#C05C81',
  'Won': '#3D8A5B',
  'Lost': '#B04343',
  'Former Client': '#6E4A8E',
}

export default function StatusPill({ status }) {
  const ctx = useWorkspace()
  const dot = statusDots[status] || '#9C948A'
  const label = ctx?.statusLabel ? ctx.statusLabel(status) : status
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      {label}
    </span>
  )
}
