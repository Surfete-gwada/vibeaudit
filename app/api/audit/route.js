import { supabaseAdmin } from '../../../lib/supabase'

export async function POST(request) {
  const { code, lang, focus, userId } = await request.json()

  if (!code || code.trim().length < 10) {
    return Response.json({ error: 'Código demasiado corto' }, { status: 400 })
  }

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
      max_tokens: 1500,
      system: `Eres un auditor experto de código para startups y SaaS. Analizas código generado por IA buscando problemas críticos.
Responde ÚNICAMENTE en JSON válido con esta estructura:
{"scores":{"seguridad":<0-100>,"rendimiento":<0-100>,"escalabilidad":<0-100>,"calidad":<0-100>},"findings":[{"severity":"critical|warning|info|good","title":"<título>","description":"<descripción>","fix":"<fix opcional>"}],"summary":"<resumen 2-3 frases>"}
Solo JSON puro, sin markdown.`,
      messages: [{
        role: 'user',
        content: `Lenguaje: ${lang}\nEnfoque: ${focusMap[focus] || focusMap.completo}\n\nCódigo:\n\`\`\`${lang}\n${code.substring(0, 6000)}\n\`\`\``
      }]
    })
  })

  const data = await response.json()
  const text = data.content.map(b => b.text || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  const result = JSON.parse(clean)

  // Guardar en Supabase si hay usuario logueado
  console.log('userId recibido:', userId)
if (userId) {
    const { error: dbError } = await supabaseAdmin.from('audits').insert({
      user_id: userId,
      lang,
      focus,
      scores: result.scores,
      findings: result.findings,
      summary: result.summary,
      code_snippet: code.substring(0, 300)
    })
    console.log('Error Supabase:', dbError)
  }
  

  return Response.json(result)
}