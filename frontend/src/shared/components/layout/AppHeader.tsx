import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link nav-link--active' : 'nav-link'

export const AppHeader = () => {
  const navigate = useNavigate()
  const { user, authenticated, logout } = useAuth()

  const navItems = authenticated
    ? [
        { to: '/', label: 'ホーム' },
        { to: '/attendance', label: '打刻' },
        { to: '/stamp-history', label: '打刻履歴' },
        { to: '/news', label: 'お知らせ' },
        ...(user?.admin
          ? [
              { to: '/admin/employees', label: '従業員管理' },
              { to: '/admin/news', label: 'お知らせ管理' },
              { to: '/admin/logs', label: '操作ログ' },
            ]
          : []),
      ]
    : []

  const handleSignOut = async () => {
    await logout()
    void navigate('/signin')
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <NavLink to={authenticated ? '/' : '/signin'} className="app-brand" aria-label="TeamDevelop home">
          TeamDevelop Bravo
        </NavLink>
        {authenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <nav aria-label="Primary">
              <ul className="nav-list">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} className={navLinkClassName}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span aria-live="polite">{user ? `${user.lastName} ${user.firstName}` : ''}</span>
              <button
                type="button"
                className="button"
                onClick={() => {
                  void handleSignOut()
                }}
              >
                サインアウト
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
