import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncFinance } from '@/api/finance'
import { TransactionList } from './TransactionList'
import { CategoryChart } from './CategoryChart'
import { ReconcilePanel } from './ReconcilePanel'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'

export default function FinancePage() {
  const [tab, setTab] = useState<'all' | 'uncategorized'>('all')
  const queryClient = useQueryClient()

  const sync = useMutation({
    mutationFn: syncFinance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      toast.success('Xero sync complete')
    },
    onError: () => toast.error('Sync failed'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Finance</h1>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
          Sync Xero
        </button>
      </div>

      <CategoryChart />

      <div className="flex gap-2">
        <button
          onClick={() => setTab('all')}
          className={`rounded-md px-3 py-1.5 text-sm ${tab === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          All Transactions
        </button>
        <button
          onClick={() => setTab('uncategorized')}
          className={`rounded-md px-3 py-1.5 text-sm ${tab === 'uncategorized' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
        >
          Uncategorized
        </button>
      </div>

      {tab === 'all' ? <TransactionList /> : <ReconcilePanel />}
    </div>
  )
}
