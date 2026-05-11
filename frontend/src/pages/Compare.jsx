import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Cell,
} from 'recharts'

const COLORS = ['#7c5cff', '#4ea8de', '#2bb673', '#f4b942', '#ef5a5a']
const tooltipStyle = { background: '#181b22', border: '1px solid #2a2f3e', borderRadius: 6, color: '#e6e9f2' }

export default function Compare() {
  const [allGames, setAllGames] = useState([])
  const [selected, setSelected] = useState([])
  const [results, setResults] = useState([])

  useEffect(() => {
    api.listGames({ limit: 200, sort_by: 'sales_millions', sort_dir: 'desc' }).then((r) => setAllGames(r.items))
  }, [])

  useEffect(() => {
    if (selected.length === 0) { setResults([]); return }
    api.compare(selected).then(setResults)
  }, [selected])

  const toggle = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 5))
  }

  const radarData = ['rating', 'metacritic', 'sales_millions', 'online_players', 'price'].map((key) => {
    const labels = {
      rating: 'Рейтинг',
      metacritic: 'Metacritic',
      sales_millions: 'Продажи',
      online_players: 'Онлайн',
      price: 'Цена',
    }
    const point = { metric: labels[key] }
    const max = Math.max(...results.map((r) => r[key] || 0), 1)
    results.forEach((r) => {
      const value = r[key] || 0
      point[r.title] = (value / max) * 100
    })
    return point
  })

  return (
    <>
      <div className="page-header">
        <h1>Сравнение игр</h1>
        <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Выбрано: {selected.length} / 5</div>
      </div>

      <div className="card">
        <h2>Выберите до 5 игр для сравнения</h2>
        <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Название</th>
                <th>Жанр</th>
                <th>Платформа</th>
                <th style={{ textAlign: 'right' }}>Продажи</th>
                <th style={{ textAlign: 'right' }}>Рейтинг</th>
              </tr>
            </thead>
            <tbody>
              {allGames.map((g) => (
                <tr key={g.id} style={{ background: selected.includes(g.id) ? 'rgba(124,92,255,0.1)' : '' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(g.id)}
                      onChange={() => toggle(g.id)}
                      disabled={!selected.includes(g.id) && selected.length >= 5}
                    />
                  </td>
                  <td>{g.title}</td>
                  <td>{g.genre?.name}</td>
                  <td>{g.platform?.name}</td>
                  <td style={{ textAlign: 'right' }}>{g.sales_millions.toFixed(1)}</td>
                  <td style={{ textAlign: 'right' }}>{g.rating.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {results.length > 0 && (
        <>
          <div className="card">
            <h2>Сводная таблица сравнения</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Параметр</th>
                    {results.map((r) => <th key={r.id}>{r.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Жанр</td>{results.map((r) => <td key={r.id}>{r.genre}</td>)}</tr>
                  <tr><td>Платформа</td>{results.map((r) => <td key={r.id}>{r.platform}</td>)}</tr>
                  <tr><td>Цена</td>{results.map((r) => <td key={r.id}>{r.price ? `${r.price.toFixed(0)} ₽` : 'F2P'}</td>)}</tr>
                  <tr><td>Рейтинг</td>{results.map((r) => <td key={r.id}>{r.rating.toFixed(1)}</td>)}</tr>
                  <tr><td>Metacritic</td>{results.map((r) => <td key={r.id}>{r.metacritic || '—'}</td>)}</tr>
                  <tr><td>Продажи (млн)</td>{results.map((r) => <td key={r.id}>{r.sales_millions.toFixed(1)}</td>)}</tr>
                  <tr><td>Игроки онлайн</td>{results.map((r) => <td key={r.id}>{r.online_players.toLocaleString('ru-RU')}</td>)}</tr>
                  <tr><td>Отзывов</td>{results.map((r) => <td key={r.id}>{r.reviews_count}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>

          {results.length >= 2 && (
            <div className="grid-2">
              <div className="card">
                <h2>Радар сравнения (нормировано)</h2>
                <ResponsiveContainer width="100%" height={380}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2a2f3e" />
                    <PolarAngleAxis dataKey="metric" stroke="#9aa3b8" />
                    <PolarRadiusAxis stroke="#9aa3b8" />
                    {results.map((r, i) => (
                      <Radar key={r.id} name={r.title} dataKey={r.title}
                        stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.25} />
                    ))}
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2>Продажи (млн копий)</h2>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                    <XAxis dataKey="title" stroke="#9aa3b8" angle={-20} textAnchor="end" height={80} fontSize={11} />
                    <YAxis stroke="#9aa3b8" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="sales_millions" name="Продажи (млн)">
                      {results.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {selected.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>
          Отметьте чекбоксами игры, чтобы увидеть сравнение.
        </div>
      )}
    </>
  )
}