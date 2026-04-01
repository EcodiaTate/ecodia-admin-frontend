import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWorkerStatus, resumeWorker } from '@/api/linkedin'
import { DMList } from './DMList'
import { DMDetail } from './DMDetail'
import { PostScheduler } from './PostScheduler'
import toast from 'react-hot-toast'

export default function LinkedInPage() {
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [tab, setTab] = useState<'dms' | 'posts'>('dms')

  const { data: workerStatus } = useQuery({ queryKey: ['linkedinWorkerStatus'], queryFn: getWorkerStatus })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">LinkedIn</h1>
        {workerStatus?.suspended && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-400">Worker suspended: {workerStatus.reason}</span>
            <button
              onClick={async () => { await resumeWorker(); toast.success('Worker resumed') }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('dms')} className={`rounded-md px-3 py-1.5 text-sm ${tab === 'dms' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}>DMs</button>
        <button onClick={() => setTab('posts')} className={`rounded-md px-3 py-1.5 text-sm ${tab === 'posts' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}>Posts</button>
      </div>

      {tab === 'dms' ? (
        selected ? (
          <div>
            <button onClick={() => setSelected(null)} className="mb-4 text-sm text-zinc-400 hover:text-zinc-200">&larr; Back</button>
            <DMDetail dm={selected} />
          </div>
        ) : (
          <DMList onSelect={setSelected} />
        )
      ) : (
        <PostScheduler />
      )}
    </div>
  )
}
