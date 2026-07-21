import Avatar from '../../../components/Avatar'
import { EditableAttrRow, EditableSelect, EditableTagList, AttrRow, SidebarGroup } from '../EditableFields'
import { sourceOptions, countyOptions, defaultSectors, deviceOptions } from '../constants'
import { Check, Mail, Phone, Plus } from 'lucide-react'

export default function MobileDetailsTab({ company, contacts, onUpdateField, onOpenContact, onAddContact, onTogglePrimary }) {
  return (
    <div className="space-y-5">
      <SidebarGroup title="General Information">
        <EditableAttrRow label="Website" value={company.www} field="www" onSave={onUpdateField} render={v => v ? <a href={v.startsWith('http') ? v : `https://${v}`} target="_blank" rel="noopener" className="text-accent hover:underline" onClick={e => e.stopPropagation()}>{v.replace(/^https?:\/\//, '')}</a> : null} />
        <EditableAttrRow label="Description" value={company.description} field="description" onSave={onUpdateField} type="textarea" />
        <EditableAttrRow label="Company no." value={company.company_no} field="company_no" onSave={onUpdateField} />
        <EditableAttrRow label="Email" value={company.email} field="email" onSave={onUpdateField} inputType="email" />
        <EditableAttrRow label="Phone" value={company.phone} field="phone" onSave={onUpdateField} />
        <AttrRow label="Source">
          <EditableSelect value={company.source} field="source" options={sourceOptions} onSave={onUpdateField} multi />
        </AttrRow>
        <AttrRow label="Newsletter">
          <input type="checkbox" checked={company.newsletter || false} onChange={e => onUpdateField('newsletter', e.target.checked)} className="w-4 h-4 accent-accent cursor-pointer" />
        </AttrRow>
        <EditableAttrRow label="Users" value={company.users_count} field="users_count" onSave={(f, v) => onUpdateField(f, v ? Number(v) : null)} inputType="number" />
      </SidebarGroup>

      <SidebarGroup title="Address">
        <EditableAttrRow label="Address" value={company.address} field="address" onSave={onUpdateField} />
        <AttrRow label="County">
          <EditableSelect value={company.county} field="county" options={countyOptions} onSave={onUpdateField} />
        </AttrRow>
      </SidebarGroup>

      <SidebarGroup title="Industry">
        <AttrRow label="Sector">
          <EditableTagList value={company.sector} field="sector" defaults={defaultSectors} onSave={onUpdateField} />
        </AttrRow>
        <AttrRow label="Device">
          <EditableSelect value={company.device} field="device" options={deviceOptions} onSave={onUpdateField} multi />
        </AttrRow>
      </SidebarGroup>

      <SidebarGroup title="Contact Persons" action={<button onClick={onAddContact} className="flex items-center gap-0.5 text-[12px] text-accent hover:underline cursor-pointer"><Plus size={10} /> Add</button>}>
        {contacts.map(c => (
          <div key={c.id} className="flex items-start gap-2 py-2 hover:bg-border-light -mx-1 px-1 rounded transition-colors">
            <button type="button" onClick={() => onTogglePrimary(c.id, c.is_primary)}
              className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center cursor-pointer mt-0.5 ${c.is_primary ? 'bg-accent border-accent' : 'border-border hover:border-text-muted'}`}>
              {c.is_primary && <Check size={9} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0 cursor-pointer ml-[5px]" onClick={() => onOpenContact(c)}>
              <div className="flex items-center gap-1.5">
                <Avatar name={c.name} size={20} />
                <span className="text-[14px] text-text-primary font-medium">{c.name}</span>
              </div>
              {c.role && <div className="text-[13px] text-text-muted ml-[26px]">{c.role}</div>}
              <div className="flex items-center gap-3 ml-[26px] mt-0.5">
                {c.email && <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-[12px] text-text-secondary hover:text-accent flex items-center gap-1"><Mail size={11} />{c.email}</a>}
                {c.phone && <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="text-[12px] text-text-secondary hover:text-accent flex items-center gap-1"><Phone size={11} />{c.phone}</a>}
              </div>
            </div>
          </div>
        ))}
      </SidebarGroup>
    </div>
  )
}
