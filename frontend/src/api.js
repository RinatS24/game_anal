const TOKEN_KEY = 'ga_token'
const USER_KEY = 'ga_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  if (res.status === 401) {
    clearAuth()
    if (!path.includes('/auth/')) window.location.href = '/login'
  }
  if (!res.ok) {
    let detail = `Ошибка ${res.status}`
    try {
      const data = await res.json()
      if (data.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {}
    throw new Error(detail)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (data) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me'),

  dashboard: () => request('/api/analytics/dashboard'),
  gameTrend: (id) => request(`/api/analytics/games/${id}/trend`),
  compare: (ids) => request(`/api/analytics/compare?ids=${ids.join(',')}`),

  listGames: (params = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v)
    })
    return request(`/api/games?${q.toString()}`)
  },
  getGame: (id) => request(`/api/games/${id}`),
  createGame: (data) => request('/api/games', { method: 'POST', body: JSON.stringify(data) }),
  updateGame: (id, data) => request(`/api/games/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGame: (id) => request(`/api/games/${id}`, { method: 'DELETE' }),
  listReviews: (id) => request(`/api/games/${id}/reviews`),
  createReview: (data) => request('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),

  listPlatforms: () => request('/api/platforms'),
  listGenres: () => request('/api/genres'),

  listUsers: () => request('/api/users'),
  updateUser: (id, data) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  auditLogs: () => request('/api/users/audit/logs'),

  exportCsv: () => downloadFile('/api/games/export/csv', 'games.csv'),
  exportXlsx: () => downloadFile('/api/games/export/xlsx', 'games.xlsx'),
}

async function downloadFile(url, filename) {
  const token = getToken()
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error(`Ошибка ${res.status}`)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}