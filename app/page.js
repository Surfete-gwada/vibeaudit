'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Landing() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  const features = [
    { icon: '🔒', title: 'Security first', desc: 'Detects SQL injection, exposed keys, weak auth and OWASP vulnerabilities.' },
    { icon: '⚡', title: 'Performance', desc: 'Finds N+1 queries, memory leaks and sync blocking before they hit production.' },
    { icon: '📈', title: 'Scalability', desc: 'Identifies bottlenecks, in-memory state and concurrency issues.' },
    { icon: '🏗️', title: 'Architecture', desc: 'Evaluates separation of concerns, design patterns and technical debt.' },
    { icon: '🐙', title: 'GitHub native', desc: 'Paste your repo URL and we audit the entire project automatically.' },
    { icon: '🛡️', title: '100% private', desc: 'Your API keys and sensitive data are stripped before any analysis.' },
  ]

  return (
    <main style={{
      fontFamily: "'Segoe UI', sans-serif",
      background: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff',
      overflowX: 'hidden'
    }}>
      {/* NAV */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '0.5px solid #222'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: '#fff',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3.5h12M2 7h7M2 10.5h9" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="13" cy="10.5" r="2.5" stroke="#0a0a0a" strokeWidth="1.2"/>
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px' }}>
            vibe<span style={{ color: '#666', fontWeight: 400 }}>audit</span>
          </span>
        </div>
        <button
          onClick={() => router.push('/audit')}
          style={{
            padding: '8px 18px',
            background: '#fff',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer'
          }}>
          Sign in
        </button>
      </nav>

      {/* HERO */}
      <section style={{
        textAlign: 'center',
        padding: '100px 20px 80px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease'
      }}>
        <div style={{
          display: 'inline-block',
          background: '#111',
          border: '0.5px solid #333',
          borderRadius: 20,
          padding: '6px 14px',
          fontSize: 12,
          color: '#888',
          marginBottom: 24,
          fontFamily: 'monospace'
        }}>
          ✦ AI-powered code auditing for vibe-coders
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)',
          fontWeight: 800,
          letterSpacing: '-2px',
          lineHeight: 1.1,
          marginBottom: 24,
          color: '#fff'
        }}>
          Your app deserves<br/> a real audit
        </h1>

        <p style={{
          fontSize: 18,
          color: '#888',
          maxWidth: 520,
          margin: '0 auto 40px',
          lineHeight: 1.6
        }}>
          Catch security vulnerabilities, performance issues and technical debt in AI-generated code before it ships to production.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/audit')}
            style={{
              padding: '14px 32px',
              background: '#fff',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s'
            }}
            onMouseEnter={e => e.target.style.opacity = '.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Start your audit →
          </button>
          <button
            onClick={() => router.push('/how-it-works')}
            style={{
              padding: '14px 32px',
              background: 'transparent',
              color: '#fff',
              border: '0.5px solid #333',
              borderRadius: 10,
              fontSize: 16,
              cursor: 'pointer'
            }}>
            See how it works
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 900, margin: '0 auto 100px', padding: '0 20px' }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '-1px',
          marginBottom: 48,
          color: '#fff'
        }}>
          Everything your code needs
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: '#111',
              border: '0.5px solid #222',
              borderRadius: 12,
              padding: 24,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.5s ease ${0.1 * i}s, transform 0.5s ease ${0.1 * i}s`
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px 100px',
        borderTop: '0.5px solid #222'
      }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '-1px',
          marginBottom: 16
        }}>
          Start for free today
        </h2>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 32 }}>
          3 free audits. No credit card required.
        </p>
        <button
          onClick={() => router.push('/audit')}
          style={{
            padding: '14px 40px',
            background: '#fff',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer'
          }}>
          Start your audit →
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '0.5px solid #111',
        color: '#444',
        fontSize: 12,
        fontFamily: 'monospace'
      }}>
        vibeaudit © 2026 · built with AI, audited with AI
      </footer>
    </main>
  )
}