import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { formatDate } from '../../../lib/utils'
import DatePicker from '../../../components/DatePicker'
import { Receipt } from 'lucide-react'

export default function OffersTab({ companyId, companyName }) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [draft, setDraft] = useState({ title: '', items: [{ description: '', qty: 1, unit_price: 0 }], valid_until: '' })

  useEffect(() => {
    supabase.from('offers').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
      .then(({ data }) => { setOffers(data || []); setLoading(false) })
  }, [companyId])

  async function saveOffer() {
    if (!draft.title.trim()) return
    const total = draft.items.reduce((s, i) => s + (i.qty * i.unit_price), 0)
    const { data } = await supabase.from('offers').insert({
      company_id: companyId,
      title: draft.title,
      items: draft.items,
      total,
      valid_until: draft.valid_until || null,
      status: 'Draft'
    }).select().single()
    if (data) setOffers(prev => [data, ...prev])
    setDraft({ title: '', items: [{ description: '', qty: 1, unit_price: 0 }], valid_until: '' })
    setShowNew(false)
  }

  async function updateOfferStatus(offerId, status) {
    await supabase.from('offers').update({ status }).eq('id', offerId)
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status } : o))
  }

  async function deleteOffer(offerId) {
    await supabase.from('offers').delete().eq('id', offerId)
    setOffers(prev => prev.filter(o => o.id !== offerId))
  }

  function addItem() {
    setDraft(d => ({ ...d, items: [...d.items, { description: '', qty: 1, unit_price: 0 }] }))
  }

  function updateItem(idx, key, val) {
    setDraft(d => ({ ...d, items: d.items.map((item, i) => i === idx ? { ...item, [key]: val } : item) }))
  }

  function removeItem(idx) {
    setDraft(d => ({ ...d, items: d.items.filter((_, i) => i !== idx) }))
  }

  const draftTotal = draft.items.reduce((s, i) => s + (i.qty * (i.unit_price || 0)), 0)

  if (loading) return <div className="text-[14px] text-text-muted">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-medium text-text-secondary">Offers</span>
        <button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 border-none rounded-xl bg-border-light text-[13px] font-medium text-text-primary hover:bg-border-light transition-colors cursor-pointer">
          <Receipt size={14} className="text-text-secondary" /> Create offer
        </button>
      </div>

      {showNew && (
        <div className="bg-surface p-4 mb-4">
          <div className="mb-3">
            <label className="block text-[13px] font-medium text-text-secondary mb-1">Title</label>
            <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. Monthly service package" className="w-full px-2.5 py-1.5 border-none rounded-xl bg-border-light text-[14px] outline-none transition-colors" />
          </div>

          <div className="mb-3">
            <label className="block text-[13px] font-medium text-text-secondary mb-1">Valid until</label>
            <DatePicker value={draft.valid_until} onChange={v => setDraft(d => ({ ...d, valid_until: v }))} />
          </div>

          <div className="mb-3">
            <label className="block text-[13px] font-medium text-text-secondary mb-2">Items</label>
            <div className="space-y-2">
              {draft.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" className="flex-1 px-2.5 py-1.5 border-none rounded-xl bg-border-light text-[14px] outline-none focus:border-accent" />
                  <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} className="w-16 px-2.5 py-1.5 border-none rounded-xl bg-border-light text-[14px] outline-none text-center" min="1" />
                  <div className="relative">
                    <input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="w-24 px-2.5 py-1.5 pr-6 border-none rounded-xl bg-border-light text-[14px] outline-none text-right" min="0" step="0.01" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-text-muted">€</span>
                  </div>
                  {draft.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-text-muted hover:text-lost text-[18px] px-1 cursor-pointer">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 text-[13px] text-accent hover:underline cursor-pointer">+ Add item</button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-[14px] font-medium text-text-primary">Total: €{draftTotal.toFixed(2)}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowNew(false); setDraft({ title: '', items: [{ description: '', qty: 1, unit_price: 0 }], valid_until: '' }) }} className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary cursor-pointer">Cancel</button>
              <button type="button" onClick={saveOffer} className="px-4 py-1.5 bg-accent text-white rounded-full text-[13px] font-medium hover:opacity-90 cursor-pointer">Save offer</button>
            </div>
          </div>
        </div>
      )}

      {offers.length === 0 && !showNew && (
        <div className="text-[14px] text-text-muted">No offers yet.</div>
      )}

      {offers.map(offer => (
        <div key={offer.id} className="bg-surface p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-text-primary">{offer.title}</span>
            <div className="flex items-center gap-2">
              <select value={offer.status} onChange={e => updateOfferStatus(offer.id, e.target.value)} className="px-2 py-1 border-none rounded-xl bg-border-light text-[13px] outline-none cursor-pointer">
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
              </select>
              <button type="button" onClick={() => deleteOffer(offer.id)} className="text-text-muted hover:text-lost text-[14px] cursor-pointer">×</button>
            </div>
          </div>
          {offer.items && offer.items.length > 0 && (
            <div className="space-y-1 mb-2">
              {offer.items.map((item, i) => (
                <div key={i} className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">{item.description || 'Item'} × {item.qty}</span>
                  <span className="text-text-primary">€{(item.qty * item.unit_price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-[14px] border-t border-border-light pt-2">
            <span className="font-medium text-text-primary">€{(offer.total || 0).toFixed(2)}</span>
            {offer.valid_until && <span className="text-[13px] text-text-muted">Valid until {formatDate(offer.valid_until)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
