import { KeyRound, Plug, ArrowLeftRight } from 'lucide-react'

// Placeholder home for external access: API keys, MCP server and
// integrations (e.g. Hours data sync) land here as they ship.
const sections = [
  {
    icon: KeyRound,
    title: 'API keys',
    description: 'Create workspace-scoped keys for external tools. Each key gets its own permissions (read or read-write, per module) and can be revoked at any time.',
  },
  {
    icon: Plug,
    title: 'MCP server',
    description: 'Connect AI assistants like Claude directly to this workspace — ask about pipeline status, timelines and next steps, or log activities by chat.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Integrations',
    description: 'Two-way data sync with other systems, starting with Hours — move customer and usage data in and out automatically.',
  },
]

export default function Connections() {
  return (
    <div className="max-w-[560px]">
      <div className="bg-surface">
        <h2 className="font-serif text-[18px] font-semibold text-text-primary m-0">Connections</h2>
        <p className="text-[13px] text-text-muted mt-1 mb-5">
          Securely connect Nodus to the outside world — AI assistants, integrations and your own tools.
        </p>

        <div className="flex flex-col gap-2">
          {sections.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3.5 rounded-xl bg-border-light px-4 py-3.5">
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface text-text-secondary shrink-0 mt-0.5">
                <Icon size={17} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14.5px] font-medium text-text-primary">{title}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted bg-surface rounded-full px-2 py-0.5">Coming soon</span>
                </div>
                <p className="text-[13px] text-text-secondary mt-1 mb-0">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
