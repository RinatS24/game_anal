import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  BarChart, Bar, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell,
} from 'recharts'

const CHART_COLORS = ['#7c5cff', '#4ea8de', '#2bb673', '#f4b942', '#ef5a5a', '#b178ff', '#5fd0c2']
const tooltipStyle = { background: '#181b22', border: '1px solid #2a2f3e', borderRadius: 6, color: '#e6e9f2' }

export default function Analytics() {
  const [data, setData] = useState(null)
  const [games, setGames] = useState([])

  useEffect(() => {
    api.dashboard().then(setData)
    api.listGames({ limit: 200, sort_by: 'sales_millions', sort_dir: 'desc' }).then((r) => setGames(r.items))
  }, [])

  if (!data) return <div className="loading"><div className="spinner" /></div>

  const scatterData = games.map((g) => ({
    title: g.title, x: g.rating, y: g.sales_millions, z: Math.max(g.online_players, 1000),
  }))

  const topGenres = data.genres.slice(0, 7)
  const maxSales = Math.max(...topGenres.map((g) => g.total_sales), 1)
  const maxCount = Math.max(...topGenres.map((g) => g.count), 1)
  const radarData = topGenres.map((g) => ({
    genre: g.genre,
    sales: (g.total_sales / maxSales) * 100,
    count: (g.count / maxCount) * 100,
    rating: g.avg_rating * 10,
  }))

  const platformAvg = data.platforms.map((p) => ({
    platform: p.platform,
    avg_rating: p.avg_rating,
    count: p.count,
  }))

  return (
    <>
      <div className="page-header">
        <h1>Расширенная аналитика</h1>
      </div>

      <div className="card">
        <h2>Зависимость продаж от рейтинга</h2>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: -8, marginBottom: 12 }}>
          Каждая точка — игра. По горизонтали рейтинг, по вертикали продажи (млн копий).
        </p>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
            <XAxis type="number" dataKey="x" name="Рейтинг" domain={[0, 10]} stroke="#9aa3b8" label={{ value: 'Рейтинг', position: 'insideBottom', offset: -5, fill: '#9aa3b8' }} />
            <YAxis type="number" dataKey="y" name="Продажи" stroke="#9aa3b8" label={{ value: 'Продажи, млн', angle: -90, position: 'insideLeft', fill: '#9aa3b8' }} />
            <ZAxis dataKey="z" range={[30, 400]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                if (name === 'Рейтинг') return value.toFixed(1)
                if (name === 'Продажи') return value.toFixed(1) + ' млн'
                return value
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.title || ''}
            />
            <Scatter data={scatterData} fill="#7c5cff" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Структура жанров (радар)</h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2a2f3e" />
              <PolarAngleAxis dataKey="genre" stroke="#9aa3b8" fontSize={11} />
              <PolarRadiusAxis stroke="#9aa3b8" />
              <Radar name="Продажи" dataKey="sales" stroke="#7c5cff" fill="#7c5cff" fillOpacity={0.5} />
              <Radar name="Количество" dataKey="count" stroke="#4ea8de" fill="#4ea8de" fillOpacity={0.3} />
              <Radar name="Рейтинг" dataKey="rating" stroke="#2bb673" fill="#2bb673" fillOpacity={0.3} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Средний рейтинг по платформам</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={platformAvg} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis type="number" domain={[0, 10]} stroke="#9aa3b8" />
              <YAxis type="category" dataKey="platform" stroke="#9aa3b8" width={120} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="avg_rating" name="Средний рейтинг">
                {platformAvg.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2>Сводная таблица по жанрам</h2>
        <table>
          <thead>
            <tr>
              <th>Жанр</th>
              <th style={{ textAlign: 'right' }}>Игр</th>
              <th style={{ textAlign: 'right' }}>Суммарные продажи, млн</th>
              <th style={{ textAlign: 'right' }}>Средний рейтинг</th>
              <th style={{ textAlign: 'right' }}>Доля рынка</th>
            </tr>
          </thead>
          <tbody>
            {data.genres.map((g) => {
              const share = (g.total_sales / data.total_sales) * 100
              return (
                <tr key={g.genre}>
                  <td><strong>{g.genre}</strong></td>
                  <td style={{ textAlign: 'right' }}>{g.count}</td>
                  <td style={{ textAlign: 'right' }}>{g.total_sales.toFixed(1)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`tag ${g.avg_rating >= 8 ? 'success' : g.avg_rating >= 6 ? 'warning' : 'danger'}`}>
                      {g.avg_rating.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{share.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Сводная таблица по платформам</h2>
        <table>
          <thead>
            <tr>
              <th>Платформа</th>
              <th style={{ textAlign: 'right' }}>Игр</th>
              <th style={{ textAlign: 'right' }}>Суммарные продажи, млн</th>
              <th style={{ textAlign: 'right' }}>Средний рейтинг</th>
              <th style={{ textAlign: 'right' }}>Доля рынка</th>
            </tr>
          </thead>
          <tbody>
            {data.platforms.map((p) => {
              const share = (p.total_sales / data.total_sales) * 100
              return (
                <tr key={p.platform}>
                  <td><strong>{p.platform}</strong></td>
                  <td style={{ textAlign: 'right' }}>{p.count}</td>
                  <td style={{ textAlign: 'right' }}>{p.total_sales.toFixed(1)}</td>
                  <td style={{ textAlign: 'right' }}>{p.avg_rating.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{share.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}