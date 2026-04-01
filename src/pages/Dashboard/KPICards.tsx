import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react'

export function KPICards() {
  const { data } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })

  const cards = [
    { label: 'Income (MTD)', value: formatCurrency(data?.income ?? 0), icon: TrendingUp, color: 'text-green-400' },
    { label: 'Expenses (MTD)', value: formatCurrency(data?.expenses ?? 0), icon: TrendingDown, color: 'text-red-400' },
    { label: 'Net (MTD)', value: formatCurrency(data?.net ?? 0), icon: DollarSign, color: (data?.net ?? 0) >= 0 ? 'text-green-400' : 'text-red-400' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{card.label}</span>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </div>
          <p className={`mt-2 text-2xl font-semibold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
