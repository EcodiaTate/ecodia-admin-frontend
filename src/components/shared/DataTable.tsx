import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  keyField?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T = any>({
  columns,
  data,
  onRowClick,
  keyField = 'id',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-3 text-left font-medium uppercase tracking-[0.05em] text-label-md text-on-surface-muted',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const r = row as Record<string, unknown>
            return (
              <motion.tr
                key={String(r[keyField] ?? i)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-surface-container-low/40',
                  onRowClick && 'cursor-pointer hover:bg-surface-container/60',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-4 text-on-surface-variant', col.className)}>
                    {col.render ? col.render(row) : String(r[col.key] ?? '')}
                  </td>
                ))}
              </motion.tr>
            )
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center text-on-surface-muted">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
