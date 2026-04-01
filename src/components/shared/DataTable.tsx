import { cn } from '@/lib/utils'

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
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 text-left font-medium text-zinc-400', col.className)}
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
              <tr
                key={String(r[keyField] ?? i)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-zinc-800/50 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-zinc-900/50',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-zinc-300', col.className)}>
                    {col.render ? col.render(row) : String(r[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            )
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
