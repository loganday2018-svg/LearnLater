import ReactMarkdown from 'react-markdown'

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
          // Make links open in new tab
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          // Handle checkboxes in lists
          li: ({ node, children, ...props }) => {
            const text = String(children)
            if (text.startsWith('[ ] ') || text.startsWith('[x] ')) {
              const isChecked = text.startsWith('[x] ')
              return (
                <li {...props} className="checkbox-item">
                  <input type="checkbox" checked={isChecked} readOnly />
                  <span>{text.substring(4)}</span>
                </li>
              )
            }
            return <li {...props}>{children}</li>
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
