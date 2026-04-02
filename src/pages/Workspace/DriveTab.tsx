import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getDriveStats, searchDrive, createDocument, createSpreadsheet, createFolder } from '@/api/drive'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import type { DriveFile } from '@/types/workspace'
import { cn, formatRelative } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Search, FileText, Sheet, FileImage, ExternalLink, Plus, FolderPlus } from 'lucide-react'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export function DriveTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<DriveFile[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'doc' | 'sheet' | 'folder'>('doc')
  const [createTitle, setCreateTitle] = useState('')

  const { data: stats } = useQuery({ queryKey: ['driveStats'], queryFn: getDriveStats, staleTime: 30000 })

  const createMut = useMutation({
    mutationFn: () => {
      switch (createType) {
        case 'doc': return createDocument(createTitle)
        case 'sheet': return createSpreadsheet(createTitle)
        case 'folder': return createFolder(createTitle)
      }
    },
    onSuccess: () => {
      setCreateTitle('')
      setShowCreate(false)
      toast.success(`${createType === 'folder' ? 'Folder' : createType === 'doc' ? 'Document' : 'Spreadsheet'} created`)
    },
    onError: () => toast.error('Creation failed'),
  })

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

      {/* Search + Create */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-lg">
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
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary-gradient flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> Create
        </button>
      </div>

      {/* Create panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={glide}
            className="glass-elevated mb-8 rounded-2xl p-6"
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex gap-1 rounded-2xl bg-surface-container-low/50 p-1">
                {([['doc', 'Document', FileText], ['sheet', 'Sheet', Sheet], ['folder', 'Folder', FolderPlus]] as const).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setCreateType(key as 'doc' | 'sheet' | 'folder')}
                    className={cn(
                      'relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium',
                      createType === key ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
                    )}
                  >
                    {createType === key && (
                      <motion.div layoutId="drive-create-type" className="absolute inset-0 rounded-xl bg-white/60" transition={glide}
                        style={{ boxShadow: '0 4px 20px -4px rgba(0, 104, 122, 0.06)' }} />
                    )}
                    <Icon className="relative h-3.5 w-3.5" strokeWidth={1.75} />
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder={`${createType === 'folder' ? 'Folder' : createType === 'doc' ? 'Document' : 'Spreadsheet'} name...`}
                onKeyDown={(e) => e.key === 'Enter' && createTitle.trim() && createMut.mutate()}
                className="flex-1 min-w-[200px] rounded-xl bg-surface-container-low/60 px-4 py-2 text-sm text-on-surface placeholder-on-surface-muted/50 outline-none focus:bg-white/60"
              />
              <button
                onClick={() => createMut.mutate()}
                disabled={!createTitle.trim() || createMut.isPending}
                className="btn-primary-gradient rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-40"
              >
                {createMut.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <p className="text-sm text-on-surface-muted">No results found</p>
      )}
    </div>
  )
}
