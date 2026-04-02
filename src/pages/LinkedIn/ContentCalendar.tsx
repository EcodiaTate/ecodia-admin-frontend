import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPostsCalendar, getContentThemes, createContentTheme, deleteContentTheme, suggestPostTimes } from '@/api/linkedin'
import { cn } from '@/lib/utils'
import type { LinkedInPost, ContentTheme, SuggestedPostTimes } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Sparkles } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const THEME_COLORS: Record<string, string> = {
  technical: 'bg-primary/10 text-primary',
  'founder-life': 'bg-primary-container/10 text-primary-container',
  'case-study': 'bg-secondary/10 text-secondary',
  default: 'bg-surface-container text-on-surface-muted',
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

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = []
    const firstDayOfWeek = startOfMonth.getDay()
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="rounded-xl p-1.5 text-on-surface-muted hover:bg-surface-container">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <h2 className="font-display text-sm font-medium text-on-surface">{monthLabel}</h2>
          <button onClick={nextMonth} className="rounded-xl p-1.5 text-on-surface-muted hover:bg-surface-container">
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchTimes.mutate()}
            disabled={fetchTimes.isPending}
            className="btn-primary-gradient flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium disabled:opacity-40"
          >
            <Clock className="h-3 w-3" strokeWidth={1.75} /> {fetchTimes.isPending ? 'Analyzing...' : 'Suggest Times'}
          </button>
          <button
            onClick={() => setShowThemes(!showThemes)}
            className="rounded-xl bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Themes
          </button>
        </div>
      </div>

      {/* Suggested times */}
      {suggestedTimes && (
        <div className="rounded-2xl bg-primary/5 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-label-md uppercase tracking-[0.05em] text-primary">Optimal Posting Windows</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-muted">{suggestedTimes.insight}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedTimes.suggestedSlots.map((s, i) => (
              <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-label-sm text-primary">
                {s.day} {s.time} \u2014 {s.reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="p-3 text-center text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="min-h-[90px] bg-surface-container-low/30 p-2" />

            const dateKey = day.toISOString().slice(0, 10)
            const dayPosts = postsByDate[dateKey] || []
            const isToday = dateKey === new Date().toISOString().slice(0, 10)

            return (
              <div key={dateKey} className={cn(
                'min-h-[90px] p-2 transition-colors',
                isToday && 'bg-primary/5',
              )}>
                <span className={cn(
                  'text-xs',
                  isToday ? 'font-semibold text-primary' : 'text-on-surface-muted',
                )}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      className={cn('truncate rounded-xl px-1.5 py-0.5 text-[10px]', getThemeColor(post.theme))}
                      title={post.content.slice(0, 100)}
                    >
                      {post.content.slice(0, 20)}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-label-sm text-on-surface-muted">+{dayPosts.length - 3}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Themes panel */}
      {showThemes && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Content Themes</h3>
          <div className="mt-4 space-y-2">
            {(themes ?? []).map((theme: ContentTheme) => (
              <div key={theme.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                <div>
                  <span className="text-sm text-on-surface">{theme.name}</span>
                  {theme.day_of_week != null && (
                    <span className="ml-2 text-xs text-on-surface-muted">{DAYS[theme.day_of_week]}</span>
                  )}
                  {theme.time_of_day && (
                    <span className="ml-1 text-xs text-on-surface-muted">{theme.time_of_day}</span>
                  )}
                </div>
                <button onClick={() => removeTheme.mutate(theme.id)} className="rounded-xl p-1 text-on-surface-muted hover:text-error">
                  <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="New theme name..."
                className="flex-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface placeholder-on-surface-muted outline-none"
                onKeyDown={(e) => e.key === 'Enter' && newThemeName.trim() && addTheme.mutate()}
              />
              <button
                onClick={() => addTheme.mutate()}
                disabled={!newThemeName.trim()}
                className="rounded-xl bg-surface-container-high px-3 py-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
              >
                <Plus className="h-3 w-3" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
