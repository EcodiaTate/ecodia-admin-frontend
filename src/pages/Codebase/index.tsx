import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCodebases, getCodebase, queryCrossCodebase } from '@/api/codebase'
import type { SemanticSearchResult } from '@/api/codebase'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelative } from '@/lib/utils'
import { Search, Code2, FolderTree, ArrowLeft, FileCode } from 'lucide-react'
import toast from 'react-hot-toast'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export default function CodebasePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([])
  const [, setIsSearching] = useState(false)

  const { data: codebases, isLoading } = useQuery({ queryKey: ['codebases'], queryFn: getCodebases })

  const { data: detail } = useQuery({
    queryKey: ['codebase', selectedId],
    queryFn: () => getCodebase(selectedId!),
    enabled: !!selectedId,
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await queryCrossCodebase(searchQuery.trim())
      setSearchResults(results)
    } catch {
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const totalFiles = codebases?.reduce((sum, cb) => sum + cb.file_count, 0) ?? 0

  return (
    <div className="mx-auto max-w-4xl">
      <SpatialLayer z={25} className="mb-14">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
          Semantic Intelligence
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          Codebase <em className="not-italic font-normal text-primary">Mind</em>
        </h1>
        <p className="mt-3 text-sm text-on-surface-muted/50">
          {codebases?.length ?? 0} codebases · {totalFiles.toLocaleString()} files indexed
        </p>
      </SpatialLayer>

      {/* Semantic search */}
      <SpatialLayer z={10} className="mb-10">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Semantic search across all codebases..."
            className="h-11 w-full rounded-xl bg-surface-container-low/60 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none focus:bg-white/60"
          />
        </div>
      </SpatialLayer>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <SpatialLayer z={5} className="mb-12">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={glide}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-label-sm text-on-surface-muted/40">{searchResults.length} matches</span>
                <button onClick={() => setSearchResults([])} className="text-xs text-on-surface-muted/30 hover:text-on-surface-muted">Clear</button>
              </div>
              <div className="space-y-2">
                {searchResults.map((result, i) => (
                  <motion.div key={result.chunk_id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.03 }}
                    className="rounded-2xl bg-white/40 px-5 py-4 hover:bg-white/55">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileCode className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                          <span className="font-mono text-sm font-medium text-on-surface truncate">{result.file_path}</span>
                        </div>
                        <pre className="overflow-x-auto rounded-xl bg-surface-container-low/40 p-3 font-mono text-xs text-on-surface-variant leading-relaxed max-h-32 overflow-y-auto">
                          {result.content.slice(0, 500)}
                        </pre>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {(result.similarity * 100).toFixed(0)}%
                        </span>
                        {result.codebase_name && <span className="text-[10px] text-on-surface-muted">{result.codebase_name}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </SpatialLayer>
        )}
      </AnimatePresence>

      {/* Codebase detail or list */}
      <AnimatePresence mode="wait">
        {selectedId && detail ? (
          <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <SpatialLayer z={-5}>
              <button onClick={() => setSelectedId(null)}
                className="mb-6 flex items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface-variant">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> All codebases
              </button>
              <GlassPanel depth="elevated" className="p-8">
                <div className="flex items-center gap-2.5 mb-2">
                  <Code2 className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  <span className="text-label-md uppercase tracking-[0.1em] text-primary">{detail.language || 'Multi-language'}</span>
                </div>
                <h2 className="font-display text-headline-md font-light text-on-surface">{detail.name}</h2>
                <p className="mt-1 font-mono text-label-sm text-on-surface-muted">{detail.repo_path}</p>
                <div className="mt-6 flex flex-wrap gap-6">
                  <WhisperStat label="Files" value={detail.stats?.totalFiles ?? detail.file_count} />
                  <WhisperStat label="Chunks" value={detail.stats?.totalChunks ?? detail.chunk_count} />
                  <WhisperStat label="Embedded" value={detail.stats?.embeddedChunks ?? 0} accent="text-tertiary" />
                  {detail.last_indexed_at && <WhisperStat label="Last Indexed" value={formatRelative(detail.last_indexed_at)} />}
                </div>
                {detail.stats?.languages && detail.stats.languages.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {detail.stats.languages.map(lang => (
                      <span key={lang.language} className="rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">
                        {lang.language} <span className="font-mono text-on-surface-muted">{lang.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </GlassPanel>
            </SpatialLayer>
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={glide}>
            <SpatialLayer z={-5}>
              {isLoading ? <LoadingSpinner /> : codebases && codebases.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {codebases.map((cb, i) => (
                    <motion.button key={cb.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.05 }}
                      onClick={() => setSelectedId(cb.id)}
                      className="group rounded-2xl bg-white/40 p-6 text-left hover:bg-white/55">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display text-sm font-medium text-on-surface truncate">{cb.name}</p>
                          <p className="mt-0.5 font-mono text-label-sm text-on-surface-muted truncate">{cb.repo_path}</p>
                        </div>
                        <FolderTree className="h-4 w-4 shrink-0 text-primary/30 group-hover:text-primary/60" strokeWidth={1.5} />
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-label-sm text-on-surface-muted">
                        <span>{cb.file_count} files</span>
                        <span>{cb.chunk_count} chunks</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <Code2 className="mx-auto h-6 w-6 text-on-surface-muted/20" strokeWidth={1.5} />
                  <p className="mt-4 text-sm text-on-surface-muted/40">No codebases registered. Factory will populate this.</p>
                </div>
              )}
            </SpatialLayer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
