import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { vibrate } from '../utils'
import VoiceRecorder from './VoiceRecorder'

export default function ThoughtsPage() {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [scratchpadId, setScratchpadId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const saveTimeoutRef = useRef(null)
  const textareaRef = useRef(null)

  // Load or create scratchpad on mount
  useEffect(() => {
    loadScratchpad()
  }, [])

  async function loadScratchpad() {
    setLoading(true)
    setError(null)

    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false)
      setError('Loading timed out. Check your connection.')
    }, 10000)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        clearTimeout(timeoutId)
        setLoading(false)
        setError('Please sign in to use Thoughts')
        return
      }

      // Try to find existing scratchpad (use maybeSingle to handle 0 or 1 rows)
      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('type', 'scratchpad')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('Error loading scratchpad:', fetchError)
        clearTimeout(timeoutId)
        setLoading(false)
        setError('Failed to load. Tap to retry.')
        return
      }

      if (data) {
        setContent(data.content || '')
        setScratchpadId(data.id)
        setLastSaved(new Date(data.updated_at))
      } else {
        // Create new scratchpad
        const { data: newData, error: createError } = await supabase
          .from('items')
          .insert([{
            type: 'scratchpad',
            title: 'Scratchpad',
            content: '',
            user_id: session.user.id
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating scratchpad:', createError)
          clearTimeout(timeoutId)
          setLoading(false)
          setError('Failed to create scratchpad. Tap to retry.')
          return
        }
        setScratchpadId(newData.id)
      }

      clearTimeout(timeoutId)
    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong. Tap to retry.')
    } finally {
      setLoading(false)
    }
  }

  // Debounced save function
  const saveContent = useCallback(async (newContent) => {
    if (!scratchpadId) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('items')
        .update({
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', scratchpadId)

      if (error) {
        console.error('Error saving:', error)
      } else {
        setLastSaved(new Date())
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }, [scratchpadId])

  // Handle content changes with debounced auto-save
  const handleChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (1 second after typing stops)
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent)
    }, 1000)
  }

  // Save immediately on blur
  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveContent(content)
  }

  // Clear scratchpad
  const handleClear = () => {
    if (content.trim() && confirm('Clear all thoughts?')) {
      vibrate(10)
      setContent('')
      saveContent('')
    }
  }

  // Handle voice transcript - append to existing content
  const handleVoiceTranscript = (text) => {
    if (text.trim()) {
      const newContent = content
        ? content + '\n\n' + text.trim()
        : text.trim()
      setContent(newContent)
      saveContent(newContent)
      // Focus textarea after voice input
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return ''
    const now = new Date()
    const diff = Math.floor((now - lastSaved) / 1000)

    if (diff < 5) return 'Just saved'
    if (diff < 60) return `Saved ${diff}s ago`
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`
    return `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  // Update "saved X ago" display
  useEffect(() => {
    if (!lastSaved) return
    const interval = setInterval(() => {
      // Force re-render to update time
      setLastSaved(prev => prev ? new Date(prev) : null)
    }, 10000)
    return () => clearInterval(interval)
  }, [lastSaved])

  if (loading || error) {
    return (
      <div className="thoughts-page">
        <div
          className="thoughts-loading"
          onClick={error ? loadScratchpad : undefined}
          style={error ? { cursor: 'pointer' } : undefined}
        >
          {loading ? 'Loading...' : error}
        </div>
      </div>
    )
  }

  return (
    <div className="thoughts-page">
      <div className="thoughts-header">
        <h2>Thoughts</h2>
        <div className="thoughts-actions">
          <span className={`save-status ${saving ? 'saving' : ''}`}>
            {saving ? 'Saving...' : formatLastSaved()}
          </span>
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            mode="button"
            className="thoughts-voice-btn"
          />
          {content.trim() && (
            <button className="clear-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="thoughts-container">
        <textarea
          ref={textareaRef}
          className="thoughts-textarea"
          placeholder="Scribble your thoughts here...

This is your scratchpad. Write anything - ideas, reminders, random musings. It auto-saves as you type."
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
        />
      </div>

      <div className="thoughts-footer">
        <span className="char-count">{content.length.toLocaleString()} characters</span>
      </div>
    </div>
  )
}
