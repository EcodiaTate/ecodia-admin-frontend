import { Component, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  sceneName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Route-level error boundary with ambient glass treatment.
 * Catches render errors in page components without crashing
 * the entire shell (aurora, nav, constellation continue running).
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="mx-auto flex max-w-md flex-col items-center pt-[20vh]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary/10">
            <AlertTriangle className="h-5 w-5 text-tertiary" strokeWidth={1.75} />
          </div>
          <p className="mt-6 text-center font-display text-sm font-medium text-on-surface">
            {this.props.sceneName ?? 'This scene'} encountered an error
          </p>
          <p className="mt-2 text-center font-mono text-[10px] text-on-surface-muted/40 max-w-sm">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-8 rounded-2xl bg-white/40 px-6 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-white/55"
          >
            Try again
          </button>
        </motion.div>
      )
    }

    return this.props.children
  }
}
