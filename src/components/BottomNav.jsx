import { NavLink } from 'react-router-dom'

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
        <span className="nav-icon">📥</span>
        <span className="nav-label">Inbox</span>
      </NavLink>
      <NavLink to="/watch" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">🎬</span>
        <span className="nav-label">Watch</span>
      </NavLink>
      <NavLink to="/projects" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">📋</span>
        <span className="nav-label">Projects</span>
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <span className="nav-icon">📚</span>
        <span className="nav-label">Notes</span>
      </NavLink>
    </nav>
  )
}
