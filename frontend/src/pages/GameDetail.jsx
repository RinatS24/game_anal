import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import { GameModal } from './Games.jsx'

const tooltipStyle = { background: '#181b22', border: '1px solid #2a2f3e', borderRadius: 6, color: '#e6e9f2' }

export default function GameDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [reviews, setReviews] = useState([])
  const [trend, setTrend] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [genres, setGenres] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [reviewForm, setReviewForm] = useState({ score: 8, text: '' })
  const [error, setError] = useState('')

  const load = () => {
    api.getGame(id).then(setGame).catch((e) => setError(e.message))
    api.listReviews(id).then(setReviews)
    api.gameTrend(id).then(setTrend)
  }
  useEffect(() => {
    load()
    api.listPlatforms().then(setPlatforms)
    api.listGenres().then(setGenres)
  }, [id])

  const canEdit = user.role === 'admin' || user.role === 'analyst'
  const canDelete = user.role === 'admin'

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      await api.createReview({
        game_id: Number(id),
        author: user.username,
        score: Number(reviewForm.score),
        text: reviewForm.text,
      })
      setReviewForm({ score: 8, text: '' })
      load()
    } catch (err) { setError(err.message) }
  }

  const remove = async () => {
    if (!confirm('Удалить игру и все связанные данные?')) return
    await api.deleteGame(id)
    navigate('/games')
  }

  if (error) return <div className="error-msg">{error}</div>
  if (!game) return <div className="loading"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <div>
          <button className="secondary small" onClick={() => navigate('/games')}>← К каталогу</button>
          <h1 style={{ marginTop: 8 }}>{game.title}</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
            {game.developer} · {game.publisher} · {game.release_year}
          </div>
        </div>
        <div className="toolbar">
          {canEdit && <button className="secondary" onClick={() => setShowEdit(true)}>Редактировать</button>}
          {canDelete && <button className="danger" onClick={remove}>Удалить</button>}
        </div>
      </div>

      <div className="card">
        <div className="detail-grid">
          <div className="detail-item"><div className="label">Платформа</div><div className="value">{game.platform?.name}</div></div>
          <div className="detail-item"><div className="label">Жанр</div><div className="value">{game.genre?.name}</div></div>
          <div className="detail-item"><div className="label">Цена</div><div className="value">{game.price ? `${game.price.toFixed(0)} ₽` : 'F2P'}</div></div>
          <div className="detail-item"><div className="label">Рейтинг</div><div className="value">{game.rating.toFixed(1)} / 10</div></div>
          <div className="detail-item"><div className="label">Metacritic</div><div className="value">{game.metacritic || '—'}</div></div>
          <div className="detail-item"><div className="label">Продажи</div><div className="value">{game.sales_millions.toFixed(1)} млн</div></div>
          <div className="detail-item"><div className="label">Онлайн</div><div className="value">{game.online_players ? game.online_players.toLocaleString('ru-RU') : '—'}</div></div>
          <div className="detail-item"><div className="label">Отзывов</div><div className="value">{game.reviews_count}</div></div>
        </div>
      </div>

      {trend && trend.points.length > 0 && (
        <div className="card">
          <h2>Динамика показателей (12 месяцев)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis dataKey="date" stroke="#9aa3b8" fontSize={11} />
              <YAxis yAxisId="left" stroke="#9aa3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#9aa3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="online_players" stroke="#4ea8de" name="Онлайн" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="sales_millions" stroke="#7c5cff" name="Продажи (млн)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="rating" stroke="#2bb673" name="Рейтинг" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h2>Отзывы пользователей</h2>
        <form onSubmit={submitReview} style={{ marginBottom: 20 }}>
          <div className="flex-row" style={{ gap: 12, alignItems: 'flex-end' }}>
            <div style={{ width: 100 }}>
              <label>Оценка</label>
              <input type="number" min="1" max="10" step="0.1" value={reviewForm.score} onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Ваш отзыв</label>
              <input value={reviewForm.text} onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })} placeholder="Поделитесь впечатлениями..." required />
            </div>
            <button type="submit">Отправить</button>
          </div>
        </form>

        {reviews.length === 0 && <div style={{ color: 'var(--text-dim)' }}>Отзывов пока нет.</div>}
        {reviews.map((r) => (
          <div key={r.id} className="review">
            <div className="review-head">
              <span className="review-author">{r.author}</span>
              <span className="review-score">
                <span className={`tag ${r.sentiment === 'positive' ? 'success' : r.sentiment === 'negative' ? 'danger' : 'warning'}`}>
                  {r.score.toFixed(1)} / 10
                </span>
                <span style={{ marginLeft: 8, color: 'var(--text-dim)', fontSize: 12 }}>
                  {new Date(r.created_at).toLocaleDateString('ru-RU')}
                </span>
              </span>
            </div>
            <div className="review-text">{r.text}</div>
          </div>
        ))}
      </div>

      {showEdit && (
        <GameModal
          platforms={platforms}
          genres={genres}
          game={game}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load() }}
        />
      )}
    </>
  )
}