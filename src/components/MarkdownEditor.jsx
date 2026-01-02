import { useRef } from 'react'
import { vibrate } from '../utils'

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your note...',
  rows = 4,
  maxLength = 10000
}) {
  const textareaRef = useRef(null)

  function insertMarkdown(before, after = '', placeholder = '') {
    vibrate(5)
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newValue =
      value.substring(0, start) +
      before + textToInsert + after +
      value.substring(end)

    onChange(newValue)

    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + textToInsert.length + after.length
      textarea.setSelectionRange(
        selectedText ? newCursorPos : start + before.length,
        selectedText ? newCursorPos : start + before.length + placeholder.length
      )
    }, 0)
  }

  function handleBold() {
    insertMarkdown('**', '**', 'bold text')
  }

  function handleItalic() {
    insertMarkdown('*', '*', 'italic text')
  }

  function handleHeading() {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    // Find start of current line
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const lineContent = value.substring(lineStart, start)

    // Check if line already has heading
    const headingMatch = lineContent.match(/^(#{1,3})\s/)

    let newValue
    if (headingMatch) {
      // Cycle through heading levels or remove
      const currentLevel = headingMatch[1].length
      if (currentLevel >= 3) {
        // Remove heading
        newValue = value.substring(0, lineStart) + value.substring(lineStart).replace(/^#{1,3}\s/, '')
      } else {
        // Increase level
        newValue = value.substring(0, lineStart) + '#' + value.substring(lineStart)
      }
    } else {
      // Add heading
      newValue = value.substring(0, lineStart) + '# ' + value.substring(lineStart)
    }

    vibrate(5)
    onChange(newValue)
  }

  function handleBulletList() {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1

    const newValue = value.substring(0, lineStart) + '- ' + value.substring(lineStart)
    vibrate(5)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart + 2, lineStart + 2)
    }, 0)
  }

  function handleNumberedList() {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1

    const newValue = value.substring(0, lineStart) + '1. ' + value.substring(lineStart)
    vibrate(5)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart + 3, lineStart + 3)
    }, 0)
  }

  function handleCheckbox() {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1

    const newValue = value.substring(0, lineStart) + '- [ ] ' + value.substring(lineStart)
    vibrate(5)
    onChange(newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(lineStart + 6, lineStart + 6)
    }, 0)
  }

  function handleLink() {
    insertMarkdown('[', '](url)', 'link text')
  }

  return (
    <div className="markdown-editor">
      <div className="markdown-toolbar">
        <button type="button" onClick={handleBold} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={handleItalic} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={handleHeading} title="Heading">
          H
        </button>
        <span className="toolbar-divider" />
        <button type="button" onClick={handleBulletList} title="Bullet List">
          •
        </button>
        <button type="button" onClick={handleNumberedList} title="Numbered List">
          1.
        </button>
        <button type="button" onClick={handleCheckbox} title="Checkbox">
          ☐
        </button>
        <span className="toolbar-divider" />
        <button type="button" onClick={handleLink} title="Link">
          🔗
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
    </div>
  )
}
