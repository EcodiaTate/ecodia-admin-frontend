import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-elevated w-full max-w-sm rounded-3xl p-8"
          >
            <h3 className="font-display text-lg font-medium text-on-surface">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{message}</p>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-on-surface-muted transition-colors hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-xl bg-error/90 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-error"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
