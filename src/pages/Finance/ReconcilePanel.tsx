import { TransactionList } from './TransactionList'

export function ReconcilePanel() {
  return (
    <div>
      <h2 className="mb-6 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">
        Pending Classification
      </h2>
      <TransactionList status="uncategorized" />
    </div>
  )
}
