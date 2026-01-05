export default function EmptyStateIllustration({ type }) {
  const illustrations = {
    inbox: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="35" width="80" height="60" rx="8" fill="#E8F4FD" stroke="#007AFF" strokeWidth="2"/>
        <path d="M20 50L60 75L100 50" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="60" cy="25" r="8" fill="#007AFF" opacity="0.3"/>
        <path d="M56 25L59 28L65 22" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    library: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 35H95V95H25V35Z" fill="#FFF3E0" stroke="#FF9500" strokeWidth="2" rx="4"/>
        <path d="M35 35V25H85V35" stroke="#FF9500" strokeWidth="2" strokeLinecap="round"/>
        <rect x="40" y="50" width="40" height="4" rx="2" fill="#FF9500" opacity="0.5"/>
        <rect x="40" y="62" width="30" height="4" rx="2" fill="#FF9500" opacity="0.5"/>
        <rect x="40" y="74" width="35" height="4" rx="2" fill="#FF9500" opacity="0.5"/>
      </svg>
    ),
    watch: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="80" height="55" rx="8" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
        <rect x="35" y="85" width="50" height="8" rx="2" fill="#EF4444" opacity="0.3"/>
        <polygon points="50,45 50,70 72,57.5" fill="#EF4444"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="35" width="90" height="50" rx="12" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2"/>
        <polygon points="50,48 50,72 72,60" fill="#EF4444"/>
      </svg>
    ),
    books: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="40" width="20" height="55" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" transform="rotate(-5 35 67)"/>
        <rect x="45" y="35" width="20" height="60" rx="2" fill="#E0E7FF" stroke="#6366F1" strokeWidth="2"/>
        <rect x="70" y="40" width="20" height="55" rx="2" fill="#F3E8FF" stroke="#A855F7" strokeWidth="2" transform="rotate(5 80 67)"/>
        <rect x="50" y="45" width="10" height="3" rx="1" fill="#6366F1" opacity="0.5"/>
        <rect x="50" y="52" width="8" height="3" rx="1" fill="#6366F1" opacity="0.5"/>
      </svg>
    ),
    projects: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="20" width="70" height="85" rx="6" fill="#ECFDF5" stroke="#10B981" strokeWidth="2"/>
        <rect x="25" y="20" width="70" height="20" rx="6" fill="#10B981" opacity="0.2"/>
        <circle cx="40" cy="50" r="5" stroke="#10B981" strokeWidth="2"/>
        <path d="M37 50L39 52L44 47" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="52" y="47" width="30" height="4" rx="2" fill="#10B981" opacity="0.5"/>
        <circle cx="40" cy="70" r="5" stroke="#10B981" strokeWidth="2"/>
        <rect x="52" y="67" width="25" height="4" rx="2" fill="#10B981" opacity="0.5"/>
        <circle cx="40" cy="90" r="5" stroke="#10B981" strokeWidth="2"/>
        <rect x="52" y="87" width="28" height="4" rx="2" fill="#10B981" opacity="0.5"/>
      </svg>
    ),
    countdown: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="40" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2"/>
        <circle cx="60" cy="60" r="32" stroke="#F59E0B" strokeWidth="1" opacity="0.3"/>
        <line x1="60" y1="60" x2="60" y2="35" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
        <line x1="60" y1="60" x2="78" y2="60" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="60" r="4" fill="#F59E0B"/>
        <rect x="55" y="12" width="10" height="8" rx="2" fill="#F59E0B"/>
      </svg>
    ),
  }

  return (
    <div className="empty-state-illustration">
      {illustrations[type] || illustrations.inbox}
    </div>
  )
}
