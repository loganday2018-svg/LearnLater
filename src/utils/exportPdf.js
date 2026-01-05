import { jsPDF } from 'jspdf'

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Truncate text to fit width
function truncateText(text, maxLength) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
}

// Check if URL is shareable (not a blob URL)
function isShareableUrl(url) {
  if (!url) return false
  return !url.startsWith('blob:')
}

// Get status label for books
function getBookStatus(status) {
  switch (status) {
    case 'want_to_read': return 'Want to Read'
    case 'reading': return 'Reading'
    case 'finished': return 'Finished'
    default: return status || ''
  }
}

// Get status label for watch items
function getWatchStatus(status) {
  switch (status) {
    case 'want_to_watch': return 'Want to Watch'
    case 'watching': return 'Watching'
    case 'watched': return 'Watched'
    default: return status || ''
  }
}

// Export items to PDF
export function exportToPdf(items, tabName, format = 'simple') {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(tabName, margin, y)
  y += 8

  // Subtitle with date and count
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text(`Exported ${formatDate(new Date())} - ${items.length} items`, margin, y)
  doc.setTextColor(0)
  y += 12

  // Draw line
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  if (format === 'simple') {
    exportSimple(doc, items, tabName, margin, contentWidth, pageHeight, y)
  } else {
    exportDetailed(doc, items, tabName, margin, contentWidth, pageHeight, y)
  }

  // Save the PDF
  const filename = `${tabName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
  return filename
}

function exportSimple(doc, items, tabName, margin, contentWidth, pageHeight, startY) {
  let y = startY

  items.forEach((item, index) => {
    // Check if we need a new page
    if (y > pageHeight - 30) {
      doc.addPage()
      y = 20
    }

    // Item number and title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    const title = truncateText(item.title || 'Untitled', 60)
    doc.text(`${index + 1}. ${title}`, margin, y)
    y += 5

    // URL or subtitle
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)

    if (item.url && isShareableUrl(item.url)) {
      const url = truncateText(item.url, 70)
      doc.text(url, margin + 8, y)
      y += 4
    }

    if (item.author) {
      doc.text(`by ${item.author}`, margin + 8, y)
      y += 4
    }

    // Date
    if (item.created_at) {
      doc.text(formatDate(item.created_at), margin + 8, y)
      y += 4
    }

    doc.setTextColor(0)
    y += 6
  })
}

function exportDetailed(doc, items, tabName, margin, contentWidth, pageHeight, startY) {
  let y = startY

  items.forEach((item, index) => {
    // Estimate height needed for this card
    const estimatedHeight = 40 + (item.content ? 20 : 0) + (item.tags?.length ? 10 : 0)

    // Check if we need a new page
    if (y + estimatedHeight > pageHeight - 20) {
      doc.addPage()
      y = 20
    }

    // Card background
    doc.setFillColor(248, 248, 248)
    doc.rect(margin, y - 4, contentWidth, estimatedHeight, 'F')

    // Title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    const title = truncateText(item.title || 'Untitled', 55)
    doc.text(title, margin + 6, y + 6)

    // Type badge
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const typeLabel = item.type?.toUpperCase() || 'ITEM'
    doc.setTextColor(100)
    doc.text(typeLabel, margin + contentWidth - 30, y + 6)

    y += 12

    // URL (skip blob URLs)
    if (item.url && isShareableUrl(item.url)) {
      doc.setFontSize(9)
      doc.setTextColor(0, 100, 200)
      const url = truncateText(item.url, 65)
      doc.text(url, margin + 6, y)
      y += 5
    }

    // Author (for books)
    if (item.author) {
      doc.setFontSize(9)
      doc.setTextColor(80)
      doc.text(`by ${item.author}`, margin + 6, y)
      y += 5
    }

    // Status (for books/watch)
    if (item.reading_status || item.watch_status) {
      doc.setFontSize(9)
      doc.setTextColor(0, 122, 255)
      const status = item.reading_status ? getBookStatus(item.reading_status) : getWatchStatus(item.watch_status)
      doc.text(`Status: ${status}`, margin + 6, y)
      y += 5
    }

    // Content/Notes
    if (item.content) {
      doc.setFontSize(9)
      doc.setTextColor(60)
      const content = truncateText(item.content, 100)
      const lines = doc.splitTextToSize(content, contentWidth - 12)
      doc.text(lines.slice(0, 2), margin + 6, y)
      y += lines.slice(0, 2).length * 4
    }

    // Tags
    if (item.tags && item.tags.length > 0) {
      doc.setFontSize(8)
      doc.setTextColor(100)
      const tagsText = item.tags.slice(0, 5).join(', ')
      doc.text(`Tags: ${tagsText}`, margin + 6, y + 2)
      y += 6
    }

    // Date footer
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(formatDate(item.created_at), margin + 6, y + 2)

    y += 14
  })
}
