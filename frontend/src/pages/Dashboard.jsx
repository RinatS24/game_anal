import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'

const CHART_COLORS = ['#7c5cff', '#4ea8de', '#2bb673', '#f4b942', '#ef5a5a', '#b178ff', '#5fd0c2']
const tooltipStyle = { background: '#181b22', border: '1px solid #2a2f3e', borderRadius: 6, color: '#e6e9f2' }

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="error-msg">{error}</div>
  if (!data) return <div className="loading"><div className="spinner" /></div>

  const sentimentData = [
    { name: 'Позитивные', value: data.sentiment.positive || 0, color: '#2bb673' },
    { name: 'Нейтральные', value: data.sentiment.neutral || 0, color: '#f4b942' },
    { name: 'Негативные', value: data.sentiment.negative || 0, color: '#ef5a5a' },
  ]

  return (
    <>
      <div className="page-header">
        <h1>Дашборд рынка</h1>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Обновлено: {new Date().toLocaleString('ru-RU')}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Игр в базе</div>
          <div className="stat-value">{data.total_games}</div>
          <div className="stat-sub">всего проанализировано</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Суммарные продажи</div>
          <div className="stat-value">{data.total_sales.toFixed(1)} млн</div>
          <div className="stat-sub">копий по всем играм</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Средний рейтинг</div>
          <div className="stat-value">{data.avg_rating.toFixed(2)}</div>
          <div className="stat-sub">из 10 баллов</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Игроки онлайн</div>
          <div className="stat-value">{formatNumber(data.total_online)}</div>
          <div className="stat-sub">одновременно в сети</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Отзывов</div>
          <div className="stat-value">{data.total_reviews}</div>
          <div className="stat-sub">от пользователей</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Продажи по жанрам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.genres}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis dataKey="genre" stroke="#9aa3b8" angle={-30} textAnchor="end" height={70} fontSize={11} />
              <YAxis stroke="#9aa3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total_sales" fill="#7c5cff" name="Продажи (млн)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Продажи по платформам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.platforms}
                dataKey="total_sales"
                nameKey="platform"
                cx="50%" cy="50%" outerRadius={100}
                label={(e) => e.platform}
              >
                {data.platforms.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Динамика по годам выпуска</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.years}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis dataKey="year" stroke="#9aa3b8" />
              <YAxis stroke="#9aa3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#4ea8de" name="Релизов" strokeWidth={2} />
              <Line type="monotone" dataKey="total_sales" stroke="#7c5cff" name="Продажи (млн)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Тональность отзывов</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={100} label>
                {sentimentData.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h2>Топ по продажам</h2>
          <table>
            <thead><tr><th>Игра</th><th style={{ textAlign: 'right' }}>Млн</th></tr></thead>
            <tbody>
              {data.top_by_sales.map((g) => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td style={{ textAlign: 'right' }}>{g.sales_millions.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Топ по рейтингу</h2>
          <table>
            <thead><tr><th>Игра</th><th style={{ textAlign: 'right' }}>Балл</th></tr></thead>
            <tbody>
              {data.top_by_rating.map((g) => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td style={{ textAlign: 'right' }}>{g.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Топ по онлайну</h2>
          <table>
            <thead><tr><th>Игра</th><th style={{ textAlign: 'right' }}>Игроков</th></tr></thead>
            <tbody>
              {data.top_by_online.map((g) => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(g.online_players)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}