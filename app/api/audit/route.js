import { supabaseAdmin } from '../../../lib/supabase'

async function checkAndUpdateUsage(userId) {
  // Buscar o crear registro de uso
  const { data, error } = await supabaseAdmin
    .from('usage')
    .select('audit_count, is_pro')
    .eq('user_id', userId)
    .single()

  // Si no existe, crear uno nuevo
  if (error || !data) {
    await supabaseAdmin.from('usage').insert({ user_id: userId, audit_count: 1 })
    return { allowed: true, count: 1, isPro: false }
  }

  // Si es pro, permitir siempre
  if (data.is_pro) {
    await supabaseAdmin.from('usage').update({
      audit_count: data.audit_count + 1,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId)
    return { allowed: true, count: data.audit_count + 1, isPro: true }
  }

  // Si es free, comprobar límite
  if (data.audit_count >= 3) {
    return { allowed: false, count: data.audit_count, isPro: false }
  }

  // Incrementar contador
  await supabaseAdmin.from('usage').update({
    audit_count: data.audit_count + 1,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId)

  return { allowed: true, count: data.audit_count + 1, isPro: false }
}


const CHUNK_SIZE = 12000 // caracteres por lote

function chunkCode(combinedCode) {
  const files = combinedCode.split(/\n(?=\/\/ ===== )/)
  const chunks = []
  let current = ''

  for (const file of files) {
    if ((current + file).length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim())
      current = file
    } else {
      current += '\n' + file
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

async function auditChunk(code, lang, focus, chunkIndex, totalChunks) {
  const focusMap = {
    completo: 'seguridad, rendimiento, escalabilidad, arquitectura, buenas prácticas y calidad de código',
    seguridad: 'exclusivamente seguridad: vulnerabilidades, secretos expuestos, inyecciones, autenticación, OWASP top 10',
    rendimiento: 'exclusivamente rendimiento: N+1 queries, memory leaks, bloqueos síncronos, ineficiencias',
    escalabilidad: 'exclusivamente escalabilidad: bottlenecks, estado en memoria, acoplamiento, caché, concurrencia',
    arquitectura: 'exclusivamente arquitectura: separación de responsabilidades, patrones, deuda técnica, mantenibilidad'
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `Eres un auditor experto de código para startups y SaaS. Analizas código generado por IA buscando problemas críticos.
Estás auditando el lote ${chunkIndex + 1} de ${totalChunks} de un proyecto completo.
Responde ÚNICAMENTE en JSON válido con esta estructura:
{"scores":{"seguridad":<0-100>,"rendimiento":<0-100>,"escalabilidad":<0-100>,"calidad":<0-100>},"findings":[{"severity":"critical|warning|info|good","title":"<título>","description":"<descripción>","fix":"<fix opcional>","file":"<archivo donde se encontró>"}],"summary":"<resumen 2-3 frases de este lote>"}
Solo JSON puro, sin markdown.`,
      messages: [{
        role: 'user',
        content: `Lenguaje: ${lang}\nEnfoque: ${focusMap[focus] || focusMap.completo}\n\nCódigo (lote ${chunkIndex + 1}/${totalChunks}):\n${code}`
      }]
    })
  })

  const data = await response.json()
  if (!data.content) throw new Error('Error en API de Anthropic')
  const text = data.content.map(b => b.text || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

function mergeResults(results) {
  // Promediar scores
  const scoreKeys = ['seguridad', 'rendimiento', 'escalabilidad', 'calidad']
  const scores = {}
  for (const key of scoreKeys) {
    const values = results.map(r => r.scores?.[key] || 0)
    scores[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  // Combinar findings eliminando duplicados por título
  const allFindings = results.flatMap(r => r.findings || [])
  const uniqueFindings = []
  const seenTitles = new Set()
  for (const f of allFindings) {
    if (!seenTitles.has(f.title)) {
      seenTitles.add(f.title)
      uniqueFindings.push(f)
    }
  }

  // Ordenar por severidad
  const order = { critical: 0, warning: 1, info: 2, good: 3 }
  uniqueFindings.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2))

  // Resumen combinado
  const summary = results.length === 1
    ? results[0].summary
    : `Análisis de ${results.length} lotes completado. ${results.map(r => r.summary).join(' ')}`

  return { scores, findings: uniqueFindings.slice(0, 15), summary }
}

export async function POST(request) {
  const { code, lang, focus, userId } = await request.json()

  if (!code || code.trim().length < 10) {
    return Response.json({ error: 'Código demasiado corto' }, { status: 400 })
  }

  try {
    // Comprobar límite de uso
    if (userId) {
      const usage = await checkAndUpdateUsage(userId)
      if (!usage.allowed) {
        return Response.json({ error: 'LIMIT_REACHED', count: usage.count }, { status: 403 })
      }
    }
    
    const chunks = chunkCode(code)
    const chunkResults = []

    for (let i = 0; i < chunks.length; i++) {
      const result = await auditChunk(chunks[i], lang, focus, i, chunks.length)
      chunkResults.push(result)
    }

    const merged = mergeResults(chunkResults)
    merged.chunks = chunks.length

    // Guardar en Supabase si hay usuario logueado
    if (userId) {
      const { error: dbError } = await supabaseAdmin.from('audits').insert({
        user_id: userId,
        lang,
        focus,
        scores: merged.scores,
        findings: merged.findings,
        summary: merged.summary,
        code_snippet: code.substring(0, 300)
      })
      if (dbError) console.log('Error Supabase:', dbError)
    }

    return Response.json(merged)
  } catch (err) {
    console.error('Error auditoría:', err)
    return Response.json({ error: 'Error al procesar la auditoría' }, { status: 500 })
  }
}