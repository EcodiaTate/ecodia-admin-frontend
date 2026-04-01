import DOMPurify from 'dompurify'
import type { EmailThread } from '@/types/gmail'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function EmailDetail({ thread }: { thread: EmailThread }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-100">{thread.subject || '(no subject)'}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            From: {thread.from_name || thread.from_email}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={thread.triage_priority} />
          <StatusBadge status={thread.status} />
        </div>
      </div>

      {thread.triage_summary && (
        <div className="mt-4 rounded-md bg-zinc-800/50 p-3">
          <p className="text-xs font-medium text-zinc-500">AI Summary</p>
          <p className="mt-1 text-sm text-zinc-300">{thread.triage_summary}</p>
        </div>
      )}

      <div className="mt-4">
        {thread.full_body && thread.full_body.includes('<') ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-zinc-300 [&_a]:text-blue-400 [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(thread.full_body) }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-zinc-300">
            {thread.full_body || thread.snippet || 'No content'}
          </p>
        )}
      </div>
    </div>
  )
}
