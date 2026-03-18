'use client'
import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { processFiles, loadFromGitHub } from '../../lib/fileLoader'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

function ResultReport({ result, onExport, onReset, sevStyle, scoreColor }) {
  const scores = result.scores || {}
  const findings = result.findings || []

  const radarData = Object.entries(scores).map(([k, v]) => ({
    subject: k.charAt(0).toUpperCase() + k.slice(1),
    value: Math.round(v),
    fullMark: 100
  }))

  const barData = Object.entries(scores).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    score: Math.round(v)
  }))

  const categories = {
    security: findings.filter(f => {
      const t = (f.title + f.description).toLowerCase()
      return t.includes('security') || t.includes('injection') || t.includes('auth') ||
        t.includes('secret') || t.includes('password') || t.includes('token') ||
        t.includes('xss') || t.includes('csrf') || t.includes('vulnerab') || t.includes('exposure')
    }),
    performance: findings.filter(f => {
      const t = (f.title + f.description).toLowerCase()
      return t.includes('performance') || t.includes('memory') || t.includes('leak') ||
        t.includes('query') || t.includes('slow') || t.includes('blocking') || t.includes('n+1')
    }),
    scalability: findings.filter(f => {
      const t = (f.title + f.description).toLowerCase()
      return t.includes('scalab') || t.includes('bottleneck') || t.includes('cache') ||
        t.includes('concurrent') || t.includes('state') || t.includes('coupling')
    }),
    architecture: findings.filter(f => {
      const t = (f.title + f.description).toLowerCase()
      return t.includes('architect') || t.includes('pattern') || t.includes('debt') ||
        t.includes('structure') || t.includes('maintainab') || t.includes('concern')
    })
  }

  // Findings not categorized go to a general bucket
  const categorized = new Set([
    ...categories.security,
    ...categories.performance,
    ...categories.scalability,
    ...categories.architecture
  ])
  const general = findings.filter(f => !categorized.has(f))

  const criticalCount = findings.filter(f => f.severity === 'critical').length
  const warningCount = findings.filter(f => f.severity === 'warning').length
  const avgScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length)

  const severityData = [
    { name: 'Critical', count: criticalCount, color: '#f87171' },
    { name: 'Warning', count: warningCount, color: '#fbbf24' },
    { name: 'Info', count: findings.filter(f => f.severity === 'info').length, color: '#60a5fa' },
    { name: 'Good', count: findings.filter(f => f.severity === 'good').length, color: '#4ade80' },
  ].filter(d => d.count > 0)

  const sectionIcons = { security: '🔒', performance: '⚡', scalability: '📈', architecture: '🏗️' }

  function FindingCard({ f }) {
    const sv = sevStyle(f.severity)
    return (
      <div style={{ background:'#0f0f0f', border:`0.5px solid ${sv.border}`, borderLeft:`3px solid ${sv.border}`, borderRadius:8, padding:14, marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
          <span style={{ fontSize:10, fontFamily:'monospace', padding:'2px 6px', borderRadius:4, background:sv.bg, color:sv.color, whiteSpace:'nowrap', flexShrink:0 }}>{f.severity.toUpperCase()}</span>
          <span style={{ fontSize:14, fontWeight:500, color:'#fff' }}>{f.title}</span>
        </div>
        <div style={{ fontSize:13, color:'#888', lineHeight:1.5 }}>{f.description}</div>
        {f.fix && <pre style={{ fontFamily:'monospace', fontSize:12, background:'#111', border:'0.5px solid #1a1a1a', borderRadius:4, padding:'8px 10px', marginTop:8, whiteSpace:'pre-wrap', wordBreak:'break-all', color:'#888' }}>{f.fix}</pre>}
      </div>
    )
  }

  function Section({ title, icon, findings, score }) {
    if (!findings.length) return null
    return (
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:12, borderBottom:'0.5px solid #1a1a1a' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <span style={{ fontSize:16, fontWeight:600, color:'#fff' }}>{title}</span>
            <span style={{ fontSize:11, fontFamily:'monospace', padding:'2px 8px', borderRadius:10, background:'#1a1a1a', color:'#555' }}>{findings.length} finding{findings.length>1?'s':''}</span>
          </div>
          {score !== undefined && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:80, height:6, background:'#1a1a1a', borderRadius:3, overflow:'hidden' }}>
                <div style={{ width:`${score}%`, height:'100%', background: score>=75?'#4ade80':score>=50?'#fbbf24':'#f87171', borderRadius:3, transition:'width 1s ease' }}/>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color: score>=75?'#4ade80':score>=50?'#fbbf24':'#f87171', fontFamily:'monospace', minWidth:28 }}>{score}</span>
            </div>
          )}
        </div>
        {findings.map((f, i) => <FindingCard key={i} f={f} />)}
      </div>
    )
  }

  return (
    <div>
      {/* HEADER SUMMARY */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:24 }}>
        <div style={{ background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:20, textAlign:'center' }}>
          <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Overall score</div>
          <div style={{ fontSize:48, fontWeight:800, color: scoreColor(avgScore), letterSpacing:'-2px' }}>{avgScore}</div>
          <div style={{ fontSize:12, color:'#555', marginTop:4 }}>{avgScore>=75?'Production ready':avgScore>=50?'Needs work':'Critical issues'}</div>
        </div>
        <div style={{ background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>Findings breakdown</div>
          {severityData.map((d, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:d.color, flexShrink:0 }}/>
                <span style={{ fontSize:12, color:'#888' }}>{d.name}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:d.color, fontFamily:'monospace' }}>{d.count}</span>
            </div>
          ))}
        </div>
        <div style={{ background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:12 }}>Scores</div>
          {Object.entries(scores).map(([k, v]) => (
            <div key={k} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'#888', textTransform:'capitalize' }}>{k}</span>
                <span style={{ fontSize:11, fontFamily:'monospace', color: scoreColor(Math.round(v)) }}>{Math.round(v)}</span>
              </div>
              <div style={{ height:4, background:'#1a1a1a', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${v}%`, height:'100%', background: scoreColor(Math.round(v)), borderRadius:2 }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RADAR CHART */}
      <div style={{ background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:24, marginBottom:24 }}>
        <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:16 }}>Audit radar</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'center' }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a1a1a" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#555', fontSize:12 }} />
              <Radar name="Score" dataKey="value" stroke="#fff" fill="#fff" fillOpacity={0.1} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill:'#555', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill:'#555', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'#111', border:'0.5px solid #333', borderRadius:8, color:'#fff', fontSize:12 }} cursor={{ fill:'#1a1a1a' }} />
              <Bar dataKey="score" radius={[4,4,0,0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div style={{ background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:20, marginBottom:24 }}>
        <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:10 }}>Executive summary</div>
        <div style={{ fontSize:14, lineHeight:1.7, color:'#fff' }}>{result.summary}</div>
        {result.chunks > 1 && (
          <div style={{ fontSize:12, color:'#555', marginTop:10, fontFamily:'monospace' }}>
            Analyzed in {result.chunks} batches · {(result.findings||[]).length} total findings
          </div>
        )}
      </div>

      {/* FINDINGS BY CATEGORY */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:20 }}>Findings by category</div>
        <Section title="Security" icon="🔒" findings={categories.security} score={Math.round(scores.seguridad||scores.security||0)} />
        <Section title="Performance" icon="⚡" findings={categories.performance} score={Math.round(scores.rendimiento||scores.performance||0)} />
        <Section title="Scalability" icon="📈" findings={categories.scalability} score={Math.round(scores.escalabilidad||scores.scalability||0)} />
        <Section title="Architecture" icon="🏗️" findings={categories.architecture} score={Math.round(scores.arquitectura||scores.architecture||0)} />
        {general.length > 0 && <Section title="General" icon="📋" findings={general} />}
      </div>

      {/* ACTIONS */}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingBottom:32 }}>
        <button style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', background:'transparent', color:'#555', border:'0.5px solid #222', borderRadius:8, fontSize:13, cursor:'pointer' }} onClick={onExport}>Export PDF</button>
        <button style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', background:'transparent', color:'#555', border:'0.5px solid #222', borderRadius:8, fontSize:13, cursor:'pointer' }} onClick={onReset}>New audit</button>
      </div>
    </div>
  )
}

export default function Audit() {
  const [code, setCode] = useState('')
  const [lang, setLang] = useState('javascript')
  const [focus, setFocus] = useState('completo')
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [page, setPage] = useState('audit')
  const [cmpA, setCmpA] = useState('')
  const [cmpB, setCmpB] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileCount, setFileCount] = useState(0)
  const [redactedCount, setRedactedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [githubUrl, setGithubUrl] = useState('')
  const [loadingGithub, setLoadingGithub] = useState(false)
  const [uploadMode, setUploadMode] = useState('text')
  const [showPaywall, setShowPaywall] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const fileRef = useRef()
  const folderRef = useRef()
  const intervalRef = useRef()
  const { user } = useUser()

  const loadMsgs = ['Analyzing code...','Detecting vulnerabilities...','Evaluating architecture...','Looking for anti-patterns...','Generating recommendations...']

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('va_history') || '[]')
      setHistory(saved)
    } catch {}
  }, [])

  function saveHistory(newEntry) {
    const updated = [newEntry, ...history].slice(0, 30)
    setHistory(updated)
    try { localStorage.setItem('va_history', JSON.stringify(updated)) } catch {}
  }

  function clearHistory() {
    setHistory([])
    try { localStorage.removeItem('va_history') } catch {}
  }

  async function runAudit() {
    if (!user) { setError('You must be signed in to audit code.'); return }
    setLoading(true)
    setError('')
    setResult(null)
    let i = 0
    setLoadMsg(loadMsgs[0])
    intervalRef.current = setInterval(() => {
      i = (i + 1) % loadMsgs.length
      setLoadMsg(loadMsgs[i])
    }, 2000)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang, focus, userId: user?.id })
      })
      const data = await res.json()
      clearInterval(intervalRef.current)
      if (data.error === 'LIMIT_REACHED') {
        setShowPaywall(true)
        setUsageCount(data.count)
        setLoading(false)
        return
      }
      const entry = { ...data, code: code.substring(0, 300), lang, focus, ts: Date.now(), id: Date.now() }
      saveHistory(entry)
      setResult(entry)
    } catch {
      clearInterval(intervalRef.current)
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  async function loadFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setError('')
    try {
      const result = await processFiles(files)
      setCode(result.combined)
      setFileName(`${result.fileCount} file${result.fileCount>1?'s':''}`)
      setFileCount(result.fileCount)
      setRedactedCount(result.totalRedacted)
      setSkippedCount(result.skippedCount)
    } catch { setError('Error processing files.') }
  }

  async function loadFolder(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setError('')
    try {
      const result = await processFiles(files)
      setCode(result.combined)
      setFileName(`folder · ${result.fileCount} files`)
      setFileCount(result.fileCount)
      setRedactedCount(result.totalRedacted)
      setSkippedCount(result.skippedCount)
    } catch { setError('Error processing folder.') }
  }

  async function loadGitHub() {
    if (!githubUrl.trim()) return
    setLoadingGithub(true)
    setError('')
    try {
      const result = await loadFromGitHub(githubUrl)
      setCode(result.combined)
      setFileName(`github · ${result.repoName} · ${result.fileCount} files`)
      setFileCount(result.fileCount)
      setRedactedCount(result.totalRedacted)
      setSkippedCount(result.skippedCount)
      setLang('javascript')
    } catch(e) { setError(e.message || 'Error loading repository.') }
    setLoadingGithub(false)
  }

  function resetAudit() { setResult(null); setError('') }

  function exportPDF() {
    if (!result) return
    const dt = new Date(result.ts).toLocaleDateString('en-US', { day:'2-digit', month:'long', year:'numeric' })
    const sevColor = s => s==='critical'?'#A32D2D':s==='warning'?'#854F0B':s==='info'?'#185FA5':'#3B6D11'
    const sevBg = s => s==='critical'?'#FCEBEB':s==='warning'?'#FAEEDA':s==='info'?'#E6F1FB':'#EAF3DE'
    const scoresHTML = Object.entries(result.scores||{}).map(([k,v])=>`<div style="text-align:center;padding:12px;background:#f5f5f5;border-radius:8px"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px">${k}</div><div style="font-size:24px;font-weight:700;color:${v>=75?'#3B6D11':v>=50?'#854F0B':'#A32D2D'}">${Math.round(v)}</div></div>`).join('')
    const findingsHTML = (result.findings||[]).map(f=>`<div style="border:1px solid #e5e5e5;border-left:3px solid ${sevColor(f.severity)};border-radius:8px;padding:12px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="background:${sevBg(f.severity)};color:${sevColor(f.severity)};font-size:10px;padding:2px 7px;border-radius:4px">${f.severity.toUpperCase()}</span><strong>${f.title}</strong></div><p style="font-size:12px;color:#555;margin:0">${f.description}</p>${f.fix?`<pre style="font-size:11px;background:#f5f5f5;padding:8px;border-radius:4px;margin-top:8px;white-space:pre-wrap">${f.fix}</pre>`:''}</div>`).join('')
    const win = window.open('','_blank')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VibeAudit Report</title><style>body{font-family:-apple-system,sans-serif;max-width:760px;margin:0 auto;padding:32px}.score-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}@media print{button{display:none}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee"><div><h1 style="margin:0;font-size:22px">VibeAudit Report</h1><p style="margin:4px 0 0;color:#888;font-size:13px">${dt} · ${result.lang} · ${result.focus}</p></div><button onclick="window.print()" style="padding:8px 16px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;cursor:pointer">Print / Save PDF</button></div><h2 style="font-size:14px;text-transform:uppercase;color:#888">Scores</h2><div class="score-row">${scoresHTML}</div><h2 style="font-size:14px;text-transform:uppercase;color:#888">Findings</h2>${findingsHTML}<h2 style="font-size:14px;text-transform:uppercase;color:#888">Executive Summary</h2><p style="font-size:13px;line-height:1.6;padding:14px;background:#f9f9f9;border-radius:8px">${result.summary}</p></body></html>`)
    win.document.close()
  }

  function getClass(n) { return n>=75?'good':n>=50?'warn':'bad' }
  const scoreColor = n => n>=75?'#4ade80':n>=50?'#fbbf24':'#f87171'
  const sevStyle = sev => ({
    critical: { bg:'#2d0a0a', color:'#f87171', border:'#7f1d1d' },
    warning:  { bg:'#2d1a00', color:'#fbbf24', border:'#78350f' },
    info:     { bg:'#0a1628', color:'#60a5fa', border:'#1e3a5f' },
    good:     { bg:'#0a2010', color:'#4ade80', border:'#14532d' },
  }[sev] || { bg:'#1a1a1a', color:'#888', border:'#333' })

  const focusOptions = ['full','security','performance','scalability','architecture']

  function renderCompare() {
    if (!cmpA || !cmpB || cmpA === cmpB) return null
    const a = history.find(x => x.id === parseInt(cmpA))
    const b = history.find(x => x.id === parseInt(cmpB))
    if (!a || !b) return null
    return (
      <div>
        <div style={s.diffCard}>
          <div style={s.diffTitle}>Score comparison</div>
          {Object.keys(a.scores||{}).map(k => {
            const va = Math.round(a.scores[k])
            const vb = Math.round(b.scores[k])
            const diff = vb - va
            return (
              <div key={k} style={s.diffRow}>
                <span style={s.diffLbl}>{k}</span>
                <div style={s.diffVals}>
                  <span style={{...s.diffNum,color:'#555'}}>{va}</span>
                  <span style={{color:'#555',fontSize:12}}>→</span>
                  <span style={s.diffNum}>{vb}</span>
                  <span style={{fontSize:12,color:diff>0?'#4ade80':diff<0?'#f87171':'#555'}}>{diff>0?`▲ +${diff}`:diff<0?`▼ ${diff}`:'= 0'}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
          {[a,b].map((item,i) => (
            <div key={i} style={s.diffCard}>
              <div style={{fontSize:11,color:'#555',marginBottom:8}}>Version {i===0?'A':'B'} · {new Date(item.ts).toLocaleDateString('en-US')}</div>
              <div style={{fontSize:13,color:'#888',lineHeight:1.5}}>{item.summary}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const s = {
    app: { fontFamily:"'Segoe UI',sans-serif", minHeight:'100vh', background:'#0a0a0a', color:'#fff' },
    nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', background:'#0a0a0a', borderBottom:'0.5px solid #1a1a1a', position:'sticky', top:0, zIndex:100 },
    logo: { display:'flex', alignItems:'center', gap:9, cursor:'pointer' },
    logoBox: { width:30, height:30, background:'#fff', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' },
    logoName: { fontSize:17, fontWeight:700, letterSpacing:'-0.5px' },
    navTabs: { display:'flex', gap:2, background:'#111', borderRadius:8, padding:3 },
    navTab: { padding:'6px 14px', borderRadius:6, fontSize:13, border:'none', background:'transparent', color:'#fff', cursor:'pointer', fontWeight:500 },    navTabActive: { padding:'6px 14px', borderRadius:6, fontSize:13, border:'0.5px solid #333', background:'#1a1a1a', color:'#fff', cursor:'pointer', fontWeight:500 },
    page: { padding:24, maxWidth:860, margin:'0 auto' },
    pageHd: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
    pageTitle: { fontSize:20, fontWeight:700, letterSpacing:'-0.3px', color:'#fff' },
    pageSub: { fontSize:13, color:'#555', marginTop:2 },
    panel: { background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, overflow:'hidden', marginBottom:16 },
    toolbar: { display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'0.5px solid #1a1a1a', background:'#0f0f0f', flexWrap:'wrap' },
    select: { fontFamily:'monospace', fontSize:12, padding:'4px 8px', borderRadius:6, border:'0.5px solid #2a2a2a', background:'#1a1a1a', color:'#fff', cursor:'pointer' },
    focusBtn: { fontSize:11, padding:'4px 9px', borderRadius:20, border:'0.5px solid #222', background:'transparent', color:'#555', cursor:'pointer', whiteSpace:'nowrap' },
    focusBtnActive: { fontSize:11, padding:'4px 9px', borderRadius:20, border:'0.5px solid #fff', background:'#fff', color:'#0a0a0a', cursor:'pointer', whiteSpace:'nowrap' },
    textarea: { fontFamily:'monospace', fontSize:13, width:'100%', minHeight:200, padding:14, border:'none', background:'transparent', color:'#fff', resize:'vertical', outline:'none', lineHeight:1.6 },
    panelFoot: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderTop:'0.5px solid #1a1a1a', background:'#0f0f0f' },
    btnPrimary: { display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px', background:'#fff', color:'#0a0a0a', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' },
    btnSec: { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', background:'transparent', color:'#555', border:'0.5px solid #222', borderRadius:8, fontSize:13, cursor:'pointer' },
    scoreGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 },
    scoreCard: { background:'#111', border:'0.5px solid #1a1a1a', borderRadius:8, padding:14, textAlign:'center' },
    scoreLbl: { fontSize:10, color:'#555', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 },
    finding: { background:'#111', border:'0.5px solid #1a1a1a', borderRadius:8, padding:14, marginBottom:8 },
    sevPill: { fontSize:10, fontFamily:'monospace', padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', flexShrink:0 },
    summaryBox: { background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:16, marginBottom:16 },
    uploadZone: { border:'1.5px dashed #222', borderRadius:10, padding:24, textAlign:'center', cursor:'pointer', marginBottom:16, background:'#111' },
    histItem: { background:'#111', border:'0.5px solid #1a1a1a', borderRadius:12, padding:16, cursor:'pointer', marginBottom:10 },
    diffCard: { background:'#111', border:'0.5px solid #1a1a1a', borderRadius:10, padding:14 },
    diffTitle: { fontSize:13, fontWeight:500, marginBottom:12, color:'#fff' },
    diffRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
    diffLbl: { fontSize:12, color:'#555' },
    diffVals: { display:'flex', alignItems:'center', gap:8 },
    diffNum: { fontSize:14, fontWeight:500, fontFamily:'monospace', color:'#fff' },
    cmpSelect: { width:'100%', padding:'8px 10px', borderRadius:8, border:'0.5px solid #222', background:'#111', color:'#fff', fontSize:13, marginBottom:10 },
    err: { padding:'12px 16px', background:'#1a0a0a', borderRadius:8, color:'#f87171', fontSize:13, marginBottom:16, border:'0.5px solid #7f1d1d' },
    loading: { display:'flex', flexDirection:'column', alignItems:'center', padding:'3rem 1rem', gap:14 },
  }

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.logo} onClick={() => window.location.href='/'}>
          <div style={s.logoBox}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3.5h12M2 7h7M2 10.5h9" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="13" cy="10.5" r="2.5" stroke="#0a0a0a" strokeWidth="1.2"/>
            </svg>
          </div>
          <span style={s.logoName}>vibe<span style={{color:'#555',fontWeight:400}}>audit</span></span>
        </div>
        <div style={s.navTabs}>
          {['audit','history','compare'].map(p => (
            <button key={p} style={page===p?s.navTabActive:s.navTab} onClick={()=>setPage(p)}>
              {p==='audit'?'Audit':p==='history'?`History (${history.length})`:'Compare'}
            </button>
          ))}
        </div>
      </nav>

      {page === 'audit' && (
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>Code audit</div>
              <div style={s.pageSub}>Analyze your code project with AI</div>
            </div>
          </div>

          {!result && (
            <>
              <div style={{display:'flex',gap:4,marginBottom:12}}>
                {[['text','✏️ Paste code'],['files','📄 Files'],['folder','📁 Folder'],['github','🐙 GitHub']].map(([mode,label])=>(
                  <button key={mode} onClick={()=>{setUploadMode(mode);setCode('');setFileName('');setFileCount(0);setRedactedCount(0)}}
                    style={{...uploadMode===mode?s.focusBtnActive:s.focusBtn, fontSize:12, padding:'5px 10px'}}>
                    {label}
                  </button>
                ))}
              </div>

              {uploadMode==='files' && (
                <div style={s.uploadZone} onClick={()=>fileRef.current.click()}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:4,color:'#fff'}}>Select one or more files</div>
                  <div style={{fontSize:12,color:'#555',fontFamily:'monospace'}}>.js .ts .py .jsx .tsx .sql .go .rs</div>
                  {fileName && <div style={{fontSize:12,marginTop:8,color:'#4ade80'}}>📄 {fileName}</div>}
                </div>
              )}
              <input ref={fileRef} type="file" style={{display:'none'}} multiple accept=".js,.ts,.py,.jsx,.tsx,.sql,.go,.rs,.php,.rb,.java,.cs,.swift,.kt" onChange={loadFiles}/>

              {uploadMode==='folder' && (
                <div style={s.uploadZone} onClick={()=>folderRef.current.click()}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:4,color:'#fff'}}>Select a project folder</div>
                  <div style={{fontSize:12,color:'#555',fontFamily:'monospace'}}>node_modules, .git, .env and sensitive files are excluded automatically</div>
                  {fileName && <div style={{fontSize:12,marginTop:8,color:'#4ade80'}}>📁 {fileName}</div>}
                </div>
              )}
              <input ref={folderRef} type="file" style={{display:'none'}} webkitdirectory="" onChange={loadFolder}/>

              {uploadMode==='github' && (
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',gap:8}}>
                    <input type="text" value={githubUrl} onChange={e=>setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      style={{flex:1,padding:'10px 12px',borderRadius:8,border:'0.5px solid #222',fontSize:13,fontFamily:'monospace',outline:'none',background:'#111',color:'#fff'}}/>
                    <button onClick={loadGitHub} disabled={loadingGithub||!githubUrl.trim()} style={{...s.btnPrimary,opacity:loadingGithub||!githubUrl.trim()?0.4:1}}>
                      {loadingGithub ? 'Loading...' : 'Load'}
                    </button>
                  </div>
                  <div style={{fontSize:11,color:'#555',marginTop:6}}>Public repositories only. Sensitive files are excluded automatically.</div>
                  {fileName && <div style={{fontSize:12,marginTop:8,color:'#4ade80'}}>🐙 {fileName}</div>}
                </div>
              )}

              {(redactedCount > 0 || skippedCount > 0) && (
                <div style={{padding:'10px 14px',background:'#0a2010',border:'0.5px solid #14532d',borderRadius:8,fontSize:12,color:'#4ade80',marginBottom:12}}>
                  🛡️ Protection active — {redactedCount > 0 ? `${redactedCount} sensitive item${redactedCount>1?'s':''} redacted` : ''}{redactedCount>0&&skippedCount>0?' · ':''}{skippedCount > 0 ? `${skippedCount} file${skippedCount>1?'s':''} excluded` : ''}
                </div>
              )}

              <div style={s.panel}>
                <div style={s.toolbar}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,color:'#555',fontWeight:500,textTransform:'uppercase',letterSpacing:.5,whiteSpace:'nowrap'}}>Audit type</span>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {focusOptions.map(f => (
                        <button key={f} onClick={()=>setFocus(f)} style={{
                          fontSize:13,
                          padding:'7px 14px',
                          borderRadius:8,
                          border: focus===f ? 'none' : '0.5px solid #333',
                          background: focus===f ? '#fff' : 'transparent',
                          color: focus===f ? '#0a0a0a' : '#fff',
                          cursor:'pointer',
                          fontWeight: focus===f ? 600 : 400,
                          whiteSpace:'nowrap',
                          transition:'all .15s'
                        }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {uploadMode==='text' && (
                  <textarea style={s.textarea} value={code} onChange={e=>setCode(e.target.value)} placeholder="// Paste your code here or use the options above..."/>
                )}
                {uploadMode!=='text' && code && (
                  <div style={{padding:'12px 14px',fontFamily:'monospace',fontSize:12,color:'#555',borderTop:'0.5px solid #1a1a1a'}}>
                    {fileCount} file{fileCount>1?'s':''} loaded · {code.length.toLocaleString()} characters ready to audit
                  </div>
                )}
                <div style={s.panelFoot}>
                  <span style={{fontSize:12,color:'#555',fontFamily:'monospace'}}>{code.length} characters</span>
                  <button style={{...s.btnPrimary, opacity: loading||code.length<10?0.4:1}} onClick={runAudit} disabled={loading||code.length<10}>
                    {loading ? loadMsg : 'Audit code →'}
                  </button>
                </div>
              </div>
              {error && <div style={s.err}>{error}</div>}
            </>
          )}

          {loading && (
            <div style={s.loading}>
              <div style={{width:26,height:26,border:'2px solid #222',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              <span style={{fontSize:13,color:'#555',fontFamily:'monospace'}}>{loadMsg}</span>
            </div>
          )}

          {result && !loading && (
            <ResultReport result={result} onExport={exportPDF} onReset={resetAudit} sevStyle={sevStyle} scoreColor={scoreColor} />
          )}
        </div>
      )}

      {page === 'history' && (
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>History</div>
              <div style={s.pageSub}>All your previous audits</div>
            </div>
            {history.length > 0 && <button style={s.btnSec} onClick={clearHistory}>Clear all</button>}
          </div>
          {history.length === 0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'#555',fontSize:14}}>No audits yet. Go to Audit to get started.</div>
          ) : (
            history.map(item => (
              <div key={item.id} style={s.histItem} onClick={()=>{setResult(item);setPage('audit')}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:500,color:'#fff'}}>{item.lang} · {item.focus}</span>
                    <div style={{fontSize:11,color:'#555',fontFamily:'monospace',marginTop:2}}>{new Date(item.ts).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'})}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {Object.entries(item.scores||{}).map(([k,v])=>(
                      <span key={k} style={{fontSize:11,padding:'2px 8px',borderRadius:10,fontFamily:'monospace',
                        background:v>=75?'#0a2010':v>=50?'#2d1a00':'#2d0a0a',
                        color:v>=75?'#4ade80':v>=50?'#fbbf24':'#f87171'
                      }}>{k.substring(0,3)} {Math.round(v)}</span>
                    ))}
                  </div>
                </div>
                <div style={{fontFamily:'monospace',fontSize:11,color:'#555',background:'#0f0f0f',borderRadius:6,padding:'6px 8px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.code}</div>
              </div>
            ))
          )}
        </div>
      )}

      {page === 'compare' && (
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>Compare</div>
              <div style={s.pageSub}>Measure improvement between audits</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            {[['A','cmpA',setCmpA],['B','cmpB',setCmpB]].map(([label,key,setter])=>(
              <div key={label}>
                <div style={{fontSize:13,fontWeight:500,color:'#555',marginBottom:8}}>Version {label}</div>
                <select style={s.cmpSelect} onChange={e=>setter(e.target.value)}>
                  <option value="">— Select audit —</option>
                  {history.map(item=>(
                    <option key={item.id} value={item.id}>
                      {new Date(item.ts).toLocaleDateString('en-US',{day:'2-digit',month:'short'})} · {item.lang} · avg {Math.round(Object.values(item.scores||{}).reduce((a,b)=>a+b,0)/4)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {renderCompare() || <div style={{textAlign:'center',padding:'2rem',color:'#555',fontSize:13,background:'#111',border:'0.5px solid #1a1a1a',borderRadius:8}}>Select two audits to compare.</div>}
        </div>
      )}

      {showPaywall && (
        <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#111',border:'0.5px solid #222',borderRadius:16,padding:32,maxWidth:600,width:'100%',textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>🚀</div>
            <h2 style={{fontSize:22,fontWeight:700,marginBottom:8,letterSpacing:'-0.5px',color:'#fff'}}>You've used your 3 free audits</h2>
            <p style={{fontSize:14,color:'#555',marginBottom:32}}>Choose a plan to keep auditing your code</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:24}}>
              <div style={{border:'0.5px solid #222',borderRadius:12,padding:20,textAlign:'left'}}>
                <div style={{fontSize:12,fontWeight:500,color:'#555',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Free</div>
                <div style={{fontSize:28,fontWeight:700,marginBottom:4,color:'#fff'}}>$0</div>
                <div style={{fontSize:12,color:'#555',marginBottom:16}}>forever</div>
                <div style={{fontSize:13,color:'#888',lineHeight:1.8}}>
                  ✓ 3 total audits<br/>✓ Single files<br/>✓ Basic history<br/><span style={{color:'#333'}}>✗ Full projects<br/>✗ GitHub</span>
                </div>
                <button style={{width:'100%',marginTop:16,padding:'8px 0',borderRadius:8,border:'0.5px solid #333',background:'transparent',fontSize:13,cursor:'pointer',color:'#555'}} onClick={()=>setShowPaywall(false)}>
                  Current plan
                </button>
              </div>
              <div style={{border:'2px solid #fff',borderRadius:12,padding:20,textAlign:'left',position:'relative'}}>
                <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'#fff',color:'#0a0a0a',fontSize:10,padding:'3px 10px',borderRadius:10,whiteSpace:'nowrap',fontWeight:600}}>MOST POPULAR</div>
                <div style={{fontSize:12,fontWeight:500,color:'#555',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Pro</div>
                <div style={{fontSize:28,fontWeight:700,marginBottom:4,color:'#fff'}}>$9<span style={{fontSize:14,fontWeight:400,color:'#555'}}>/mo</span></div>
                <div style={{fontSize:12,color:'#555',marginBottom:16}}>billed monthly</div>
                <div style={{fontSize:13,color:'#888',lineHeight:1.8}}>
                  ✓ Unlimited audits<br/>✓ Full projects<br/>✓ GitHub<br/>✓ Full history<br/>✓ PDF export
                </div>
                <button style={{width:'100%',marginTop:16,padding:'8px 0',borderRadius:8,border:'none',background:'#fff',color:'#0a0a0a',fontSize:13,cursor:'pointer',fontWeight:600}}>
                  Start Pro →
                </button>
              </div>
              <div style={{border:'0.5px solid #222',borderRadius:12,padding:20,textAlign:'left'}}>
                <div style={{fontSize:12,fontWeight:500,color:'#555',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Team</div>
                <div style={{fontSize:28,fontWeight:700,marginBottom:4,color:'#fff'}}>$29<span style={{fontSize:14,fontWeight:400,color:'#555'}}>/mo</span></div>
                <div style={{fontSize:12,color:'#555',marginBottom:16}}>up to 5 users</div>
                <div style={{fontSize:13,color:'#888',lineHeight:1.8}}>
                  ✓ Everything in Pro<br/>✓ 5 team members<br/>✓ Shared dashboard<br/>✓ Team audits<br/>✓ Priority support
                </div>
                <button style={{width:'100%',marginTop:16,padding:'8px 0',borderRadius:8,border:'0.5px solid #555',background:'transparent',fontSize:13,cursor:'pointer',fontWeight:500,color:'#fff'}}>
                  Start Team →
                </button>
              </div>
            </div>
            <button style={{fontSize:13,color:'#555',background:'transparent',border:'none',cursor:'pointer'}} onClick={()=>setShowPaywall(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}