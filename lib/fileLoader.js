import { sanitizeCode, shouldExcludeFile, shouldExcludeFolder, EXCLUDED_FOLDERS } from './sanitize'

// Procesa múltiples archivos y los combina en un solo texto para auditar
export async function processFiles(files) {
  const results = []
  const skipped = []

  for (const file of files) {
    const path = file.webkitRelativePath || file.name

    // Verificar si la carpeta está excluida
    if (shouldExcludeFolder(path)) {
      skipped.push({ name: path, reason: 'carpeta excluida' })
      continue
    }

    // Verificar si el archivo está excluido
    const { exclude, reason } = shouldExcludeFile(path)
    if (exclude) {
      skipped.push({ name: path, reason })
      continue
    }

    // Leer el contenido
    try {
      const content = await readFileAsText(file)
      const { sanitized, removedCount } = sanitizeCode(content)
      results.push({
        path,
        content: sanitized,
        size: file.size,
        redacted: removedCount
      })
    } catch {
      skipped.push({ name: path, reason: 'error al leer' })
    }
  }

  // Combinar todos los archivos en un solo texto
  const combined = results
    .map(f => `// ===== ${f.path} =====\n${f.content}`)
    .join('\n\n')

  const totalRedacted = results.reduce((sum, f) => sum + f.redacted, 0)

  return {
    combined,
    fileCount: results.length,
    skippedCount: skipped.length,
    skipped,
    totalRedacted,
    files: results
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Error leyendo archivo'))
    reader.readAsText(file)
  })
}

// Descarga un repositorio de GitHub via API pública
export async function loadFromGitHub(url) {
  // Extraer usuario y repo de la URL
  const match = url.match(/github\.com\/([^/]+)\/([^/\s]+)/)
  if (!match) throw new Error('URL de GitHub no válida')

  const [, owner, repo] = match
  const cleanRepo = repo.replace('.git', '')

  // Obtener el árbol de archivos
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/HEAD?recursive=1`
  )

  if (!treeRes.ok) {
    if (treeRes.status === 404) throw new Error('Repositorio no encontrado o es privado')
    throw new Error('Error al acceder al repositorio')
  }

  const tree = await treeRes.json()

  // Filtrar solo archivos de código relevantes
  const codeFiles = tree.tree.filter(item => {
    if (item.type !== 'blob') return false
    if (shouldExcludeFolder(item.path)) return false
    const { exclude } = shouldExcludeFile(item.path)
    if (exclude) return false
    // Limitar tamaño
    if (item.size > 100000) return false
    return true
  }).slice(0, 30) // máximo 30 archivos

  if (codeFiles.length === 0) throw new Error('No se encontraron archivos de código en el repositorio')

  // Descargar contenido de cada archivo
  const results = []
  const skipped = []

  for (const file of codeFiles) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/${owner}/${cleanRepo}/HEAD/${file.path}`
      )
      if (!res.ok) { skipped.push(file.path); continue }
      const content = await res.text()
      const { sanitized, removedCount } = sanitizeCode(content)
      results.push({ path: file.path, content: sanitized, redacted: removedCount })
    } catch {
      skipped.push(file.path)
    }
  }

  const combined = results
    .map(f => `// ===== ${f.path} =====\n${f.content}`)
    .join('\n\n')

  const totalRedacted = results.reduce((sum, f) => sum + f.redacted, 0)

  return {
    combined,
    fileCount: results.length,
    skippedCount: skipped.length,
    totalRedacted,
    repoName: `${owner}/${cleanRepo}`,
    files: results
  }
}