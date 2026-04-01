import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full bg-primary-container/10 animate-pulse-glow" />
        <div className="absolute inset-1 animate-spin rounded-full border-2 border-surface-container border-t-primary" />
      </div>
    </div>
  )
}
