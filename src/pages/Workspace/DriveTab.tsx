import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDriveStats, searchDrive } from '@/api/drive'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import type { DriveFile } from '@/types/workspace'
import { formatRelative } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Search, FileText, Sheet, FileImage, ExternalLink } from 'lucide-react'

export function DriveTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<DriveFile[]>([])

  const { data: stats } = useQuery({ queryKey: ['driveStats'], queryFn: getDriveStats, staleTime: 30000 })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await searchDrive(searchQuery)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const mimeIcon = (mime: string) => {
    if (mime.includes('document') || mime.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />
    if (mime.includes('spreadsheet') || mime.includes('sheet') || mime.includes('csv')) return <Sheet className="h-4 w-4 text-green-500" />
    if (mime.includes('pdf')) return <FileImage className="h-4 w-4 text-red-400" />
    return <FileText className="h-4 w-4 text-on-surface-muted" />
  }

  return (
    <div>
      {stats && (
        <div className="mb-10 flex flex-wrap items-start gap-4 sm:gap-6">
          <WhisperStat label="Total Files" value={stats.total_files.toLocaleString()} />
          <WhisperStat label="Documents" value={String(stats.docs)} />
          <WhisperStat label="Spreadsheets" value={String(stats.sheets)} />
          <WhisperStat label="PDFs" value={String(stats.pdfs)} />
          <WhisperStat label="Content Extracted" value={String(stats.with_content)} />
          <WhisperStat label="Embedded in KG" value={String(stats.embedded)} />
        </div>
      )}

      {/* Search — explore what the system has indexed */}
      <div className="mb-8 flex items-center gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted" />
          <input
            type="text"
            placeholder="Search files and content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="h-11 w-full rounded-xl bg-surface-container-low/60 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none focus:bg-white/60"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="h-11 rounded-xl bg-primary/10 px-5 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-40"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-muted">{searchResults.length} results</span>
          {searchResults.map(file => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-2xl bg-white/40 px-5 py-4 hover:bg-white/55"
            >
              {mimeIcon(file.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{file.name}</p>
                <p className="text-label-sm text-on-surface-muted">
                  {file.parent_folder_name && <span>{file.parent_folder_name} / </span>}
                  {file.modified_time && formatRelative(file.modified_time)}
                  {file.last_modifying_user && <span> by {file.last_modifying_user}</span>}
                </p>
              </div>
              {file.has_content && (
                <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary">indexed</span>
              )}
              {file.web_view_link && (
                <a href={file.web_view_link} target="_blank" rel="noopener noreferrer" className="text-on-surface-muted hover:text-primary">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && !isSearching && searchQuery && (
        <p className="text-sm text-on-surface-muted/40">No results found</p>
      )}

      {!searchQuery && (
        <p className="text-sm text-on-surface-muted/30 font-mono text-[10px] uppercase tracking-[0.15em]">
          {stats?.total_files ? `${stats.total_files.toLocaleString()} files indexed` : 'Search to explore your Drive'}
        </p>
      )}
    </div>
  )
}
