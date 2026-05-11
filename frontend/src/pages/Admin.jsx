import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Admin() {
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('users')
  const [error, setError] = useState('')

  const load = () => {
    api.listUsers().then(setUsers).catch((e) => setError(e.message))
    api.auditLogs().then(setLogs).catch(() => {})
  }
  useEffect(load, [])

  const updateRole = async (id, role) => {
    try { await api.updateUser(id, { role }); load() } catch (e) { setError(e.message) }
  }
  const toggleActive = async (id, current) => {
    try { await api.updateUser(id, { is_active: !current }); load() } catch (e) { setError(e.message) }
  }

  return (
    <>
      <div className="page-header">
        <h1>Администрирование</h1>
      </div>

      <div className="tabs" style={{ maxWidth: 400 }}>
        <div className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Пользователи</div>
        <div className={`tab ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>Журнал аудита</div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {tab === 'users' && (
        <div className="card">
          <h2>Список пользователей</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Создан</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
                      <option value="user">user</option>
                      <option value="analyst">analyst</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    {u.is_active
                      ? <span className="tag success">активен</span>
                      : <span className="tag danger">заблокирован</span>}
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <button className="secondary small" onClick={() => toggleActive(u.id, u.is_active)}>
                      {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card">
          <h2>Журнал действий ({logs.length} записей)</h2>
          <table>
            <thead>
              <tr>
                <th>Время</th>
                <th>Пользователь</th>
                <th>Действие</th>
                <th>Детали</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString('ru-RU')}</td>
                  <td>#{l.user_id ?? '—'}</td>
                  <td><span className="tag info">{l.action}</span></td>
                  <td style={{ color: 'var(--text-dim)' }}>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}