import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { GlassPanel } from '@/components/spatial/GlassPanel'

const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#00687A', '#8B5CF6', '#EC4899', '#F97316', '#3B82F6']

export function CategoryChart() {
  const { data } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })

  const chartData = data?.categories.map((c) => ({
    name: c.category,
    value: parseFloat(String(c.total)),
  })) ?? []

  if (chartData.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-on-surface-muted">
        No expense data this period
      </p>
    )
  }

  return (
    <GlassPanel depth="elevated" parallax className="p-8">
      <h2 className="mb-6 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">
        Resource Allocation
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            strokeWidth={0}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.75} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.92)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
              borderRadius: '12px',
              boxShadow: '0 12px 32px -8px rgba(0, 104, 122, 0.06)',
              color: '#1A1C1C',
              fontSize: '13px',
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassPanel>
  )
}
