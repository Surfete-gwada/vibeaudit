'use client'
import { useState } from 'react'

export default function Home() {
  const [code, setCode] = useState('')
  const [lang, setLang] = useState('javascript')
  const [focus, setFocus] = useState('completo')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function runAudit() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang, focus })
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('Error al conectar. Inténtalo de nuevo.')
    }
    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>VibeAudit</h1>
      <select value={lang} onChange={e => setLang(e.target.value)} style={{ marginRight: 8 }}>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="python">Python</option>
        <option value="react">React</option>
      </select>
      <select value={focus} onChange={e => setFocus(e.target.value)}>
        <option value="completo">Auditoría completa</option>
        <option value="seguridad">Seguridad</option>
        <option value="rendimiento">Rendimiento</option>
        <option value="escalabilidad">Escalabilidad</option>
      </select>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Pega tu código aquí..."
        style={{ display: 'block', width: '100%', minHeight: 200, marginTop: 16, padding: 12, fontFamily: 'monospace' }}
      />
      <button onClick={runAudit} disabled={loading || code.length < 10} style={{ marginTop: 12, padding: '10px 24px' }}>
        {loading ? 'Analizando...' : 'Auditar código'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>Puntuaciones</h2>
          <div style={{ display: 'flex', gap: 16 }}>
            {Object.entries(result.scores).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 12 }}>{k}</div>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: 24 }}>Hallazgos</h2>
          {result.findings.map((f, i) => (
            <div key={i} style={{ borderLeft: '3px solid #ccc', paddingLeft: 12, marginBottom: 16 }}>
              <strong>{f.severity.toUpperCase()} — {f.title}</strong>
              <p>{f.description}</p>
              {f.fix && <pre style={{ background: '#f5f5f5', padding: 8 }}>{f.fix}</pre>}
            </div>
          ))}
          <h2>Resumen</h2>
          <p>{result.summary}</p>
        </div>
      )}
    </main>
  )
}