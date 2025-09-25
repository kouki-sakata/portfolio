import { NavLink } from 'react-router-dom'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link nav-link--active' : 'nav-link'

export const AppHeader = () => (
  <header className="app-header">
    <div className="app-header__inner">
      <NavLink to="/" className="app-brand" aria-label="Team Develop home">
        TeamDevelop Bravo
      </NavLink>
      <nav aria-label="Primary">
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={navLinkClassName}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/news" className={navLinkClassName}>
              News
            </NavLink>
          </li>
          <li>
            <NavLink to="/attendance" className={navLinkClassName}>
              Attendance
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
)
