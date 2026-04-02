import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTask } from '@/api/crm'
import type { Task } from '@/types/crm'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatRelative } from '@/lib/utils'
import { Plus, CircleDot, Check, X, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'All', value: undefined },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-error',
  high: 'text-tertiary',
  medium: 'text-primary',
  low: 'text-on-surface-muted',
}

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export function TaskStream() {
  const [status, setStatus] = useState<string | undefined>('open')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', status],
    queryFn: () => getTasks({ status, limit: 15 }),
  })

  const create = useMutation({
    mutationFn: () => createTask({ title: newTitle, priority: newPriority, source: 'manual' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setNewTitle('')
      setShowCreate(false)
      toast.success('Task created')
    },
    onError: () => toast.error('Failed to create task'),
  })

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const tasks = data?.tasks ?? []
  const total = data?.total ?? 0

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
            Current Intentions
          </span>
          <span className="text-label-sm text-on-surface-muted/40">{total} tasks</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
        >
          <Plus className="h-3 w-3" strokeWidth={2} /> New
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setStatus(t.value)}
            className={cn(
              'relative rounded-xl px-3 py-1.5 text-xs font-medium',
              status === t.value ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
            )}
          >
            {status === t.value && (
              <motion.div
                layoutId="task-tab-bg"
                className="absolute inset-0 rounded-xl bg-white/60"
                style={{ boxShadow: '0 4px 20px -4px rgba(0, 104, 122, 0.06)' }}
                transition={glide}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={glide}
            className="glass-elevated mb-4 rounded-2xl p-4"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && create.mutate()}
                className="flex-1 rounded-xl bg-surface-container-low/60 px-3 py-2 text-sm text-on-surface placeholder-on-surface-muted/50 outline-none focus:bg-white/60"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                className="rounded-xl bg-surface-container-low/60 px-2 py-2 text-xs text-on-surface outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button
                onClick={() => create.mutate()}
                disabled={!newTitle.trim() || create.isPending}
                className="btn-primary-gradient rounded-xl px-4 py-2 text-xs font-medium disabled:opacity-40"
              >
                {create.isPending ? '...' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, transition: { type: 'spring', stiffness: 200, damping: 25 } }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.03 }}
                className="group flex items-start gap-3 rounded-2xl px-4 py-3 hover:bg-white/30"
              >
                <div className={`mt-0.5 flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                  <CircleDot className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    task.status === 'done' ? 'text-on-surface-muted line-through' : 'text-on-surface',
                  )}>
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={task.priority} />
                    <StatusBadge status={task.source} />
                    {task.client_name && (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted">{task.client_name}</span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1 text-[10px] text-on-surface-muted">
                        <Calendar className="h-2.5 w-2.5" strokeWidth={1.75} />
                        {formatRelative(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100">
                  {task.status !== 'done' && (
                    <button
                      onClick={() => update.mutate({ id: task.id, updates: { status: 'done' } })}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-on-surface-muted/40 hover:bg-secondary/10 hover:text-secondary"
                    >
                      <Check className="h-3 w-3" strokeWidth={2} />
                    </button>
                  )}
                  {task.status === 'open' && (
                    <button
                      onClick={() => update.mutate({ id: task.id, updates: { status: 'in_progress' } })}
                      className="flex h-6 items-center gap-1 rounded-lg bg-primary/10 px-2 text-[10px] font-medium text-primary hover:bg-primary/15"
                    >
                      Start
                    </button>
                  )}
                  {task.status !== 'cancelled' && task.status !== 'done' && (
                    <button
                      onClick={() => update.mutate({ id: task.id, updates: { status: 'cancelled' } })}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-on-surface-muted/40 hover:bg-error/10 hover:text-error"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {tasks.length === 0 && (
            <div className="py-12 text-center">
              <Check className="mx-auto h-5 w-5 text-on-surface-muted/20" strokeWidth={1.5} />
              <p className="mt-3 text-xs text-on-surface-muted/40">No active intentions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
