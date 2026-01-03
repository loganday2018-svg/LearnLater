import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { fetchLinkPreview } from '../utils'

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

    async function saveSharedItem() {
      if (!finalUrl && !text) {
        setStatus('error')
        setTimeout(() => navigate('/'), 2000)
        return
      }

      let newItem = {
        type: finalUrl ? 'link' : 'text',
        title: (title || text || finalUrl || 'Shared item').substring(0, 200),
        url: finalUrl || null,
        content: !finalUrl && text ? text : null,
      }

      // Fetch link preview if it's a URL
      if (finalUrl) {
        try {
          const preview = await fetchLinkPreview(finalUrl)
          if (preview) {
            newItem.title = preview.title || newItem.title
            newItem.description = preview.description || null
            newItem.image_url = preview.image || null
            newItem.site_name = preview.siteName || null
            newItem.favicon = preview.favicon || null
          }
        } catch (e) {
          console.log('Could not fetch preview:', e)
        }
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
