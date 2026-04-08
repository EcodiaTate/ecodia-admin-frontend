import { Download } from 'lucide-react'

/**
 * Resolves download:// protocol URLs to real API URLs,
 * and renders them as styled download buttons.
 * Regular links pass through as normal <a> tags.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '')

function resolveDownloadUrl(href: string): string {
  // download:///api/files/foo.pdf → https://api.admin.ecodia.au/api/files/foo.pdf
  const path = href.replace(/^download:\/\//, '')
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path}`
}

function filenameFromUrl(href: string): string {
  const path = href.replace(/^download:\/\//, '')
  return path.split('/').pop() || 'download'
}

export function MarkdownLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) return <a {...props}>{children}</a>

  // Handle download:// protocol
  if (href.startsWith('download://')) {
    const realUrl = resolveDownloadUrl(href)
    const filename = filenameFromUrl(href)

    return (
      <a
        href={realUrl}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 no-underline transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, rgba(27,122,61,0.08), rgba(46,204,113,0.04))',
          border: '1px solid rgba(27,122,61,0.15)',
          boxShadow: '0 4px 16px -4px rgba(27,122,61,0.10), inset 0 1px 0 rgba(255,255,255,0.3)',
        }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #1B7A3D20, #1B7A3D08)',
            boxShadow: '0 0 12px rgba(27,122,61,0.15)',
          }}
        >
          <Download className="h-3 w-3" style={{ color: '#1B7A3D' }} strokeWidth={1.75} />
        </div>
        <span className="text-sm font-medium" style={{ color: '#1B7A3D' }}>
          {filename}
        </span>
      </a>
    )
  }

  // Regular links — open in new tab
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  )
}
