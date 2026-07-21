import { useState } from 'react'
import SidePeek, { FormField, Input, Textarea, TabSelect, Toggle, TimeInput, SearchableSelect, TagInput } from '../../components/SidePeek'
import DatePicker from '../../components/DatePicker'
import { activityTypes, activityTypeColors } from './constants'
import { formatDate } from '../../lib/utils'
import { CornerDownRight } from 'lucide-react'

// Thread of short timestamped additions under an existing activity, with a
// quick composer — no type/title, just text.
function ActivityUpdates({ updates, onAdd }) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!draft.trim() || saving) return
    setSaving(true)
    const ok = await onAdd(draft)
    setSaving(false)
    if (ok) setDraft('')
  }

  return (
    <FormField label={updates.length > 0 ? `Updates (${updates.length})` : 'Add update'}>
      {updates.length > 0 && (
        <div className="flex flex-col gap-2 mb-2.5 border-l-2 border-border pl-3">
          {updates.map(u => (
            <div key={u.id}>
              <div className="text-[14px] text-text-primary whitespace-pre-wrap">{u.body}</div>
              <div className="text-[12px] text-text-muted mt-0.5">{formatDate(u.created_at)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <Textarea value={draft} onChange={setDraft} placeholder="Add an update to this activity..." rows={2} />
      </div>
      {draft.trim() && (
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 bg-text-primary text-bg rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          <CornerDownRight size={13} />
          {saving ? 'Saving...' : 'Add update'}
        </button>
      )}
    </FormField>
  )
}

// The four side-peek forms (task/note/activity/contact) shared by the
// company detail page — all driven by the same peek state + handlers.
export default function PeekForms({ peek, setPeekData, closePeek, savePeek, deletePeekItem, activityUpdates = [], onAddUpdate, contacts = [] }) {
  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }))
  return (
    <>
      <SidePeek title={peek.data?.id ? 'Edit task' : 'New task'} open={peek.type === 'task'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Title *"><Input value={peek.data?.title} onChange={v => setPeekData('title', v)} placeholder="Task description" /></FormField>
        <FormField label="Due date"><DatePicker value={peek.data?.due_date} onChange={v => setPeekData('due_date', v)} /></FormField>
      </SidePeek>

      <SidePeek title={peek.data?.id ? 'Edit note' : 'New note'} open={peek.type === 'note'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Content *"><Textarea value={peek.data?.body} onChange={v => setPeekData('body', v)} rows={6} placeholder="Write a note..." /></FormField>
      </SidePeek>

      <SidePeek title={peek.data?.id ? 'Edit activity' : 'New activity'} open={peek.type === 'activity'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined} wide>
        <FormField label="Type"><TabSelect value={peek.data?.type} onChange={v => setPeekData('type', v)} options={activityTypes} colors={activityTypeColors} /></FormField>
        <FormField label="Contact"><SearchableSelect value={peek.data?.contact_id || ''} onChange={v => setPeekData('contact_id', v)} options={contactOptions} placeholder="Who did you talk to?" /></FormField>
        <FormField label="Title *"><Input value={peek.data?.title} onChange={v => setPeekData('title', v)} placeholder="Activity title" /></FormField>
        <FormField label="Description"><Textarea value={peek.data?.body} onChange={v => setPeekData('body', v)} placeholder="Additional info..." rows={12} /></FormField>
        <FormField label="Reminder">
          <div className="grid grid-cols-2 gap-2">
            <DatePicker value={peek.data?.reminder} onChange={v => setPeekData('reminder', v)} placeholder="Pick a date" />
            <TimeInput value={peek.data?.reminder_time?.slice(0, 5)} onChange={v => setPeekData('reminder_time', v)} />
          </div>
        </FormField>
        {peek.data?.id && onAddUpdate && (
          <ActivityUpdates updates={activityUpdates} onAdd={text => onAddUpdate(peek.data, text)} />
        )}
      </SidePeek>

      <SidePeek title={peek.data?.id ? 'Edit contact' : 'New contact'} open={peek.type === 'contact'} onClose={closePeek} onSave={savePeek} onDelete={peek.data?.id ? deletePeekItem : undefined}>
        <FormField label="Name *"><Input value={peek.data?.name} onChange={v => setPeekData('name', v)} placeholder="First Last" /></FormField>
        <FormField label="Role"><Input value={peek.data?.role} onChange={v => setPeekData('role', v)} placeholder="e.g. CEO" /></FormField>
        <FormField label="Email"><Input value={peek.data?.email} onChange={v => setPeekData('email', v)} type="email" placeholder="name@company.com" /></FormField>
        <FormField label="Other emails"><TagInput value={peek.data?.alt_emails} onChange={v => setPeekData('alt_emails', v)} placeholder="e.g. personal email — press Enter" /></FormField>
        <FormField label="Phone"><Input value={peek.data?.phone} onChange={v => setPeekData('phone', v)} placeholder="+372 ..." /></FormField>
        <div className="flex items-center gap-6 mb-3">
          <Toggle checked={peek.data?.is_primary || false} onChange={v => setPeekData('is_primary', v)} label="Primary contact" />
          <Toggle checked={peek.data?.newsletter || false} onChange={v => setPeekData('newsletter', v)} label="Newsletter" />
        </div>
        <FormField label="Notes"><Textarea value={peek.data?.notes || ''} onChange={v => setPeekData('notes', v)} placeholder="e.g. lapsehoolduspuhkusel..." rows={3} /></FormField>
      </SidePeek>
    </>
  )
}
