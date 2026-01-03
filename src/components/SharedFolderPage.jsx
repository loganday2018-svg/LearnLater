import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { formatDate, getHostname, truncate } from '../utils'

export default function SharedFolderPage() {
  const { shareId } = useParams()
  const [folder, setFolder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSharedFolder() {
      try {
        // Fetch folder by share_id
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('*')
          .eq('share_id', shareId)
          .eq('is_public', true)
          .single()

        if (folderError || !folderData) {
          setError('Folder not found or is no longer shared')
          setLoading(false)
          return
        }

        setFolder(folderData)

        // Fetch items in folder
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('folder_id', folderData.id)
          .order('created_at', { ascending: false })

        if (!itemsError) {
          setItems(itemsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching shared folder:', err)
        setError('Failed to load folder')
        setLoading(false)
      }
    }

    fetchSharedFolder()
  }, [shareId])

  if (loading) {
    return (
      <div className="shared-folder-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="shared-folder-page">
        <div className="shared-error">
          <h2>Oops!</h2>
          <p>{error}</p>
          <Link to="/" className="back-link">Go to LearnLater</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shared-folder-page">
      <div className="shared-header">
        <h1>{folder.name}</h1>
        <p className="shared-meta">
          Shared folder • {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="shared-items">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>This folder is empty</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={`shared-item ${item.type}`}>
              <span className="item-icon">
                {item.type === 'link' ? '🔗' : item.type === 'image' ? '🖼️' : '📝'}
              </span>
              <div className="item-content">
                <h3>
                  {item.type === 'link' && item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h3>
                {item.type === 'link' && item.url && (
                  <span className="item-url">
                    {item.favicon && <img src={item.favicon} alt="" className="favicon" onError={(e) => e.target.style.display = 'none'} />}
                    {item.site_name || getHostname(item.url)}
                  </span>
                )}
                {item.type === 'link' && item.image_url && (
                  <div className="item-preview-image">
                    <img src={item.image_url} alt="" onError={(e) => e.target.parentElement.style.display = 'none'} />
                  </div>
                )}
                {(item.description || item.content) && (
                  <p className="item-desc">{truncate(item.description || item.content, 200)}</p>
                )}
                {item.type === 'image' && item.image_url && (
                  <div className="item-image">
                    <img src={item.image_url} alt={item.title} />
                  </div>
                )}
              </div>
              <span className="item-date">{formatDate(item.created_at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="shared-footer">
        <p>
          Shared with <a href="https://learnlater.vercel.app" target="_blank" rel="noopener noreferrer">LearnLater</a>
        </p>
      </div>
    </div>
  )
}
