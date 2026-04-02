import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTasks, createTask, updateTask } from '@/api/crm'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Task } from '@/types/crm'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle, X } from 'lucide-react'
import { formatRelative, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const PRIORITY_ICON = {
  urgent: <AlertTriangle className="h-3.5 w-3.5 text-error" strokeWidth={1.75} />,
  high: <AlertTriangle className="h-3.5 w-3.5 text-tertiary" strokeWidth={1.75} />,
  medium: <Clock className="h-3.5 w-3.5 text-on-surface-muted" strokeWidth={1.75} />,
  low: <Clock className="h-3.5 w-3.5 text-on-surface-muted/40" strokeWidth={1.75} />,
}

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }

export default function TasksPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'open' | 'in_progress' | 'done' | 'all'>('open')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: () => getTasks({
      limit: 100,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  })

  const complete = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: 'done' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task complete')
    },
  })

  const tasks = (data?.tasks ?? []).sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  )

  const FILTERS: { key: typeof statusFilter; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <SpatialLayer z={25} className="mb-10 flex items-end justify-between gap-4">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
            Current Intentions
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Task <em className="not-italic font-normal text-primary">Stream</em>
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
        >
          {showCreate ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
          {showCreate ? 'Cancel' : 'New Task'}
        </button>
      </SpatialLayer>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="mb-8 overflow-hidden"
          >
            <CreateTaskForm
              onCreated={() => {
                setShowCreate(false)
                queryClient.invalidateQueries({ queryKey: ['tasks'] })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter tabs */}
      <SpatialLayer z={10} className="mb-8">
        <div className="flex gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                'relative rounded-xl px-4 py-2 text-sm font-medium',
                statusFilter === key ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
              )}
            >
              {statusFilter === key && (
                <motion.div
                  layoutId="task-filter-bg"
                  className="absolute inset-0 rounded-xl bg-white/60"
                  style={{ boxShadow: '0 4px 20px -4px rgba(27, 122, 61, 0.06)' }}
                  transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </SpatialLayer>

      <SpatialLayer z={-5}>
        {isLoading ? (
          <LoadingSpinner />
        ) : tasks.length === 0 ? (
          <div className="py-20 text-center">
            <CheckCircle2 className="mx-auto h-7 w-7 text-secondary/20" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-on-surface-muted/40">
              {statusFilter === 'open' ? 'No open tasks.' : 'Nothing here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.02 }}
                >
                  <TaskRow
                    task={task}
                    onComplete={() => complete.mutate(task.id)}
                    isCompleting={complete.isPending && complete.variables === task.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </SpatialLayer>
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────

function TaskRow({
  task,
  onComplete,
  isCompleting,
}: {
  task: Task
  onComplete: () => void
  isCompleting: boolean
}) {
  const isDone = task.status === 'done' || task.status === 'cancelled'

  return (
    <GlassPanel depth="surface" className={cn('p-5', isDone && 'opacity-50')}>
      <div className="flex items-start gap-4">
        <button
          onClick={onComplete}
          disabled={isDone || isCompleting}
          className="mt-0.5 shrink-0 text-on-surface-muted/40 transition-colors hover:text-secondary disabled:cursor-default"
        >
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-secondary/50" strokeWidth={1.75} />
          ) : isCompleting ? (
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <Circle className="h-4 w-4" strokeWidth={1.75} />
            </motion.div>
          ) : (
            <Circle className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn('text-sm font-medium text-on-surface', isDone && 'line-through text-on-surface-muted')}>
                {task.title}
              </p>
              {task.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-on-surface-muted/60 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {PRIORITY_ICON[task.priority]}
              <StatusBadge status={task.status} />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-label-sm text-on-surface-muted/50">
            {task.client_name && (
              <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] text-primary">{task.client_name}</span>
            )}
            {task.project_name && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted">{task.project_name}</span>
            )}
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] uppercase tracking-wide text-on-surface-muted/40">
              {task.source}
            </span>
            <span className="font-mono text-[10px]">{formatRelative(task.created_at)}</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}

// ─── Create Task Form ─────────────────────────────────────────────────

function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
  })

  const create = useMutation({
    mutationFn: () => createTask({ ...form, source: 'manual' }),
    onSuccess: () => {
      toast.success('Task created')
      onCreated()
    },
    onError: () => toast.error('Failed to create task'),
  })

  const inputClass =
    'w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-muted/40 outline-none focus:bg-white/60'

  return (
    <div className="rounded-2xl bg-white/50 p-6 space-y-4">
      <div className="grid gap-4">
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && form.title.trim() && create.mutate()}
            placeholder="What needs doing?"
            className={inputClass}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional context..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
              className={inputClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <motion.button
          onClick={() => form.title.trim() && create.mutate()}
          disabled={!form.title.trim() || create.isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary-gradient rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          {create.isPending ? 'Creating...' : 'Create Task'}
        </motion.button>
      </div>
    </div>
  )
}
