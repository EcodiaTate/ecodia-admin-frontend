import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClient, createClient, updateStage, addNote } from '@/api/crm'
import { Pipeline } from './Pipeline'
import { ProjectDetail } from './ProjectDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'

import type { Client, PipelineStage } from '@/types/crm'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { ArrowLeft, Plus, ChevronDown, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const STAGES: PipelineStage[] = ['lead', 'proposal', 'contract', 'development', 'live', 'ongoing', 'archived']

export default function CRMPage() {
  const { clientId } = useParams()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false)
  const queryClient = useQueryClient()

  const activeId = clientId || selectedClient?.id
  const { data: client, refetch: refetchClient } = useQuery({
    queryKey: ['client', activeId],
    queryFn: () => getClient(activeId!),
    enabled: !!activeId,
  })

  const stageMutation = useMutation({
    mutationFn: ({ stage, note }: { stage: PipelineStage; note?: string }) =>
      updateStage(activeId!, stage, note),
    onSuccess: () => {
      refetchClient()
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      setStageDropdownOpen(false)
      toast.success('Stage updated')
    },
    onError: () => toast.error('Failed to update stage'),
  })

  const noteMutation = useMutation({
    mutationFn: (content: string) => addNote(activeId!, content),
    onSuccess: () => {
      refetchClient()
      setNoteInput('')
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  return (
    <div className="mx-auto max-w-6xl">
      <SpatialLayer z={25} className="mb-10 sm:mb-12 flex items-end justify-between gap-4">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
            Client Network
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Flow <em className="not-italic font-normal text-primary">State</em>
          </h1>
        </div>
        {!client && !showCreateForm && (
          <motion.button
            onClick={() => setShowCreateForm(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New Client
          </motion.button>
        )}
      </SpatialLayer>

      <SpatialLayer z={-5}>
        <AnimatePresence mode="popLayout" initial={false}>
          {showCreateForm ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            >
              <CreateClientForm
                onClose={() => setShowCreateForm(false)}
                onCreated={(c) => {
                  setShowCreateForm(false)
                  setSelectedClient(c)
                  queryClient.invalidateQueries({ queryKey: ['pipeline'] })
                }}
              />
            </motion.div>
          ) : client ? (
            <motion.div
              key="client-detail"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
              className="max-w-4xl space-y-8"
            >
              <button
                onClick={() => setSelectedClient(null)}
                className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to pipeline
              </button>

              <div className="rounded-3xl bg-white/40 p-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-display-md font-light text-on-surface">{client.name}</h1>
                    {client.company && <p className="mt-2 text-sm text-on-surface-muted">{client.company}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Stage selector */}
                    <div className="relative">
                      <button
                        onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                        className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
                      >
                        {client.stage}
                        <ChevronDown className="h-3 w-3" strokeWidth={2} />
                      </button>
                      <AnimatePresence>
                        {stageDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                            className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl bg-white/90 shadow-lg ring-1 ring-black/5"
                          >
                            {STAGES.map((s) => (
                              <button
                                key={s}
                                onClick={() => stageMutation.mutate({ stage: s })}
                                disabled={s === client.stage || stageMutation.isPending}
                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary/5 ${
                                  s === client.stage ? 'text-primary font-medium' : 'text-on-surface-variant'
                                } disabled:cursor-default`}
                              >
                                {s}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <StatusBadge status={client.priority} />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
                  {client.email && (
                    <div>
                      <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Email</span>
                      <p className="mt-1 text-on-surface-variant">{client.email}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Phone</span>
                      <p className="mt-1 text-on-surface-variant">{client.phone}</p>
                    </div>
                  )}
                  {client.linkedin_url && (
                    <div className="col-span-2">
                      <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">LinkedIn</span>
                      <a href={client.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="mt-1 block text-primary hover:underline text-sm truncate">{client.linkedin_url}</a>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-10 space-y-3">
                  <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Notes</h3>
                  <AnimatePresence initial={false}>
                    {client.notes.map((n, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl bg-surface-container-low p-5"
                      >
                        <p className="text-sm leading-relaxed text-on-surface-variant">{n.content}</p>
                        <p className="mt-2 font-mono text-label-sm text-on-surface-muted">
                          {n.source} &middot; {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add note */}
                  <div className="flex gap-3 pt-2">
                    <input
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && noteInput.trim() && noteMutation.mutate(noteInput.trim())}
                      placeholder="Add a note..."
                      className="flex-1 rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-muted/40 outline-none focus:bg-white/60"
                    />
                    <button
                      onClick={() => noteInput.trim() && noteMutation.mutate(noteInput.trim())}
                      disabled={!noteInput.trim() || noteMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2.5 text-sm text-primary hover:bg-primary/15 disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </div>

              <ProjectDetail clientId={client.id} />
            </motion.div>
          ) : (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            >
              <Pipeline onSelectClient={setSelectedClient} />
            </motion.div>
          )}
        </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}

// ─── Create Client Form ───────────────────────────────────────────────────────

function CreateClientForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (client: Client) => void
}) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    linkedin_url: '',
    stage: 'lead' as PipelineStage,
    priority: 'medium' as 'low' | 'medium' | 'high',
  })

  const create = useMutation({
    mutationFn: () => createClient(form),
    onSuccess: (client) => {
      toast.success(`${client.name} added to pipeline`)
      onCreated(client)
    },
    onError: () => toast.error('Failed to create client'),
  })

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  const inputClass =
    'w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-muted/40 outline-none focus:bg-white/60'

  return (
    <div className="max-w-2xl rounded-3xl bg-white/40 p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-headline-md font-light text-on-surface">New Client</h2>
        <button onClick={onClose} className="text-sm text-on-surface-muted hover:text-on-surface-variant">Cancel</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Name *</label>
          <input {...field('name')} placeholder="Full name" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Company</label>
          <input {...field('company')} placeholder="Company name" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Email</label>
          <input {...field('email')} type="email" placeholder="email@example.com" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Phone</label>
          <input {...field('phone')} placeholder="+61 400 000 000" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">LinkedIn URL</label>
          <input {...field('linkedin_url')} placeholder="linkedin.com/in/..." className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Stage</label>
          <select {...field('stage')} className={inputClass}>
            {STAGES.filter(s => s !== 'archived').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Priority</label>
          <select {...field('priority')} className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm text-on-surface-muted hover:text-on-surface-variant">
          Cancel
        </button>
        <motion.button
          onClick={() => form.name.trim() && create.mutate()}
          disabled={!form.name.trim() || create.isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary-gradient rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          {create.isPending ? 'Creating...' : 'Create Client'}
        </motion.button>
      </div>
    </div>
  )
}
