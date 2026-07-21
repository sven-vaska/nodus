import { Paperclip } from 'lucide-react'

export default function FilesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[14px] font-medium text-text-secondary">Files</span>
        <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 border-none rounded-xl bg-border-light text-[13px] font-medium text-text-primary hover:bg-border-light transition-colors cursor-pointer">
          <Paperclip size={14} className="text-text-secondary" /> Upload file
        </button>
      </div>
      <div className="text-[14px] text-text-muted">No files added yet.</div>
    </div>
  )
}
