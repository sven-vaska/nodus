import { useSyncExternalStore } from 'react'

const KEY = 'nodus_bottom_nav'
const DEFAULT = ['companies', 'people', 'tasks']
export const BOTTOM_NAV_SLOTS = 3

function sanitize(v) {
  if (Array.isArray(v) && v.length === BOTTOM_NAV_SLOTS && v.every(k => typeof k === 'string')) return v
  return null
}

function load() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY))) || DEFAULT
  } catch { /* ignore */ }
  return DEFAULT
}

// Module-level store so the bottom bar and the settings picker stay in sync
// and the reference stays stable for useSyncExternalStore.
let current = load()
const listeners = new Set()
// Optional remote persister (Supabase profile) registered by UserContext.
// localStorage alone is not reliable in installed PWAs — iOS may evict it and
// the browser/PWA storage containers are separate — so the profile is the
// source of truth and localStorage is just a fast local cache.
let remoteSaver = null

function emit() {
  listeners.forEach(l => l())
}

function getSnapshot() {
  return current
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function cache(keys) {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys))
  } catch { /* ignore */ }
}

export function setBottomNav(keys) {
  current = keys.slice(0, BOTTOM_NAV_SLOTS)
  cache(current)
  if (remoteSaver) remoteSaver(current)
  emit()
}

// Called by UserContext once the profile row arrives: adopt the server value
// (if any) and register the saver used for subsequent changes.
export function bindBottomNavProfile(serverValue, saver) {
  remoteSaver = saver || null
  const v = sanitize(serverValue)
  if (v && JSON.stringify(v) !== JSON.stringify(current)) {
    current = v
    cache(v)
    emit()
  }
}

export function useBottomNav() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
