import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#60a5fa', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899']

export function CategoryChart() {
  const { data } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })

  const chartData = data?.categories.map((c) => ({
    name: c.category,
    value: parseFloat(String(c.total)),
  })) ?? []

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No expense data this month</p>
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">Expenses by Category</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
            labelStyle={{ color: '#a1a1aa' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
