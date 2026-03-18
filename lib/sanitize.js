// Patrones de información sensible que nunca deben enviarse a la IA
const SENSITIVE_PATTERNS = [
  // API Keys genéricas
  { pattern: /(['"`]?api[_-]?key['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'API_KEY' },
  { pattern: /(['"`]?api[_-]?secret['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'API_SECRET' },
  
  // Tokens
  { pattern: /(['"`]?token['"`]?\s*[:=]\s*)(['"`])[^\2]{8,}\2/gi, label: 'TOKEN' },
  { pattern: /(['"`]?auth[_-]?token['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'AUTH_TOKEN' },
  { pattern: /(['"`]?access[_-]?token['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'ACCESS_TOKEN' },
  { pattern: /(['"`]?secret[_-]?key['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'SECRET_KEY' },
  
  // Passwords
  { pattern: /(['"`]?password['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'PASSWORD' },
  { pattern: /(['"`]?passwd['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'PASSWORD' },
  { pattern: /(['"`]?pwd['"`]?\s*[:=]\s*)(['"`])[^\2]+?\2/gi, label: 'PASSWORD' },

  // Claves de servicios conocidos
  { pattern: /sk-ant-[a-zA-Z0-9\-_]{20,}/g, label: 'ANTHROPIC_KEY' },
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, label: 'OPENAI_KEY' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, label: 'GITHUB_TOKEN' },
  { pattern: /gho_[a-zA-Z0-9]{36}/g, label: 'GITHUB_TOKEN' },
  { pattern: /pk_(live|test)_[a-zA-Z0-9]{20,}/g, label: 'STRIPE_KEY' },
  { pattern: /sk_(live|test)_[a-zA-Z0-9]{20,}/g, label: 'STRIPE_SECRET' },
  { pattern: /AKIA[0-9A-Z]{16}/g, label: 'AWS_KEY' },
  { pattern: /eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, label: 'JWT_TOKEN' },

  // Variables de entorno con valores
  { pattern: /process\.env\.[A-Z_]+=\s*['"`][^'"`]+['"`]/g, label: 'ENV_VALUE' },

  // Cadenas que parecen secrets (32+ caracteres alfanuméricos)
  { pattern: /(['"`])[a-zA-Z0-9+/]{32,}={0,2}\1/g, label: 'POTENTIAL_SECRET' },

  // URLs con credenciales
  { pattern: /https?:\/\/[^:]+:[^@]+@[^\s'"]+/g, label: 'URL_WITH_CREDENTIALS' },

  // Connection strings de bases de datos
  { pattern: /mongodb(\+srv)?:\/\/[^\s'"]+/g, label: 'MONGODB_URI' },
  { pattern: /postgres(ql)?:\/\/[^\s'"]+/g, label: 'POSTGRES_URI' },
  { pattern: /mysql:\/\/[^\s'"]+/g, label: 'MYSQL_URI' },
]

// Archivos que deben excluirse completamente
export const EXCLUDED_FILES = [
  '.env', '.env.local', '.env.production', '.env.development',
  '.env.staging', '.env.test', '.env.example',
  'secrets.json', 'credentials.json', 'service-account.json',
  'private-key.pem', 'private.key', 'id_rsa', 'id_ed25519',
  '.npmrc', '.netrc', 'auth.json'
]

// Extensiones de archivos que no son código y deben ignorarse
export const EXCLUDED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.mp4', '.mp3', '.wav', '.pdf', '.zip', '.tar', '.gz',
  '.lock', '.log', '.map', '.min.js', '.min.css',
  '.ttf', '.woff', '.woff2', '.eot'
]

// Carpetas que deben excluirse
export const EXCLUDED_FOLDERS = [
  'node_modules', '.git', '.next', '.nuxt', 'dist', 'build',
  'coverage', '.cache', 'vendor', '__pycache__', '.venv',
  'venv', 'env', '.idea', '.vscode'
]

export function sanitizeCode(code) {
  let sanitized = code
  let removedCount = 0

  for (const { pattern, label } of SENSITIVE_PATTERNS) {
    const matches = sanitized.match(pattern)
    if (matches) {
      removedCount += matches.length
      sanitized = sanitized.replace(pattern, `[REDACTED:${label}]`)
    }
  }

  return { sanitized, removedCount }
}

export function shouldExcludeFile(filename) {
  const name = filename.toLowerCase().split('/').pop()
  const ext = '.' + name.split('.').pop()

  if (EXCLUDED_FILES.includes(name)) return { exclude: true, reason: 'archivo sensible' }
  if (EXCLUDED_EXTENSIONS.includes(ext)) return { exclude: true, reason: 'tipo de archivo no analizable' }

  return { exclude: false }
}

export function shouldExcludeFolder(folderPath) {
  const parts = folderPath.split('/')
  for (const part of parts) {
    if (EXCLUDED_FOLDERS.includes(part)) return true
  }
  return false
}