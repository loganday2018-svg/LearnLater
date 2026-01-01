// Haptic feedback helper
export function vibrate(pattern = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

// Format date for display
export function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  } catch {
    return ''
  }
}

// Extract hostname from URL
export function getHostname(urlString) {
  try {
    return new URL(urlString).hostname
  } catch {
    return urlString
  }
}

// Truncate text with ellipsis
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
