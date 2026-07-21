// Centered loading state used by every page while data is being fetched.
export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[55vh]">
      <div className="w-9 h-9 rounded-full border-2 border-border border-t-accent animate-spin" />
      <div className="text-[13.5px] text-text-muted">{label}</div>
    </div>
  )
}
