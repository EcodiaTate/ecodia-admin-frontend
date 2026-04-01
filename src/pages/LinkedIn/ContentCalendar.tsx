import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPostsCalendar, getContentThemes, createContentTheme, deleteContentTheme, suggestPostTimes } from '@/api/linkedin'
import { cn } from '@/lib/utils'
import type { LinkedInPost, ContentTheme, SuggestedPostTimes } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Sparkles } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const THEME_COLORS: Record<string, string> = {
  technical: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  'founder-life': 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  'case-study': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
  default: 'bg-zinc-700/30 border-zinc-600/30 text-zinc-300',
}

function getThemeColor(theme: string | null) {
  return THEME_COLORS[theme || ''] || THEME_COLORS.default
}

export function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showThemes, setShowThemes] = useState(false)
  const [newThemeName, setNewThemeName] = useState('')
  const [suggestedTimes, setSuggestedTimes] = useState<SuggestedPostTimes | null>(null)
  const queryClient = useQueryClient()

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const { data: posts } = useQuery({
    queryKey: ['linkedinCalendar', startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: () => getPostsCalendar(startOfMonth.toISOString(), endOfMonth.toISOString()),
  })

  const { data: themes } = useQuery({
    queryKey: ['linkedinThemes'],
    queryFn: getContentThemes,
  })

  const addTheme = useMutation({
    mutationFn: () => createContentTheme({ name: newThemeName }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['linkedinThemes'] }); setNewThemeName(''); toast.success('Theme created') },
  })

  const removeTheme = useMutation({
    mutationFn: deleteContentTheme,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['linkedinThemes'] }); toast.success('Theme deleted') },
  })

  const fetchTimes = useMutation({
    mutationFn: suggestPostTimes,
    onSuccess: (data) => { setSuggestedTimes(data); toast.success('Time suggestions generated') },
    onError: () => toast.error('Failed to generate suggestions'),
  })

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []
    const firstDayOfWeek = startOfMonth.getDay()

    // Pad start
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)

    // Days of month
    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))
    }

    return days
  }, [currentDate, startOfMonth, endOfMonth])

  const postsByDate = useMemo(() => {
    const map: Record<string, LinkedInPost[]> = {}
    for (const post of posts ?? []) {
      const date = post.scheduled_at || post.posted_at
      if (!date) continue
      const key = new Date(date).toISOString().slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(post)
    }
    return map
  }, [posts])

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const monthLabel = currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="rounded p-1 text-zinc-400 hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="text-sm font-medium text-zinc-200">{monthLabel}</h2>
          <button onClick={nextMonth} className="rounded p-1 text-zinc-400 hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchTimes.mutate()}
            disabled={fetchTimes.isPending}
            className="flex items-center gap-1.5 rounded-md bg-purple-600/20 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-600/30 disabled:opacity-50"
          >
            <Clock className="h-3 w-3" /> {fetchTimes.isPending ? 'Analyzing...' : 'Suggest Times'}
          </button>
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
          >
            Themes
          </button>
        </div>
      </div>

      {/* Suggested times */}
      {suggestedTimes && (
        <div className="rounded-lg border border-purple-800/30 bg-purple-900/10 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">Optimal Posting Times</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">{suggestedTimes.insight}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedTimes.suggestedSlots.map((s, i) => (
              <span key={i} className="rounded-full bg-purple-600/20 px-2 py-0.5 text-[10px] text-purple-300">
                {s.day} {s.time} — {s.reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-lg border border-zinc-800">
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {DAYS.map((d) => (
            <div key={d} className="p-2 text-center text-xs font-medium text-zinc-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-zinc-800/50 bg-zinc-950/30" />

            const dateKey = day.toISOString().slice(0, 10)
            const dayPosts = postsByDate[dateKey] || []
            const isToday = dateKey === new Date().toISOString().slice(0, 10)

            return (
              <div key={dateKey} className={cn(
                'min-h-[80px] border-b border-r border-zinc-800/50 p-1.5',
                isToday && 'bg-blue-900/10'
              )}>
                <span className={cn(
                  'text-xs',
                  isToday ? 'font-bold text-blue-400' : 'text-zinc-500'
                )}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={cn('truncate rounded border px-1 py-0.5 text-[10px]', getThemeColor(post.theme))}
                      title={post.content.slice(0, 100)}
                    >
                      {post.status === 'posted' ? '✓ ' : post.status === 'scheduled' ? '⏰ ' : ''}{post.content.slice(0, 20)}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-zinc-500">+{dayPosts.length - 3} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Themes panel */}
      {showThemes && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-sm font-medium text-zinc-400">Content Themes</h3>
          <div className="mt-3 space-y-2">
            {(themes ?? []).map((theme: ContentTheme) => (
              <div key={theme.id} className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
                <div>
                  <span className="text-sm text-zinc-200">{theme.name}</span>
                  {theme.day_of_week != null && (
                    <span className="ml-2 text-xs text-zinc-500">{DAYS[theme.day_of_week]}</span>
                  )}
                  {theme.time_of_day && (
                    <span className="ml-1 text-xs text-zinc-500">{theme.time_of_day}</span>
                  )}
                </div>
                <button
                  onClick={() => removeTheme.mutate(theme.id)}
                  className="rounded p-1 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="New theme name..."
                className="flex-1 rounded bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && newThemeName.trim() && addTheme.mutate()}
              />
              <button
                onClick={() => addTheme.mutate()}
                disabled={!newThemeName.trim()}
                className="rounded bg-zinc-700 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
