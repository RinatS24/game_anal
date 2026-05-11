import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const SORT_OPTIONS = [
  { value: 'sales_millions', label: 'Продажи' },
  { value: 'rating', label: 'Рейтинг' },
  { value: 'metacritic', label: 'Metacritic' },
  { value: 'online_players', label: 'Онлайн' },
  { value: 'release_year', label: 'Год' },
  { value: 'title', label: 'Название' },
  { value: 'price', label: 'Цена' },
]

const PAGE_SIZE = 20

export default function Games({ user }) {
  const navigate = useNavigate()
  const [platforms, setPlatforms] = useState([])
  const [genres, setGenres] = useState([])
  const [filters, setFilters] = useState({
    search: '', platform_id: '', genre_id: '',
    year_from: '', year_to: '', min_rating: '',
    sort_by: 'sales_millions', sort_dir: 'desc',
  })
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    api.listPlatforms().then(setPlatforms)
    api.listGenres().then(setGenres)
  }, [])

  const load = () => {
    setLoading(true)
    setError('')
    api.listGames({ ...filters, skip: page * PAGE_SIZE, limit: PAGE_SIZE })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filters.sort_by, filters.sort_dir])

  const applyFilters = () => {
    setPage(0)
    load()
  }

  const resetFilters = () => {
    setFilters({
      search: '', platform_id: '', genre_id: '',
      year_from: '', year_to: '', min_rating: '',
      sort_by: 'sales_millions', sort_dir: 'desc',
    })
    setPage(0)
    setTimeout(load, 0)
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  const canEdit = user.role === 'admin' || user.role === 'analyst'

  return (
    <>
      <div className="page-header">
        <h1>Каталог игр</h1>
        <div className="toolbar">
          <button className="secondary" onClick={() => api.exportCsv()}>Экспорт CSV</button>
          <button className="secondary" onClick={() => api.exportXlsx()}>Экспорт Excel</button>
          {canEdit && <button onClick={() => setShowCreate(true)}>+ Добавить игру</button>}
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div>
            <label>Поиск</label>
            <input
              placeholder="Название / студия"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <div>
            <label>Платформа</label>
            <select value={filters.platform_id} onChange={(e) => setFilters({ ...filters, platform_id: e.target.value })}>
              <option value="">Все</option>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label>Жанр</label>
            <select value={filters.genre_id} onChange={(e) => setFilters({ ...filters, genre_id: e.target.value })}>
              <option value="">Все</option>
              {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label>Год с</label>
            <input type="number" value={filters.year_from} onChange={(e) => setFilters({ ...filters, year_from: e.target.value })} />
          </div>
          <div>
            <label>Год по</label>
            <input type="number" value={filters.year_to} onChange={(e) => setFilters({ ...filters, year_to: e.target.value })} />
          </div>
          <div>
            <label>Мин. рейтинг</label>
            <input type="number" step="0.1" min="0" max="10" value={filters.min_rating} onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })} />
          </div>
          <div>
            <label>Сортировка</label>
            <select value={filters.sort_by} onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label>Направление</label>
            <select value={filters.sort_dir} onChange={(e) => setFilters({ ...filters, sort_dir: e.target.value })}>
              <option value="desc">По убыванию</option>
              <option value="asc">По возрастанию</option>
            </select>
          </div>
        </div>
        <div className="toolbar">
          <button onClick={applyFilters}>Применить</button>
          <button className="secondary" onClick={resetFilters}>Сбросить</button>
          {loading && <span className="spinner" />}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Разработчик</th>
                <th>Платформа</th>
                <th>Жанр</th>
                <th>Год</th>
                <th style={{ textAlign: 'right' }}>Цена</th>
                <th style={{ textAlign: 'right' }}>Рейтинг</th>
                <th style={{ textAlign: 'right' }}>Meta</th>
                <th style={{ textAlign: 'right' }}>Продажи</th>
                <th style={{ textAlign: 'right' }}>Онлайн</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((g) => (
                <tr key={g.id} className="clickable" onClick={() => navigate(`/games/${g.id}`)}>
                  <td><strong>{g.title}</strong></td>
                  <td>{g.developer}</td>
                  <td><span className="tag info">{g.platform?.name}</span></td>
                  <td><span className="tag">{g.genre?.name}</span></td>
                  <td>{g.release_year}</td>
                  <td style={{ textAlign: 'right' }}>{g.price ? `${g.price.toFixed(0)} ₽` : 'F2P'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`tag ${g.rating >= 8 ? 'success' : g.rating >= 6 ? 'warning' : 'danger'}`}>
                      {g.rating.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{g.metacritic || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{g.sales_millions.toFixed(1)} млн</td>
                  <td style={{ textAlign: 'right' }}>{g.online_players ? g.online_players.toLocaleString('ru-RU') : '—'}</td>
                </tr>
              ))}
              {!data.items.length && !loading && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Игры не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Назад</button>
          <span className="info">Страница {page + 1} из {totalPages} (всего: {data.total})</span>
          <button className="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
        </div>
      </div>

      {showCreate && (
        <GameModal
          platforms={platforms}
          genres={genres}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}
    </>
  )
}

function GameModal({ platforms, genres, onClose, onSaved, game }) {
  const [form, setForm] = useState({
    title: '', developer: '', publisher: '', release_year: 2024,
    price: 0, rating: 0, metacritic: 0, sales_millions: 0, online_players: 0,
    platform_id: platforms[0]?.id || 1, genre_id: genres[0]?.id || 1,
    ...(game || {}),
  })
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        release_year: Number(form.release_year),
        price: Number(form.price),
        rating: Number(form.rating),
        metacritic: Number(form.metacritic),
        sales_millions: Number(form.sales_millions),
        online_players: Number(form.online_players),
        platform_id: Number(form.platform_id),
        genre_id: Number(form.genre_id),
      }
      if (game) await api.updateGame(game.id, payload)
      else await api.createGame(payload)
      onSaved()
    } catch (err) { setError(err.message) }
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{game ? 'Редактирование игры' : 'Новая игра'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="grid-2">
            <div className="field"><label>Название</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="field"><label>Год</label><input type="number" required value={form.release_year} onChange={(e) => setForm({ ...form, release_year: e.target.value })} /></div>
            <div className="field"><label>Разработчик</label><input required value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} /></div>
            <div className="field"><label>Издатель</label><input required value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} /></div>
            <div className="field"><label>Платформа</label>
              <select value={form.platform_id} onChange={(e) => setForm({ ...form, platform_id: e.target.value })}>
                {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Жанр</label>
              <select value={form.genre_id} onChange={(e) => setForm({ ...form, genre_id: e.target.value })}>
                {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Цена (₽)</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="field"><label>Рейтинг (0-10)</label><input type="number" step="0.1" min="0" max="10" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></div>
            <div className="field"><label>Metacritic</label><input type="number" min="0" max="100" value={form.metacritic} onChange={(e) => setForm({ ...form, metacritic: e.target.value })} /></div>
            <div className="field"><label>Продажи (млн)</label><input type="number" step="0.1" value={form.sales_millions} onChange={(e) => setForm({ ...form, sales_millions: e.target.value })} /></div>
            <div className="field"><label>Игроки онлайн</label><input type="number" value={form.online_players} onChange={(e) => setForm({ ...form, online_players: e.target.value })} /></div>
          </div>
          <div className="flex-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <button type="button" className="secondary" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { GameModal }