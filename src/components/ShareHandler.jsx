import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function ShareHandler({ onAdd, isReady }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    if (!isReady) return

    const title = searchParams.get('title') || ''
    const text = searchParams.get('text') || ''
    const url = searchParams.get('url') || ''

    // Extract URL from text if not provided directly
    let finalUrl = url
    if (!finalUrl && text) {
      const urlMatch = text.match(/https?:\/\/[^\s]+/)
      if (urlMatch) {
        finalUrl = urlMatch[0]
      }
    }

    // Use text as title if no title provided
    const finalTitle = title || text || finalUrl || 'Shared item'

    async function saveSharedItem() {
      if (!finalUrl && !text) {
        setStatus('error')
        setTimeout(() => navigate('/'), 2000)
        return
      }

      const newItem = {
        type: finalUrl ? 'link' : 'text',
        title: finalTitle.substring(0, 200),
        url: finalUrl || null,
        content: !finalUrl && text ? text : null,
      }

      const success = await onAdd(newItem)

      if (success) {
        setStatus('success')
        setTimeout(() => navigate('/'), 1500)
      } else {
        setStatus('error')
        setTimeout(() => navigate('/'), 2000)
      }
    }

    saveSharedItem()
  }, [isReady, searchParams, onAdd, navigate])

  return (
    <div className="share-handler">
      {status === 'processing' && (
        <>
          <div className="share-spinner"></div>
          <p>Saving...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="share-icon success">✓</div>
          <p>Saved to Inbox!</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="share-icon error">✕</div>
          <p>Failed to save</p>
        </>
      )}
    </div>
  )
}
