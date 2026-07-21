// Minimal global toast for surfacing save/load errors.
export function toastError(message) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message } }))
}

// Returns the error message if the Supabase response failed, otherwise null.
// Usage: if (failed(await query, 'Saving failed')) return
export function failed(res, message = 'Something went wrong') {
  if (res?.error) {
    console.error(message, res.error)
    toastError(`${message}: ${res.error.message}`)
    return true
  }
  return false
}
