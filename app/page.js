'use client'
import { useState, useRef } from 'react'

export default function Home() {
  const [code, setCode] = useState('')
  const [lang, setLang] = useState('javascript')
  const [focus, setFocus] = useState('completo')
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('va_history') || '[]') } catch { return [] }
  })
  const [page, setPage] = useState('audit')
  const [cmpA, setCmpA] = useState('')
  const [cmpB, setCmpB] = useState('')
  const [fileName, setFileName] = useState('')
  const fileRef = useRef()
  const intervalRef = useRef()

  const loadMsgs = ['Analizando código...','Detectando vulnerabilidades...','Evaluando arquitectura...','Buscando anti-patrones...','Generando recomendaciones...']

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
        body: JSON.stringify({ code, lang, focus })
      })
      const data = await res.json()
      clearInterval(intervalRef.current)
      const entry = { ...data, code: code.substring(0, 300), lang, focus, ts: Date.now(), id: Date.now() }
      saveHistory(entry)
      setResult(entry)
    } catch {
      clearInterval(intervalRef.current)
      setError('Error al conectar. Inténtalo de nuevo.')
    }
    setLoading(false)
  }

  function loadFile(e) {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 512000) { setError('Archivo muy grande. Máximo 500KB.'); return }
    const r = new FileReader()
    r.onload = ev => {
      setCode(ev.target.result)
      setFileName(f.name)
      const ext = f.name.split('.').pop().toLowerCase()
      const map = { js:'javascript', ts:'typescript', py:'python', jsx:'react', tsx:'react', sql:'sql' }
      if (map[ext]) setLang(map[ext])
    }
    r.readAsText(f)
  }

  function resetAudit() {
    setResult(null)
    setError('')
  }

  function exportPDF() {
    if (!result) return
    const dt = new Date(result.ts).toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' })
    const sevColor = s => s==='critical'?'#A32D2D':s==='warning'?'#854F0B':s==='info'?'#185FA5':'#3B6D11'
    const sevBg = s => s==='critical'?'#FCEBEB':s==='warning'?'#FAEEDA':s==='info'?'#E6F1FB':'#EAF3DE'
    const scoresHTML = Object.entries(result.scores||{}).map(([k,v])=>`<div style="text-align:center;padding:12px;background:#f5f5f5;border-radius:8px"><div style="font-size:10px;color:#888;text-transform:uppercase;margin-bottom:4px">${k}</div><div style="font-size:24px;font-weight:700;color:${v>=75?'#3B6D11':v>=50?'#854F0B':'#A32D2D'}">${Math.round(v)}</div></div>`).join('')
    const findingsHTML = (result.findings||[]).map(f=>`<div style="border:1px solid #e5e5e5;border-left:3px solid ${sevColor(f.severity)};border-radius:8px;padding:12px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="background:${sevBg(f.severity)};color:${sevColor(f.severity)};font-size:10px;padding:2px 7px;border-radius:4px">${f.severity.toUpperCase()}</span><strong>${f.title}</strong></div><p style="font-size:12px;color:#555;margin:0">${f.description}</p>${f.fix?`<pre style="font-size:11px;background:#f5f5f5;padding:8px;border-radius:4px;margin-top:8px;white-space:pre-wrap">${f.fix}</pre>`:''}</div>`).join('')
    const win = window.open('','_blank')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>VibeAudit Report</title><style>body{font-family:-apple-system,sans-serif;max-width:760px;margin:0 auto;padding:32px}.score-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px}@media print{button{display:none}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee"><div><h1 style="margin:0;font-size:22px">VibeAudit Report</h1><p style="margin:4px 0 0;color:#888;font-size:13px">${dt} · ${result.lang} · ${result.focus}</p></div><button onclick="window.print()" style="padding:8px 16px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;cursor:pointer">Imprimir / Guardar PDF</button></div><h2 style="font-size:14px;text-transform:uppercase;color:#888">Puntuaciones</h2><div class="score-row">${scoresHTML}</div><h2 style="font-size:14px;text-transform:uppercase;color:#888">Hallazgos</h2>${findingsHTML}<h2 style="font-size:14px;text-transform:uppercase;color:#888">Resumen</h2><p style="font-size:13px;line-height:1.6;padding:14px;background:#f9f9f9;border-radius:8px">${result.summary}</p></body></html>`)
    win.document.close()
  }

  function getClass(n) { return n>=75?'good':n>=50?'warn':'bad' }

  const focusOptions = ['completo','seguridad','rendimiento','escalabilidad','arquitectura']

  // COMPARE
  function renderCompare() {
    if (!cmpA || !cmpB || cmpA === cmpB) return null
    const a = history.find(x => x.id === parseInt(cmpA))
    const b = history.find(x => x.id === parseInt(cmpB))
    if (!a || !b) return null
    return (
      <div>
        <div style={s.diffCard}>
          <div style={s.diffTitle}>Comparación de puntuaciones</div>
          {Object.keys(a.scores||{}).map(k => {
            const va = Math.round(a.scores[k])
            const vb = Math.round(b.scores[k])
            const diff = vb - va
            return (
              <div key={k} style={s.diffRow}>
                <span style={s.diffLbl}>{k}</span>
                <div style={s.diffVals}>
                  <span style={{...s.diffNum, color:'#888'}}>{va}</span>
                  <span style={{color:'#888',fontSize:12}}>→</span>
                  <span style={s.diffNum}>{vb}</span>
                  <span style={{fontSize:12, color: diff>0?'#3B6D11':diff<0?'#A32D2D':'#888'}}>{diff>0?`▲ +${diff}`:diff<0?`▼ ${diff}`:'= 0'}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
          {[a,b].map((item,i) => (
            <div key={i} style={s.diffCard}>
              <div style={{fontSize:11,color:'#888',marginBottom:8}}>Versión {i===0?'A':'B'} · {new Date(item.ts).toLocaleDateString('es-ES')}</div>
              <div style={{fontSize:13,color:'#555',lineHeight:1.5}}>{item.summary}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const s = {
    app: { fontFamily:"'Segoe UI',sans-serif", minHeight:'100vh', background:'#f8f8f7', color:'#1a1a1a' },
    nav: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', background:'#fff', borderBottom:'0.5px solid #e5e5e5', position:'sticky', top:0, zIndex:100 },
    logo: { display:'flex', alignItems:'center', gap:9 },
    logoBox: { width:30, height:30, background:'#1a1a1a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' },
    logoName: { fontSize:17, fontWeight:700, letterSpacing:'-0.5px' },
    navTabs: { display:'flex', gap:2, background:'#f0f0ef', borderRadius:8, padding:3 },
    navTab: { padding:'6px 14px', borderRadius:6, fontSize:13, border:'none', background:'transparent', color:'#666', cursor:'pointer', fontWeight:500 },
    navTabActive: { padding:'6px 14px', borderRadius:6, fontSize:13, border:'0.5px solid #e5e5e5', background:'#fff', color:'#1a1a1a', cursor:'pointer', fontWeight:500 },
    page: { padding:20, maxWidth:860, margin:'0 auto' },
    pageHd: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
    pageTitle: { fontSize:20, fontWeight:700, letterSpacing:'-0.3px' },
    pageSub: { fontSize:13, color:'#888', marginTop:2 },
    panel: { background:'#fff', border:'0.5px solid #e5e5e5', borderRadius:12, overflow:'hidden', marginBottom:16 },
    toolbar: { display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'0.5px solid #e5e5e5', background:'#f8f8f7', flexWrap:'wrap' },
    select: { fontFamily:'monospace', fontSize:12, padding:'4px 8px', borderRadius:6, border:'0.5px solid #ddd', background:'#fff', cursor:'pointer' },
    focusBtn: { fontSize:11, padding:'4px 9px', borderRadius:20, border:'0.5px solid #e5e5e5', background:'transparent', color:'#888', cursor:'pointer', whiteSpace:'nowrap' },
    focusBtnActive: { fontSize:11, padding:'4px 9px', borderRadius:20, border:'0.5px solid #1a1a1a', background:'#1a1a1a', color:'#fff', cursor:'pointer', whiteSpace:'nowrap' },
    textarea: { fontFamily:'monospace', fontSize:13, width:'100%', minHeight:200, padding:14, border:'none', background:'transparent', color:'#1a1a1a', resize:'vertical', outline:'none', lineHeight:1.6 },
    panelFoot: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderTop:'0.5px solid #e5e5e5', background:'#f8f8f7' },
    btnPrimary: { display:'inline-flex', alignItems:'center', gap:7, padding:'8px 18px', background:'#1a1a1a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' },
    btnSec: { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 13px', background:'transparent', color:'#666', border:'0.5px solid #ddd', borderRadius:8, fontSize:13, cursor:'pointer' },
    scoreGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 },
    scoreCard: { background:'#f8f8f7', borderRadius:8, padding:14, textAlign:'center' },
    scoreLbl: { fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:.5, marginBottom:6 },
    finding: { background:'#fff', border:'0.5px solid #e5e5e5', borderRadius:8, padding:14, marginBottom:8 },
    sevPill: { fontSize:10, fontFamily:'monospace', padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', flexShrink:0 },
    summaryBox: { background:'#fff', border:'0.5px solid #e5e5e5', borderRadius:12, padding:16, marginBottom:16 },
    uploadZone: { border:'1.5px dashed #ddd', borderRadius:10, padding:24, textAlign:'center', cursor:'pointer', marginBottom:16, background:'#fff' },
    histItem: { background:'#fff', border:'0.5px solid #e5e5e5', borderRadius:12, padding:16, cursor:'pointer', marginBottom:10 },
    diffCard: { background:'#fff', border:'0.5px solid #e5e5e5', borderRadius:10, padding:14 },
    diffTitle: { fontSize:13, fontWeight:500, marginBottom:12 },
    diffRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
    diffLbl: { fontSize:12, color:'#888' },
    diffVals: { display:'flex', alignItems:'center', gap:8 },
    diffNum: { fontSize:14, fontWeight:500, fontFamily:'monospace' },
    cmpSelect: { width:'100%', padding:'8px 10px', borderRadius:8, border:'0.5px solid #ddd', background:'#fff', fontSize:13, marginBottom:10 },
    err: { padding:'12px 16px', background:'#FCEBEB', borderRadius:8, color:'#A32D2D', fontSize:13, marginBottom:16 },
    loading: { display:'flex', flexDirection:'column', alignItems:'center', padding:'3rem 1rem', gap:14 },
  }

  const sevStyle = sev => ({
    critical: { bg:'#FCEBEB', color:'#A32D2D', border:'#E24B4A' },
    warning:  { bg:'#FAEEDA', color:'#854F0B', border:'#EF9F27' },
    info:     { bg:'#E6F1FB', color:'#185FA5', border:'#378ADD' },
    good:     { bg:'#EAF3DE', color:'#3B6D11', border:'#639922' },
  }[sev] || { bg:'#f5f5f5', color:'#888', border:'#ccc' })

  const scoreColor = n => n>=75?'#3B6D11':n>=50?'#854F0B':'#A32D2D'

  return (
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.logoBox}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3.5h12M2 7h7M2 10.5h9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="13" cy="10.5" r="2.5" stroke="#fff" strokeWidth="1.2"/>
              <path d="M15 12.5L16.5 14" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={s.logoName}>vibe<span style={{color:'#888',fontWeight:400}}>audit</span> <span style={{fontSize:10,fontFamily:'monospace',background:'#EAF3DE',color:'#3B6D11',padding:'2px 6px',borderRadius:10,marginLeft:2}}>pro</span></span>
        </div>
        <div style={s.navTabs}>
          {['audit','history','compare'].map(p => (
            <button key={p} style={page===p?s.navTabActive:s.navTab} onClick={()=>setPage(p)}>
              {p==='audit'?'Auditar':p==='history'?`Historial (${history.length})`:'Comparar'}
            </button>
          ))}
        </div>
      </nav>

      {page === 'audit' && (
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>Auditoría de código</div>
              <div style={s.pageSub}>Analiza tu código vibe-coded con IA</div>
            </div>
          </div>

          {!result && (
            <>
              <div style={s.uploadZone} onClick={()=>fileRef.current.click()}>
                <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>Arrastra un archivo o haz clic para subir</div>
                <div style={{fontSize:12,color:'#aaa',fontFamily:'monospace'}}>.js .ts .py .jsx .tsx .sql — máx 500KB</div>
                {fileName && <div style={{fontSize:12,marginTop:8,color:'#3B6D11'}}>📄 {fileName}</div>}
              </div>
              <input ref={fileRef} type="file" style={{display:'none'}} accept=".js,.ts,.py,.jsx,.tsx,.sql,.go,.rs" onChange={loadFile}/>

              <div style={s.panel}>
                <div style={s.toolbar}>
                  <select style={s.select} value={lang} onChange={e=>setLang(e.target.value)}>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="react">React/JSX</option>
                    <option value="nextjs">Next.js</option>
                    <option value="node">Node.js</option>
                    <option value="sql">SQL</option>
                  </select>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {focusOptions.map(f => (
                      <button key={f} style={focus===f?s.focusBtnActive:s.focusBtn} onClick={()=>setFocus(f)}>{f}</button>
                    ))}
                  </div>
                </div>
                <textarea style={s.textarea} value={code} onChange={e=>setCode(e.target.value)} placeholder="// Pega tu código aquí o sube un archivo..."/>
                <div style={s.panelFoot}>
                  <span style={{fontSize:12,color:'#aaa',fontFamily:'monospace'}}>{code.length} caracteres</span>
                  <button style={{...s.btnPrimary, opacity: loading||code.length<10?0.4:1}} onClick={runAudit} disabled={loading||code.length<10}>
                    {loading ? loadMsg : 'Auditar código'}
                  </button>
                </div>
              </div>
              {error && <div style={s.err}>{error}</div>}
            </>
          )}

          {loading && (
            <div style={s.loading}>
              <div style={{width:26,height:26,border:'2px solid #e5e5e5',borderTopColor:'#1a1a1a',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              <span style={{fontSize:13,color:'#888',fontFamily:'monospace'}}>{loadMsg}</span>
            </div>
          )}

          {result && !loading && (
            <>
              <div style={s.scoreGrid}>
                {Object.entries(result.scores||{}).map(([k,v])=>(
                  <div key={k} style={s.scoreCard}>
                    <div style={s.scoreLbl}>{k}</div>
                    <div style={{fontSize:26,fontWeight:700,color:scoreColor(v)}}>{Math.round(v)}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:500,color:'#888',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Hallazgos</div>
              {(result.findings||[]).map((f,i)=>{
                const sv = sevStyle(f.severity)
                return (
                  <div key={i} style={{...s.finding, borderLeft:`3px solid ${sv.border}`}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:6}}>
                      <span style={{...s.sevPill,background:sv.bg,color:sv.color}}>{f.severity.toUpperCase()}</span>
                      <span style={{fontSize:14,fontWeight:500}}>{f.title}</span>
                    </div>
                    <div style={{fontSize:13,color:'#555',lineHeight:1.5}}>{f.description}</div>
                    {f.fix && <pre style={{fontFamily:'monospace',fontSize:12,background:'#f8f8f7',borderRadius:4,padding:'8px 10px',marginTop:8,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{f.fix}</pre>}
                  </div>
                )
              })}
              <div style={s.summaryBox}>
                <div style={{fontSize:11,fontWeight:500,color:'#888',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>Resumen ejecutivo</div>
                <div style={{fontSize:14,lineHeight:1.6}}>{result.summary}</div>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button style={s.btnSec} onClick={exportPDF}>Exportar PDF</button>
                <button style={s.btnSec} onClick={resetAudit}>Nueva auditoría</button>
              </div>
            </>
          )}
        </div>
      )}

      {page === 'history' && (
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>Historial</div>
              <div style={s.pageSub}>Todas tus auditorías anteriores</div>
            </div>
            {history.length > 0 && <button style={s.btnSec} onClick={clearHistory}>Borrar todo</button>}
          </div>
          {history.length === 0 ? (
            <div style={{textAlign:'center',padding:'3rem',color:'#aaa',fontSize:14}}>Aún no has realizado ninguna auditoría.</div>
          ) : (
            history.map(item => (
              <div key={item.id} style={s.histItem} onClick={()=>{setResult(item);setPage('audit')}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:500}}>{item.lang} · {item.focus}</span>
                    <div style={{fontSize:11,color:'#aaa',fontFamily:'monospace',marginTop:2}}>{new Date(item.ts).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</div>
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {Object.entries(item.scores||{}).map(([k,v])=>(
                      <span key={k} style={{fontSize:11,padding:'2px 8px',borderRadius:10,fontFamily:'monospace',background:v>=75?'#EAF3DE':v>=50?'#FAEEDA':'#FCEBEB',color:v>=75?'#3B6D11':v>=50?'#854F0B':'#A32D2D'}}>{k.substring(0,3)} {Math.round(v)}</span>
                    ))}
                  </div>
                </div>
                <div style={{fontFamily:'monospace',fontSize:11,color:'#aaa',background:'#f8f8f7',borderRadius:6,padding:'6px 8px',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.code}</div>
              </div>
            ))
          )}
        </div>
      )}

      {page === 'compare' && (
        <div style={s.page}>
          <div style={s.pageHd}>
            <div>
              <div style={s.pageTitle}>Comparar</div>
              <div style={s.pageSub}>Mide la evolución antes y después</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            {[['A','cmpA',setCmpA],['B','cmpB',setCmpB]].map(([label,key,setter])=>(
              <div key={label}>
                <div style={{fontSize:13,fontWeight:500,color:'#888',marginBottom:8}}>Versión {label}</div>
                <select style={s.cmpSelect} onChange={e=>setter(e.target.value)}>
                  <option value="">— Selecciona auditoría —</option>
                  {history.map(item=>(
                    <option key={item.id} value={item.id}>
                      {new Date(item.ts).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} · {item.lang} · avg {Math.round(Object.values(item.scores||{}).reduce((a,b)=>a+b,0)/4)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {renderCompare() || <div style={{textAlign:'center',padding:'2rem',color:'#aaa',fontSize:13,background:'#f8f8f7',borderRadius:8}}>Selecciona dos auditorías para comparar.</div>}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}