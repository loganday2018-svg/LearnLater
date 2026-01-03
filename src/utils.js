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

// Share items using Web Share API or copy to clipboard
export async function shareItems(title, items, formatFn) {
  const text = formatFn(items)

  // Try Web Share API first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text
      })
      return { success: true, method: 'share' }
    } catch (err) {
      // User cancelled or share failed
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(text)
    return { success: true, method: 'clipboard' }
  } catch (err) {
    console.error('Clipboard failed:', err)
    return { success: false }
  }
}

// Format inbox items for sharing
export function formatInboxForShare(items) {
  if (items.length === 0) return 'No items to share'

  let text = '📥 My Saved Items\n'
  text += '─'.repeat(20) + '\n\n'

  items.forEach(item => {
    const icon = item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼️' : '📝'
    text += `${icon} ${item.title}\n`
    if (item.url) text += `   ${item.url}\n`
    if (item.due_date) text += `   📅 Due: ${item.due_date}\n`
    text += '\n'
  })

  text += `\nShared from LearnLater`
  return text
}

// Format watch list for sharing
export function formatWatchListForShare(items) {
  if (items.length === 0) return 'No items to share'

  let text = '🎬 Watch List\n'
  text += '─'.repeat(20) + '\n\n'

  const unwatched = items.filter(i => !i.watched)
  const watched = items.filter(i => i.watched)

  if (unwatched.length > 0) {
    text += 'To Watch:\n'
    unwatched.forEach(item => {
      const icon = item.type === 'movie' ? '🎬' : item.type === 'youtube' ? '▶️' : '📺'
      text += `○ ${icon} ${item.title}\n`
      if (item.content) text += `   ${item.content}\n`
    })
    text += '\n'
  }

  if (watched.length > 0) {
    text += 'Watched:\n'
    watched.forEach(item => {
      const icon = item.type === 'movie' ? '🎬' : item.type === 'youtube' ? '▶️' : '📺'
      text += `✓ ${icon} ${item.title}\n`
    })
  }

  text += `\nShared from LearnLater`
  return text
}

// Format books for sharing
export function formatBooksForShare(items) {
  if (items.length === 0) return 'No books to share'

  let text = '📚 Reading List\n'
  text += '─'.repeat(20) + '\n\n'

  const wantToRead = items.filter(i => i.reading_status === 'want_to_read')
  const reading = items.filter(i => i.reading_status === 'reading')
  const finished = items.filter(i => i.reading_status === 'finished')

  if (wantToRead.length > 0) {
    text += 'Want to Read:\n'
    wantToRead.forEach(item => {
      text += `○ ${item.title}`
      if (item.author) text += ` by ${item.author}`
      text += '\n'
    })
    text += '\n'
  }

  if (reading.length > 0) {
    text += 'Currently Reading:\n'
    reading.forEach(item => {
      text += `📖 ${item.title}`
      if (item.author) text += ` by ${item.author}`
      text += '\n'
    })
    text += '\n'
  }

  if (finished.length > 0) {
    text += 'Finished:\n'
    finished.forEach(item => {
      text += `✓ ${item.title}`
      if (item.author) text += ` by ${item.author}`
      text += '\n'
    })
  }

  text += `\nShared from LearnLater`
  return text
}
