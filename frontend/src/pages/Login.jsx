import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, saveAuth } from '../api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let result
      if (mode === 'login') {
        result = await api.login(form.username, form.password)
      } else {
        result = await api.register({
          email: form.email,
          username: form.username,
          password: form.password,
        })
      }
      saveAuth(result.access_token, result.user)
      onLogin(result.user)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>GameAnalysis</h1>
        <div className="sub">Информационная система анализа рынка компьютерных игр</div>

        <div className="tabs">
          <div className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Вход</div>
          <div className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Регистрация</div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          )}
          <div className="field">
            <label>{mode === 'login' ? 'Логин или email' : 'Имя пользователя'}</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="demo-creds">
          <strong>Демо-учётные записи:</strong><br />
          Администратор: <code>admin</code> / <code>Admin12345!</code><br />
          Аналитик: <code>analyst</code> / <code>Analyst123!</code><br />
          Пользователь: <code>user</code> / <code>User12345!</code>
        </div>
      </div>
    </div>
  )
}