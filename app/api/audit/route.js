import { supabaseAdmin } from '../../../lib/supabase'

async function checkAndUpdateUsage(userId) {
  const { data, error } = await supabaseAdmin
    .from('usage')
    .select('audit_count, is_pro')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    await supabaseAdmin.from('usage').insert({ user_id: userId, audit_count: 1 })
    return { allowed: true, count: 1, isPro: false }
  }

  if (data.is_pro) {
    await supabaseAdmin.from('usage').update({
      audit_count: data.audit_count + 1,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId)
    return { allowed: true, count: data.audit_count + 1, isPro: true }
  }

  if (data.audit_count >= 3) {
    return { allowed: false, count: data.audit_count, isPro: false }
  }

  await supabaseAdmin.from('usage').update({
    audit_count: data.audit_count + 1,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId)

  return { allowed: true, count: data.audit_count + 1, isPro: false }
}

const CHUNK_SIZE = 12000

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

async function auditChunk(code, focus, chunkIndex, totalChunks) {
  const focusMap = {
    full: 'security, performance, scalability, architecture, best practices and code quality',
    security: 'security only: vulnerabilities, exposed secrets, injections, authentication, OWASP top 10',
    performance: 'performance only: N+1 queries, memory leaks, sync blocking, inefficiencies',
    scalability: 'scalability only: bottlenecks, in-memory state, coupling, cache, concurrency',
    architecture: 'architecture only: separation of concerns, design patterns, technical debt, maintainability'
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
      system: `You are an expert code auditor for startups and SaaS products. You analyze AI-generated (vibe-coded) code looking for critical issues.
You are auditing batch ${chunkIndex + 1} of ${totalChunks} of a complete project.
Respond ONLY in valid JSON with this exact structure:
{"scores":{"security":<0-100>,"performance":<0-100>,"scalability":<0-100>,"quality":<0-100>},"findings":[{"severity":"critical|warning|info|good","title":"<title>","description":"<description>","fix":"<optional fix>","file":"<file where found>"}],"summary":"<executive summary 2-3 sentences>"}
Pure JSON only, no markdown. Always respond in English.`,
      messages: [{
        role: 'user',
        content: `Focus: ${focusMap[focus] || focusMap.full}\n\nCode (batch ${chunkIndex + 1}/${totalChunks}):\n${code}`
      }]
    })
  })

  const data = await response.json()
  if (!data.content) throw new Error('Anthropic API error')
  const text = data.content.map(b => b.text || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

function mergeResults(results) {
  const scoreKeys = ['security', 'performance', 'scalability', 'quality']
  const scores = {}
  for (const key of scoreKeys) {
    const values = results.map(r => r.scores?.[key] || 0)
    scores[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  const allFindings = results.flatMap(r => r.findings || [])
  const uniqueFindings = []
  const seenTitles = new Set()
  for (const f of allFindings) {
    if (!seenTitles.has(f.title)) {
      seenTitles.add(f.title)
      uniqueFindings.push(f)
    }
  }

  const order = { critical: 0, warning: 1, info: 2, good: 3 }
  uniqueFindings.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2))

  const summary = results.length === 1
    ? results[0].summary
    : `Analysis of ${results.length} batches completed. ${results.map(r => r.summary).join(' ')}`

  return { scores, findings: uniqueFindings.slice(0, 15), summary }
}

export async function POST(request) {
  const { code, focus, userId } = await request.json()

  if (!code || code.trim().length < 10) {
    return Response.json({ error: 'Code too short' }, { status: 400 })
  }

  try {
    if (userId) {
      const usage = await checkAndUpdateUsage(userId)
      if (!usage.allowed) {
        return Response.json({ error: 'LIMIT_REACHED', count: usage.count }, { status: 403 })
      }
    }

    const chunks = chunkCode(code)
    const chunkResults = []

    for (let i = 0; i < chunks.length; i++) {
      const result = await auditChunk(chunks[i], focus, i, chunks.length)
      chunkResults.push(result)
    }

    const merged = mergeResults(chunkResults)
    merged.chunks = chunks.length

    if (userId) {
      const { error: dbError } = await supabaseAdmin.from('audits').insert({
        user_id: userId,
        focus,
        scores: merged.scores,
        findings: merged.findings,
        summary: merged.summary,
        code_snippet: code.substring(0, 300)
      })
      if (dbError) console.log('Supabase error:', dbError)
    }

    return Response.json(merged)
  } catch (err) {
    console.error('Audit error:', err)
    return Response.json({ error: 'Error processing audit' }, { status: 500 })
  }
}