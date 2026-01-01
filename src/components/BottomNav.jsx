import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
        <span className="nav-icon">📥</span>
        <span className="nav-label">Inbox</span>
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">📚</span>
        <span className="nav-label">Library</span>
      </NavLink>
    </nav>
  )
}
