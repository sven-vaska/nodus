export function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return null
  const a = new Date(dateA)
  const b = new Date(dateB)
  return Math.floor((b - a) / (1000 * 60 * 60 * 24))
}

export function daysAgo(date) {
  if (!date) return null
  return daysBetween(date, new Date())
}

export function pipelineText(company) {
  const { status, starting_date, closed_date, loss_reason, status_changed_at } = company
  const activeStatuses = ['In Conversation', 'Negotiation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding']

  if (activeStatuses.includes(status)) {
    const ref = status_changed_at || starting_date
    if (ref) {
      const days = daysAgo(ref)
      return `${days} days`
    }
    return ''
  }
  if (status === 'Won' && starting_date && closed_date) {
    const days = daysBetween(starting_date, closed_date)
    return `Won · took ${days} days`
  }
  if (status === 'Lost' && starting_date && closed_date) {
    const days = daysBetween(starting_date, closed_date)
    return `Lost · ${loss_reason || '?'} · ${days} days`
  }
  if (status === 'Former Client' && closed_date) {
    return `Former Client since ${closed_date}`
  }
  return ''
}

export function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export function relativeTime(date) {
  if (!date) return '—'
  const days = daysAgo(date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  // Up to 3 days stays relative; older shows the actual date so nobody
  // has to compute "17d ago" in their head.
  if (days <= 3) return `${days}d ago`
  return formatDate(date)
}

// Finance fields live in company_finance (RLS-gated by field group).
// Flatten the embed onto the company object so display code reads one shape;
// members without the finance group simply get no values.
export function mergeFinance(company) {
  if (!company) return company
  const fin = Array.isArray(company.company_finance) ? company.company_finance[0] : company.company_finance
  return { ...company, ...(fin || {}) }
}

export const FINANCE_FIELDS = ['software_fee', 'equipment_rent', 'chips', 'additional_fees', 'start_of_billing', 'pricing_regime', 'billing_notes']

export function monthlyTotal(company) {
  return (Number(company.software_fee) || 0) +
    (Number(company.equipment_rent) || 0) +
    (Number(company.chips) || 0)
}

export function priorityColor(usersCount) {
  const n = Number(usersCount) || 0
  if (n >= 51) return { bg: '#F0DFDB', text: '#9C4A3C' }
  if (n >= 11) return { bg: '#EFE3D3', text: '#8A6A2A' }
  if (n >= 1) return { bg: '#DDE4E8', text: '#3F6577' }
  return { bg: '#F2EDE5', text: '#9C948A' }
}
