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
  const { status, starting_date, closed_date, loss_reason } = company
  const activeStatuses = ['In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding']

  if (activeStatuses.includes(status) && starting_date) {
    const days = daysAgo(starting_date)
    return `${status} · ${days} päeva`
  }
  if (status === 'Won' && starting_date && closed_date) {
    const days = daysBetween(starting_date, closed_date)
    return `Won · protsess kestis ${days} päeva`
  }
  if (status === 'Lost' && starting_date && closed_date) {
    const days = daysBetween(starting_date, closed_date)
    return `Lost · ${loss_reason || '?'} · ${days} päeva`
  }
  if (status === 'Former Client' && closed_date) {
    return `Former Client alates ${closed_date}`
  }
  return status
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function relativeTime(date) {
  if (!date) return '—'
  const days = daysAgo(date)
  if (days === 0) return 'Täna'
  if (days === 1) return 'Eile'
  if (days < 30) return `${days}p tagasi`
  const months = Math.floor(days / 30)
  return `${months}k tagasi`
}

export function monthlyTotal(company) {
  return (Number(company.software_fee) || 0) +
    (Number(company.equipment_rent) || 0) +
    (Number(company.chips) || 0)
}
