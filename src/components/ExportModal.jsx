import { useState } from 'react'
import { vibrate } from '../utils'
import { exportToPdf } from '../utils/exportPdf'

export default function ExportModal({ items, tabName, onClose }) {
  const [format, setFormat] = useState('simple')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (items.length === 0) return

    vibrate(10)
    setExporting(true)

    try {
      // Small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 100))
      const filename = exportToPdf(items, tabName, format)
      vibrate([10, 50, 10])
      onClose()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }

    setExporting(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content export-modal" onClick={e => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>Export to PDF</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="export-modal-body">
          <p className="export-info">
            Export {items.length} items from <strong>{tabName}</strong>
          </p>

          <div className="format-options">
            <label className={`format-option ${format === 'simple' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="format"
                value="simple"
                checked={format === 'simple'}
                onChange={() => setFormat('simple')}
              />
              <div className="format-content">
                <span className="format-icon">📋</span>
                <div className="format-info">
                  <strong>Simple List</strong>
                  <span>Title, URL, date - compact format</span>
                </div>
              </div>
            </label>

            <label className={`format-option ${format === 'detailed' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="format"
                value="detailed"
                checked={format === 'detailed'}
                onChange={() => setFormat('detailed')}
              />
              <div className="format-content">
                <span className="format-icon">📑</span>
                <div className="format-info">
                  <strong>Detailed Cards</strong>
                  <span>Includes notes, tags, status</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="export-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={exporting || items.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
