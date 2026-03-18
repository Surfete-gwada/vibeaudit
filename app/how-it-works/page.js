'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HowItWorks() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  const benefits = [
    {
      title: 'AI-coded apps ship fast — but break faster',
      desc: 'AI-generated code is optimized for speed, not security. Without a review layer, SQL injections, exposed secrets and broken auth go straight to production.'
    },
    {
      title: 'Technical debt compounds silently',
      desc: 'What starts as a quick prototype becomes unmaintainable in weeks. VibeAudit catches architectural issues before they become rewrites.'
    },
    {
      title: 'Investors and teams need proof, not promises',
      desc: 'A clean audit report signals engineering maturity. Show stakeholders you take code quality seriously — even if you moved fast to build it.'
    },
    {
      title: 'Security breaches kill early-stage startups',
      desc: 'A single data leak at the wrong moment can end a company. VibeAudit flags OWASP vulnerabilities, weak auth and exposed credentials before attackers do.'
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Upload your code',
      desc: 'Paste code directly, upload files, drop an entire project folder or paste a GitHub repository URL. VibeAudit automatically excludes sensitive files like .env, node_modules and private keys.',
      tag: 'Input',
      disclaimer: 'Your code is never stored. It is transmitted securely to our engine for analysis and permanently discarded once the audit is complete. Only your audit results and scores are saved to your account.'
    },
    {
      number: '02',
      title: 'Choose your focus',
      desc: 'Run a full audit or focus on a specific area: Security, Performance, Scalability or Architecture. VibeAudit adapts the analysis to what matters most to you right now.',
      tag: 'Configure'
    },
    {
      number: '03',
      title: 'AI analyzes your codebase',
      desc: 'Our AI engine processes your code in batches, auditing each file in context. Large projects are analyzed in parallel and results are merged into a single unified report.',
      tag: 'Analyze'
    },
    {
      number: '04',
      title: 'Get your audit report',
      desc: 'Receive a structured report with severity scores (Critical, Warning, Info), actionable fixes for each finding, and an executive summary ready to share.',
      tag: 'Report'
    },
    {
      number: '05',
      title: 'Share with your team or investors',
      desc: 'Export a clean PDF report with scores, findings and recommendations. Show technical teams what needs fixing. Show investors and stakeholders that your codebase is production-ready.',
      tag: 'Share'
    },
  ]

  const reportBenefits = [
    {
      icon: '📊',
      title: 'For technical teams',
      desc: 'Prioritized findings with severity levels, exact file references and copy-paste fixes. Your dev team knows exactly what to fix and in what order.'
    },
    {
      icon: '💼',
      title: 'For investors',
      desc: 'An executive summary with quality scores across Security, Performance, Scalability and Architecture. One page that proves your engineering is solid.'
    },
    {
      icon: '🚀',
      title: 'For founders',
      desc: 'Understand your technical risk before a fundraise, acquisition or public launch. Know what you\'re shipping before your users do.'
    },
    {
      icon: '🔍',
      title: 'For due diligence',
      desc: 'Structured, timestamped audit reports that hold up under technical scrutiny. The kind of documentation that builds trust in M&A and investment processes.'
    },
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => router.push('/')}>
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
          Start your audit →
        </button>
      </nav>

      {/* HERO */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px 60px',
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
          ✦ Why audit vibe-coded apps
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 60px)',
          fontWeight: 800,
          letterSpacing: '-2px',
          lineHeight: 1.1,
          marginBottom: 20,
          color: '#fff'
        }}>
          Ship fast.<br/>Ship safe.
        </h1>
        <p style={{
          fontSize: 18,
          color: '#888',
          maxWidth: 480,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          The case for auditing every vibe-coded project before it goes live.
        </p>
      </section>

      {/* BENEFITS */}
      <section style={{ maxWidth: 800, margin: '0 auto 100px', padding: '0 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{
              padding: '28px 32px',
              background: '#111',
              border: '0.5px solid #1a1a1a',
              borderRadius: 12,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `opacity 0.5s ease ${0.1 * i}s, transform 0.5s ease ${0.1 * i}s`
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#fff' }}>{b.title}</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 800, margin: '0 auto 100px', padding: '0 20px' }}>
        <h2 style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: '-1px',
          marginBottom: 48,
          color: '#fff',
          textAlign: 'center'
        }}>
          How it works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 24,
              padding: '24px 28px',
              background: '#111',
              border: '0.5px solid #1a1a1a',
              borderRadius: 12,
              alignItems: 'flex-start'
            }}>
              <div style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#444',
                fontWeight: 600,
                minWidth: 28,
                paddingTop: 2
              }}>
                {step.number}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{step.title}</span>
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'monospace',
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#1a1a1a',
                    color: '#555',
                    border: '0.5px solid #2a2a2a'
                  }}>{step.tag}</span>
                </div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{step.desc}</div>
                {step.disclaimer && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginTop: 12,
                    padding: '10px 14px',
                    background: '#000000ff',
                    border: '0.5px solid #350741ff',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#ffffffff',
                    lineHeight: 1.6
                  }}>
                    <span style={{flexShrink:0}}>🔒</span>
                    <span>{step.disclaimer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REPORTING */}
      <section style={{
        maxWidth: 900,
        margin: '0 auto 100px',
        padding: '0 20px'
      }}>
        <div style={{
          background: '#111',
          border: '0.5px solid #222',
          borderRadius: 20,
          padding: '48px 40px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            background: '#0a0a0a',
            border: '0.5px solid #333',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            color: '#888',
            marginBottom: 20,
            fontFamily: 'monospace'
          }}>
            ✦ Audit reports that speak to everyone
          </div>
          <h2 style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '-1px',
            marginBottom: 16,
            color: '#fff'
          }}>
            One report.<br/>Every audience.
          </h2>
          <p style={{
            fontSize: 15,
            color: '#666',
            maxWidth: 500,
            margin: '0 auto 48px',
            lineHeight: 1.7
          }}>
            VibeAudit generates structured PDF reports that communicate clearly to technical teams, investors and founders alike.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            textAlign: 'left'
          }}>
            {reportBenefits.map((r, i) => (
              <div key={i} style={{
                background: '#0a0a0a',
                border: '0.5px solid #1a1a1a',
                borderRadius: 12,
                padding: 20
              }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{r.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#fff' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
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
          Ready to audit your code?
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