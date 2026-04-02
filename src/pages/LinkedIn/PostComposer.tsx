import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost, generatePost } from '@/api/linkedin'
import type { GeneratedPost, PostType } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Sparkles, Clock, Hash, X } from 'lucide-react'

const POST_TYPES: { label: string; value: PostType }[] = [
  { label: 'Text', value: 'text' },
  { label: 'Image', value: 'image' },
  { label: 'Carousel', value: 'carousel' },
  { label: 'Poll', value: 'poll' },
]

const MAX_CHARS = 3000

export function PostComposer({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<PostType>('text')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [hashtagInput, setHashtagInput] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [theme, setTheme] = useState('')
  const [showAI, setShowAI] = useState(false)
  const [aiTheme, setAITheme] = useState('')
  const [aiVariations, setAIVariations] = useState<GeneratedPost[]>([])

  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: () => createPost({
      content,
      postType,
      hashtags,
      scheduledAt: scheduledAt || undefined,
      theme: theme || undefined,
      aiGenerated: aiVariations.length > 0,
      aiPrompt: aiTheme || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedinPosts'] })
      toast.success(scheduledAt ? 'Post scheduled' : 'Draft saved')
      onSaved()
    },
    onError: () => toast.error('Failed to save post'),
  })

  const generate = useMutation({
    mutationFn: () => generatePost(aiTheme, postType),
    onSuccess: (data) => {
      setAIVariations(data.variations)
      toast.success('3 variations generated')
    },
    onError: () => toast.error('Generation failed'),
  })

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '')
    if (tag && !hashtags.includes(`#${tag}`)) {
      setHashtags([...hashtags, `#${tag}`])
      setHashtagInput('')
    }
  }

  const useVariation = (v: GeneratedPost) => {
    setContent(v.content)
    setHashtags(v.hashtags)
    setShowAI(false)
  }

  return (
    <div className="space-y-8">
      <h2 className="font-display text-headline-md font-light text-on-surface">Compose Post</h2>

      <div className="grid grid-cols-3 gap-8">
        {/* Editor */}
        <div className="col-span-2 space-y-6">
          {/* Post type */}
          <div className="flex gap-1">
            {POST_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setPostType(t.value)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-medium transition-colors',
                  postType === t.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Write your LinkedIn post..."
              rows={10}
              className="w-full rounded-2xl bg-surface-container-low px-6 py-4 text-sm leading-relaxed text-on-surface placeholder-on-surface-muted transition-colors focus:bg-surface-container-lowest focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className={cn('text-label-sm', content.length > MAX_CHARS * 0.9 ? 'text-tertiary' : 'text-on-surface-muted')}>
                {content.length}/{MAX_CHARS}
              </span>
              {content.length > 0 && (
                <span className="text-label-sm text-on-surface-muted">
                  ~{Math.ceil(content.length / 200)} min read
                </span>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {hashtags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                {tag}
                <button onClick={() => setHashtags(hashtags.filter(h => h !== tag))} className="text-primary/60 hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-low px-3 py-1.5">
              <Hash className="h-3 w-3 text-on-surface-muted" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Add hashtag"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                className="bg-transparent text-xs text-on-surface placeholder-on-surface-muted outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => save.mutate()}
              disabled={!content.trim() || save.isPending}
              className="rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              {scheduledAt ? 'Schedule' : 'Save Draft'}
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} /> AI Generate
            </button>
          </div>
        </div>

        {/* Sidebar: Schedule + Theme */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Schedule</h3>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-on-surface-muted" strokeWidth={1.75} />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="flex-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface outline-none"
                />
              </div>
              {scheduledAt && (
                <button onClick={() => setScheduledAt('')} className="mt-2 text-xs text-on-surface-muted hover:text-on-surface-variant">
                  Clear schedule
                </button>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Theme</h3>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Technical Tuesday"
              className="mt-3 w-full rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface placeholder-on-surface-muted outline-none"
            />
          </div>

          {content && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Preview</h3>
              <div className="mt-3 max-h-40 overflow-y-auto text-xs leading-relaxed text-on-surface-muted whitespace-pre-wrap">
                {content.slice(0, 100)}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generator Panel */}
      {showAI && (
        <div className="rounded-2xl bg-primary/5 p-8">
          <h3 className="text-label-md uppercase tracking-[0.05em] text-primary">AI Content Generator</h3>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={aiTheme}
              onChange={(e) => setAITheme(e.target.value)}
              placeholder="Topic or theme (e.g. 'building software for nonprofits')"
              className="flex-1 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-muted outline-none"
            />
            <button
              onClick={() => generate.mutate()}
              disabled={!aiTheme.trim() || generate.isPending}
              className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              {generate.isPending ? 'Generating...' : 'Generate 3 Variations'}
            </button>
          </div>

          {aiVariations.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {aiVariations.map((v, i) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-label-sm uppercase text-primary">{v.angle}</span>
                    <span className="font-mono text-label-sm text-on-surface-muted">{v.characterCount}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-on-surface">{v.hookLine}</p>
                  <p className="mt-2 max-h-32 overflow-y-auto text-xs leading-relaxed text-on-surface-muted whitespace-pre-wrap">{v.content.slice(0, 300)}...</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.hashtags.map((tag) => (
                      <span key={tag} className="text-label-sm text-primary-container">{tag}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => useVariation(v)}
                    className="mt-3 w-full rounded-xl bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
                  >
                    Use this
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
