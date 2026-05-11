import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { api, getUser, clearAuth } from './api'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Games from './pages/Games.jsx'
import GameDetail from './pages/GameDetail.jsx'
import Analytics from './pages/Analytics.jsx'
import Compare from './pages/Compare.jsx'
import Admin from './pages/Admin.jsx'

function Layout({ children, user, onLogout }) {
  const location = useLocation()
  const navItems = [
    { path: '/', label: 'Дашборд', icon: '📊' },
    { path: '/games', label: 'Каталог игр', icon: '🎮' },
    { path: '/analytics', label: 'Аналитика', icon: '📈' },
    { path: '/compare', label: 'Сравнение', icon: '⚖️' },
  ]
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Администрирование', icon: '⚙️' })
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">GameAnalysis</div>
          <div className="brand-sub">Анализ рынка компьютерных игр</div>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="name">{user?.username}</div>
            <div>{user?.email}</div>
          </div>
          <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          <button className="secondary small" style={{ width: '100%', marginTop: 10 }} onClick={onLogout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(getUser())
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      api.me().then(setUser).catch(() => {
        clearAuth()
        setUser(null)
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    navigate('/login')
  }

  if (loading) {
    return <div className="loading"><div className="spinner" /></div>
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/games" element={<Games user={user} />} />
        <Route path="/games/:id" element={<GameDetail user={user} />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/admin" element={user.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}