import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#1B7A3D',
    primaryTextColor: '#fff',
    primaryBorderColor: '#519145',
    lineColor: '#8ab192',
    secondaryColor: '#f4d35e',
    tertiaryColor: '#f1fbee',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
  },
})

let counter = 0

export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const id = `mermaid-${++counter}`
    mermaid.render(id, code.trim())
      .then(({ svg }) => setSvg(svg))
      .catch((err) => setError(err.message || 'Failed to render diagram'))
  }, [code])

  if (error) {
    return (
      <pre style={{
        fontSize: '0.75rem',
        color: 'rgba(180,80,80,0.7)',
        padding: '0.75rem',
        background: 'rgba(180,80,80,0.05)',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
      }}>
        {error}
      </pre>
    )
  }

  return (
    <div
      ref={ref}
      className="mermaid-container"
      style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(27,122,61,0.08)',
        overflow: 'auto',
        margin: '0.5rem 0',
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
