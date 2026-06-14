const statusStyles = {
  'Research': 'bg-[#f0f0ee] text-[#6b6b6b]',
  'In Conversation': 'bg-[#eff6ff] text-[#1d4ed8]',
  'On Hold': 'bg-[#fffbeb] text-[#b45309]',
  'Waiting onboarding': 'bg-[#f0f4ff] text-[#475569]',
  'Onboarding': 'bg-[#fef3c7] text-[#92400e]',
  'Trial': 'bg-[#fdf2f8] text-[#be185d]',
  'Won': 'bg-[#f0fdf4] text-[#15803d]',
  'Lost': 'bg-[#fff1f2] text-[#be123c]',
  'Former Client': 'bg-[#f5f3ff] text-[#7c3aed]',
}

export default function StatusPill({ status }) {
  const style = statusStyles[status] || 'bg-[#f0f0ee] text-[#6b6b6b]'
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${style}`}>
      {status}
    </span>
  )
}
