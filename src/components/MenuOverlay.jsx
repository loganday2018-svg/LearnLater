import { vibrate } from '../utils'

export default function MenuOverlay({ isOpen, onClose, onSignOut }) {
  if (!isOpen) return null

  function handleSignOut() {
    vibrate(10)
    onSignOut()
    onClose()
  }

  return (
    <div className="menu-overlay" onClick={onClose}>
      <div className="menu-content" onClick={e => e.stopPropagation()}>
        <div className="menu-header">
          <h2>Menu</h2>
          <button className="menu-close-btn" onClick={onClose}>×</button>
        </div>

        <nav className="menu-nav">
          <div className="menu-section">
            <h3>Settings</h3>
            <button className="menu-item" onClick={handleSignOut}>
              <span className="menu-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>

          <div className="menu-section">
            <h3>Coming Soon</h3>
            <div className="menu-item disabled">
              <span className="menu-icon">✅</span>
              <span>Tasks</span>
            </div>
            <div className="menu-item disabled">
              <span className="menu-icon">🎧</span>
              <span>Podcasts</span>
            </div>
            <div className="menu-item disabled">
              <span className="menu-icon">🍽️</span>
              <span>Restaurants</span>
            </div>
          </div>
        </nav>

        <div className="menu-footer">
          <p>LearnLater v1.0</p>
        </div>
      </div>
    </div>
  )
}
