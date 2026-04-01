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
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-zinc-100">Compose Post</h2>

      <div className="grid grid-cols-3 gap-6">
        {/* Editor */}
        <div className="col-span-2 space-y-4">
          {/* Post type */}
          <div className="flex gap-2">
            {POST_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setPostType(t.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  postType === t.value ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800/50 text-zinc-400'
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between">
              <span className={cn('text-xs', content.length > MAX_CHARS * 0.9 ? 'text-yellow-400' : 'text-zinc-500')}>
                {content.length}/{MAX_CHARS}
              </span>
              {content.length > 0 && (
                <span className="text-xs text-zinc-500">
                  ~{Math.ceil(content.length / 200)} min read
                </span>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {hashtags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-xs text-blue-400">
                  {tag}
                  <button onClick={() => setHashtags(hashtags.filter(h => h !== tag))} className="text-blue-500 hover:text-blue-300">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-1">
                <Hash className="h-3 w-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Add hashtag"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  className="bg-transparent text-xs text-zinc-300 placeholder-zinc-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => save.mutate()}
              disabled={!content.trim() || save.isPending}
              className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              {scheduledAt ? 'Schedule' : 'Save Draft'}
            </button>
            <button
              onClick={() => setShowAI(!showAI)}
              className="flex items-center gap-1.5 rounded-md bg-purple-600/20 px-4 py-2 text-sm text-purple-400 hover:bg-purple-600/30"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Generate
            </button>
          </div>
        </div>

        {/* Sidebar: Schedule + Theme */}
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-medium text-zinc-400">Schedule</h3>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="flex-1 rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 outline-none"
                />
              </div>
              {scheduledAt && (
                <button onClick={() => setScheduledAt('')} className="mt-1 text-xs text-zinc-500 hover:text-zinc-300">
                  Clear schedule (save as draft)
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-medium text-zinc-400">Theme</h3>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g. Technical Tuesday"
              className="mt-2 w-full rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 outline-none"
            />
          </div>

          {content && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-medium text-zinc-400">Preview</h3>
              <div className="mt-2 max-h-40 overflow-y-auto text-xs text-zinc-400 whitespace-pre-wrap">
                {content.slice(0, 100)}...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generator Panel */}
      {showAI && (
        <div className="rounded-lg border border-purple-800/30 bg-purple-900/10 p-5">
          <h3 className="text-sm font-medium text-purple-400">AI Content Generator</h3>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={aiTheme}
              onChange={(e) => setAITheme(e.target.value)}
              placeholder="Topic or theme (e.g. 'building software for nonprofits')"
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 outline-none"
            />
            <button
              onClick={() => generate.mutate()}
              disabled={!aiTheme.trim() || generate.isPending}
              className="flex items-center gap-1.5 rounded-md bg-purple-600/30 px-4 py-2 text-sm text-purple-300 hover:bg-purple-600/40 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generate.isPending ? 'Generating...' : 'Generate 3 Variations'}
            </button>
          </div>

          {aiVariations.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {aiVariations.map((v, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase text-purple-400">{v.angle}</span>
                    <span className="text-[10px] text-zinc-500">{v.characterCount} chars</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-zinc-300">{v.hookLine}</p>
                  <p className="mt-2 max-h-32 overflow-y-auto text-xs text-zinc-400 whitespace-pre-wrap">{v.content.slice(0, 300)}...</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.hashtags.map((tag) => (
                      <span key={tag} className="text-[10px] text-blue-400">{tag}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => useVariation(v)}
                    className="mt-2 w-full rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
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
