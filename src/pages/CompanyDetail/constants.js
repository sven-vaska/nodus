import { Phone, Mail, Calendar, MessageSquare, MoreHorizontal, LayoutGrid, FileText, Activity, CheckSquare, Paperclip, Receipt, BarChart3, CreditCard, Headphones, Repeat2 } from 'lucide-react'

export const allStatuses = ['Research', 'In Conversation', 'On Hold', 'Trial', 'Waiting onboarding', 'Onboarding', 'Won', 'Lost', 'Former Client']
// 'Email' is intentionally not selectable — emails live in the Emails section now
export const activityTypes = ['Call', 'Follow-up', 'Meeting', 'Demo', 'Offer', 'Note', 'Support', 'Other']
export const activityTypeColors = {
  'Call': { bg: '#F2EDE5', text: '#4C6FBF' },
  'Email': { bg: '#F2EDE5', text: '#6E4A8E' },
  'Follow-up': { bg: '#F2EDE5', text: '#2E8A8A' },
  'Meeting': { bg: '#F2EDE5', text: '#3D8A5B' },
  'Demo': { bg: '#F2EDE5', text: '#A97B1F' },
  'Offer': { bg: '#F2EDE5', text: '#B4552D' },
  'Note': { bg: '#F2EDE5', text: '#9C948A' },
  'Support': { bg: '#F2EDE5', text: '#B04343' },
  'Other': { bg: '#F2EDE5', text: '#7C756A' },
}
export const activityIcons = { 'Call': Phone, 'Email': Mail, 'Follow-up': Repeat2, 'Meeting': Calendar, 'Demo': LayoutGrid, 'Offer': Receipt, 'Note': MessageSquare, 'Support': Headphones, 'Other': MoreHorizontal, 'Kõne': Phone, 'Kohtumine': Calendar, 'Märge': MessageSquare, 'Muu': MoreHorizontal }
export const sourceOptions = ['Self', 'Web', 'FB lead', 'Networking', 'Internet', 'Erply', 'Wishlist']
export const countyOptions = ['Tallinn', 'Tartu', 'Pärnu', 'Narva', 'Viljandi', 'Rakvere', 'Haapsalu', 'Kuressaare', 'Jõhvi', 'Soome']
export const defaultSectors = ['Ehitus', 'Elekter', 'Energeetika', 'Haridus', 'Hooldus', 'Hotellindus', 'IT', 'Kaevandus', 'Kaubandus', 'Keemia', 'Kinnisvara', 'Kommunaal', 'Laondus', 'Logistika', 'Meditsiin', 'Metallitööstus', 'Meelelahutus', 'Metsandus', 'Puidutööstus', 'Põllumajandus', 'Reklaam', 'Restoran', 'Sport', 'Teenindus', 'Toiduainetööstus', 'Toitlustus', 'Transport', 'Turism', 'Tööstus']
export const deviceOptions = ['Desktop', 'Mobile', 'Tablet', 'SmartTrack']

export const tabConfig = [
  { key: 'Overview', icon: LayoutGrid },
  { key: 'Details', icon: FileText, mobileOnly: true },
  { key: 'Activity', icon: Activity },
  { key: 'Emails', icon: Mail },
  { key: 'Notes', icon: FileText },
  { key: 'Tasks', icon: CheckSquare },
  { key: 'Files', icon: Paperclip },
  { key: 'Subscription', icon: CreditCard },
  { key: 'Offers', icon: Receipt },
  { key: 'Statistics', icon: BarChart3 },
]

// Module/field-group gate per tab (used to hide tabs the member can't see)
export const tabModuleReq = { Activity: 'activities', Emails: 'emails', Notes: 'notes', Tasks: 'tasks', Offers: 'offers', Statistics: 'statistics' }
