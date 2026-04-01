import { TransactionList } from './TransactionList'

export function ReconcilePanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-400">Uncategorized Transactions</h2>
      <TransactionList status="uncategorized" />
    </div>
  )
}
