import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DatePicker from '../../../components/DatePicker'
import { Plus, Check, X } from 'lucide-react'

const DEFAULT_MODULES = [
  'Põhipakett (töötajad, aruanded)', 'Ajajälgimine', 'AI Assistent', 'Projektid',
  'Graafikud', 'Puhkused', 'Juhendid', 'Vestlus', 'Automatiseerimine',
  'Teated', 'Küsitlused', 'Varahaldus'
]

const PRICING_REGIMES = ['Standard', 'Kohandatud', 'Kokkuleppehind', 'Tasuta']
const OVERFLOW_MODES = ['Blokeeri limiidil', 'Luba ületus']

export default function SubscriptionTab({ company, modules, companyId, onUpdateCompany, onReloadModules }) {
  const [showAddModule, setShowAddModule] = useState(false)
  const [newModule, setNewModule] = useState({ module_name: '', base_price: 0, included_employees: 0, per_employee_price: 0 })
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})

  const activeModules = modules.filter(m => m.is_active)
  const activeCount = company.active_employees || 0
  const limit = company.employee_limit || 0

  const modulesTotal = activeModules.reduce((sum, m) => {
    const extra = Math.max(0, activeCount - (m.included_employees || 0))
    return sum + (Number(m.base_price) || 0) + extra * (Number(m.per_employee_price) || 0)
  }, 0)

  const equipmentTotal = (Number(company.equipment_rent) || 0) + (Number(company.chips) || 0)
  const grandTotal = modulesTotal + equipmentTotal + (Number(company.additional_fees) || 0)

  async function addModule() {
    if (!newModule.module_name.trim()) return
    await supabase.from('company_modules').insert({
      company_id: companyId,
      module_name: newModule.module_name,
      base_price: newModule.base_price || 0,
      included_employees: newModule.included_employees || 0,
      per_employee_price: newModule.per_employee_price || 0,
      sort_order: modules.length,
    })
    setNewModule({ module_name: '', base_price: 0, included_employees: 0, per_employee_price: 0 })
    setShowAddModule(false)
    onReloadModules()
  }

  async function toggleModule(mod) {
    await supabase.from('company_modules').update({ is_active: !mod.is_active }).eq('id', mod.id)
    onReloadModules()
  }

  async function deleteModule(modId) {
    await supabase.from('company_modules').delete().eq('id', modId)
    onReloadModules()
  }

  async function saveEdit() {
    if (!editingId) return
    await supabase.from('company_modules').update({
      base_price: editDraft.base_price || 0,
      included_employees: editDraft.included_employees || 0,
      per_employee_price: editDraft.per_employee_price || 0,
    }).eq('id', editingId)
    setEditingId(null)
    onReloadModules()
  }

  function startEdit(mod) {
    setEditingId(mod.id)
    setEditDraft({ base_price: mod.base_price, included_employees: mod.included_employees, per_employee_price: mod.per_employee_price })
  }

  const unusedModules = DEFAULT_MODULES.filter(m => !modules.some(mod => mod.module_name === m))

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-surface border border-border-light rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-muted uppercase tracking-wide">Aktiivsed töötajad</div>
          <div className="text-[20px] font-bold text-text-primary">{activeCount}{limit ? <span className="text-[14px] font-normal text-text-muted"> / {limit}</span> : ''}</div>
        </div>
        <div className="bg-surface border border-border-light rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-muted uppercase tracking-wide">Kuus kokku</div>
          <div className="text-[20px] font-bold text-text-primary">{grandTotal.toFixed(2).replace('.', ',')} €</div>
        </div>
        <div className="bg-surface border border-border-light rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-muted uppercase tracking-wide">Režiim</div>
          <div className="text-[15px] font-semibold text-text-primary mt-0.5">{company.pricing_regime || 'Standard'}</div>
        </div>
        <div className="bg-surface border border-border-light rounded-lg px-3 py-2">
          <div className="text-[11px] text-text-muted uppercase tracking-wide">Terminalid</div>
          <div className="text-[20px] font-bold text-text-primary">{company.terminals_count || 0}</div>
        </div>
      </div>

      {/* Subscription settings */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Tellimuse seaded</div>
        <div className="bg-surface p-3 space-y-2">
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Hinnastuse režiim</span>
            <select value={company.pricing_regime || 'Standard'} onChange={e => onUpdateCompany('pricing_regime', e.target.value)}
              className="text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none cursor-pointer">
              {PRICING_REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Aktiivsed töötajad</span>
            <input type="number" value={company.active_employees || ''} onChange={e => onUpdateCompany('active_employees', e.target.value ? Number(e.target.value) : null)}
              className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-center" placeholder="0" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Töötajate limiit</span>
            <input type="number" value={company.employee_limit || ''} onChange={e => onUpdateCompany('employee_limit', e.target.value ? Number(e.target.value) : null)}
              className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-center" placeholder="0" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Terminalide arv</span>
            <input type="number" value={company.terminals_count || ''} onChange={e => onUpdateCompany('terminals_count', e.target.value ? Number(e.target.value) : null)}
              className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-center" placeholder="0" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Arvelduse algus</span>
            <DatePicker value={company.start_of_billing || ''} onChange={v => onUpdateCompany('start_of_billing', v || null)} inline />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Seadmete rent</span>
            <div className="flex items-center gap-1">
              <input type="number" value={company.equipment_rent || ''} onChange={e => onUpdateCompany('equipment_rent', e.target.value ? Number(e.target.value) : null)}
                className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-right" placeholder="0" />
              <span className="text-[13px] text-text-muted">€/kuu</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Chips</span>
            <div className="flex items-center gap-1">
              <input type="number" value={company.chips || ''} onChange={e => onUpdateCompany('chips', e.target.value ? Number(e.target.value) : null)}
                className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-right" placeholder="0" />
              <span className="text-[13px] text-text-muted">€/kuu</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Lisatasud (ühekordne)</span>
            <div className="flex items-center gap-1">
              <input type="number" value={company.additional_fees || ''} onChange={e => onUpdateCompany('additional_fees', e.target.value ? Number(e.target.value) : null)}
                className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-right" placeholder="0" />
              <span className="text-[13px] text-text-muted">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-text-muted font-medium">Moodulid</span>
          <button onClick={() => setShowAddModule(true)} className="flex items-center gap-1 text-[12px] text-accent hover:underline cursor-pointer"><Plus size={12} /> Lisa moodul</button>
        </div>

        <div className="bg-surface overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_70px_70px_70px_80px_36px] gap-1 px-3 py-2 bg-border-light border-b border-border text-[11px] text-text-muted uppercase tracking-wide">
            <span>Moodul</span>
            <span className="text-right">Baas €</span>
            <span className="text-right">Sisaldab</span>
            <span className="text-right">+Töötaja €</span>
            <span className="text-right">Kokku</span>
            <span></span>
          </div>

          {modules.length === 0 && (
            <div className="px-3 py-4 text-[14px] text-text-muted text-center">Mooduleid pole lisatud.</div>
          )}

          {modules.map(mod => {
            const extra = Math.max(0, activeCount - (mod.included_employees || 0))
            const total = (Number(mod.base_price) || 0) + extra * (Number(mod.per_employee_price) || 0)
            const isEditing = editingId === mod.id

            if (isEditing) {
              return (
                <div key={mod.id} className="grid grid-cols-[1fr_70px_70px_70px_80px_36px] gap-1 px-3 py-2 border-b border-border-light bg-[#fffff5] items-center">
                  <span className="text-[13px] text-text-primary font-medium">{mod.module_name}</span>
                  <input type="number" value={editDraft.base_price} onChange={e => setEditDraft(d => ({ ...d, base_price: Number(e.target.value) }))}
                    className="w-full text-[13px] px-1 py-0.5 border border-accent rounded bg-surface outline-none text-right" />
                  <input type="number" value={editDraft.included_employees} onChange={e => setEditDraft(d => ({ ...d, included_employees: Number(e.target.value) }))}
                    className="w-full text-[13px] px-1 py-0.5 border border-accent rounded bg-surface outline-none text-right" />
                  <input type="number" value={editDraft.per_employee_price} onChange={e => setEditDraft(d => ({ ...d, per_employee_price: Number(e.target.value) }))}
                    className="w-full text-[13px] px-1 py-0.5 border border-accent rounded bg-surface outline-none text-right" step="0.1" />
                  <div className="text-right">
                    <button onClick={saveEdit} className="text-[11px] text-accent hover:underline cursor-pointer mr-1">Salvesta</button>
                    <button onClick={() => setEditingId(null)} className="text-[11px] text-text-muted hover:text-text-primary cursor-pointer">×</button>
                  </div>
                  <span></span>
                </div>
              )
            }

            return (
              <div key={mod.id} className={`grid grid-cols-[1fr_70px_70px_70px_80px_36px] gap-1 px-3 py-2 border-b border-border-light items-center hover:bg-border-light transition-colors ${!mod.is_active ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleModule(mod)} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center cursor-pointer ${mod.is_active ? 'bg-accent border-accent' : 'border-border hover:border-text-muted'}`}>
                    {mod.is_active && <Check size={9} className="text-white" />}
                  </button>
                  <span className="text-[13px] text-text-primary cursor-pointer hover:text-accent" onClick={() => startEdit(mod)}>{mod.module_name}</span>
                </div>
                <span className="text-[13px] text-text-secondary text-right">{mod.base_price || 0}</span>
                <span className="text-[13px] text-text-secondary text-right">{mod.included_employees || 0}</span>
                <span className="text-[13px] text-text-secondary text-right">{mod.per_employee_price || 0}</span>
                <span className="text-[13px] text-text-primary text-right font-medium">{mod.is_active ? `${total.toFixed(1).replace('.0', '')} €` : '—'}</span>
                <button onClick={() => deleteModule(mod.id)} className="text-text-muted hover:text-lost cursor-pointer text-center"><X size={12} /></button>
              </div>
            )
          })}

          {/* Totals row */}
          {activeModules.length > 0 && (
            <div className="grid grid-cols-[1fr_70px_70px_70px_80px_36px] gap-1 px-3 py-2 bg-border-light">
              <span className="text-[13px] text-text-primary font-semibold">Moodulid kokku</span>
              <span></span><span></span><span></span>
              <span className="text-[13px] text-text-primary text-right font-bold">{modulesTotal.toFixed(1).replace('.0', '')} €</span>
              <span></span>
            </div>
          )}
        </div>

        {/* Add module form */}
        {showAddModule && (
          <div className="mt-2 bg-surface p-3">
            <div className="mb-2">
              <label className="text-[12px] text-text-muted mb-1 block">Mooduli nimi</label>
              {unusedModules.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-2">
                  {unusedModules.map(m => (
                    <button key={m} onClick={() => setNewModule(d => ({ ...d, module_name: m }))}
                      className={`text-[12px] px-2 py-0.5 rounded cursor-pointer ${newModule.module_name === m ? 'bg-text-primary text-white' : 'bg-border-light text-text-secondary hover:bg-border'}`}>{m}</button>
                  ))}
                </div>
              ) : null}
              <input value={newModule.module_name} onChange={e => setNewModule(d => ({ ...d, module_name: e.target.value }))}
                placeholder="Nt. Põhipakett" className="w-full text-[14px] px-2.5 py-1.5 border-none rounded-xl bg-border-light outline-none focus:border-accent" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">Baas €</label>
                <input type="number" value={newModule.base_price} onChange={e => setNewModule(d => ({ ...d, base_price: Number(e.target.value) }))}
                  className="w-full text-[14px] px-2 py-1.5 border-none rounded-xl bg-border-light outline-none text-right" />
              </div>
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">Sisaldab</label>
                <input type="number" value={newModule.included_employees} onChange={e => setNewModule(d => ({ ...d, included_employees: Number(e.target.value) }))}
                  className="w-full text-[14px] px-2 py-1.5 border-none rounded-xl bg-border-light outline-none text-right" />
              </div>
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">+Töötaja €</label>
                <input type="number" value={newModule.per_employee_price} onChange={e => setNewModule(d => ({ ...d, per_employee_price: Number(e.target.value) }))}
                  className="w-full text-[14px] px-2 py-1.5 border-none rounded-xl bg-border-light outline-none text-right" step="0.1" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowAddModule(false); setNewModule({ module_name: '', base_price: 0, included_employees: 0, per_employee_price: 0 }) }}
                className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary cursor-pointer">Tühista</button>
              <button onClick={addModule} className="px-4 py-1.5 bg-accent text-white rounded-full text-[13px] font-medium hover:opacity-90 cursor-pointer">Lisa</button>
            </div>
          </div>
        )}
      </div>

      {/* Grand total */}
      <div className="bg-surface p-3">
        <div className="text-[13px] text-text-muted font-medium mb-2">Kuumakse kokkuvõte</div>
        <div className="space-y-1">
          {modulesTotal > 0 && <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Moodulid</span><span className="text-text-primary">{modulesTotal.toFixed(2).replace('.', ',')} €</span></div>}
          {(company.equipment_rent || 0) > 0 && <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Seadmete rent</span><span className="text-text-primary">{Number(company.equipment_rent).toFixed(2).replace('.', ',')} €</span></div>}
          {(company.chips || 0) > 0 && <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Chips</span><span className="text-text-primary">{Number(company.chips).toFixed(2).replace('.', ',')} €</span></div>}
          {(company.additional_fees || 0) > 0 && <div className="flex justify-between text-[14px]"><span className="text-text-secondary">Lisatasud (ühekordne)</span><span className="text-text-primary">{Number(company.additional_fees).toFixed(2).replace('.', ',')} €</span></div>}
          <div className="flex justify-between text-[15px] font-bold border-t border-border-light pt-2 mt-2">
            <span className="text-text-primary">Kokku</span>
            <span className="text-text-primary">{grandTotal.toFixed(2).replace('.', ',')} €</span>
          </div>
        </div>
      </div>

      {/* AI Tokens */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">AI tokenid</div>
        <div className="bg-surface p-3 space-y-2">
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Kuu-piir (× 1000 tok)</span>
            <input type="number" value={company.ai_token_limit || ''} onChange={e => onUpdateCompany('ai_token_limit', e.target.value ? Number(e.target.value) : null)}
              className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-center" placeholder="500" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Kasutus (× 1000 tok)</span>
            <input type="number" value={company.ai_token_usage || ''} onChange={e => onUpdateCompany('ai_token_usage', e.target.value ? Number(e.target.value) : null)}
              className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-center" placeholder="0" />
          </div>
          {(company.ai_token_limit || 0) > 0 && (
            <div className="pt-1">
              <div className="flex justify-between text-[12px] text-text-muted mb-1">
                <span>{company.ai_token_usage || 0}k / {company.ai_token_limit}k</span>
                <span>{Math.round(((company.ai_token_usage || 0) / company.ai_token_limit) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, ((company.ai_token_usage || 0) / company.ai_token_limit) * 100)}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Ületuse-režiim</span>
            <select value={company.ai_overflow_mode || 'Blokeeri limiidil'} onChange={e => onUpdateCompany('ai_overflow_mode', e.target.value)}
              className="text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none cursor-pointer">
              {OVERFLOW_MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-muted w-[140px] shrink-0">Topup saldo</span>
            <input type="number" value={company.ai_topup_balance || ''} onChange={e => onUpdateCompany('ai_topup_balance', e.target.value ? Number(e.target.value) : null)}
              className="w-20 text-[14px] px-2 py-1 border-none rounded-xl bg-border-light outline-none text-center" placeholder="0" />
          </div>
        </div>
      </div>

      {/* Billing notes */}
      <div>
        <div className="text-[13px] text-text-muted font-medium mb-2">Arvelduse märkmed</div>
        <textarea value={company.billing_notes || ''} onChange={e => onUpdateCompany('billing_notes', e.target.value)}
          placeholder="nt 20% aastasoodustus kokku lepitud 06.2026" rows={2}
          className="w-full text-[14px] px-3 py-2 border-none rounded-xl bg-border-light outline-none resize-none" />
      </div>
    </div>
  )
}
