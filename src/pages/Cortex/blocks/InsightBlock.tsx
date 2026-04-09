import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownLink } from '@/components/shared/MarkdownLink'
import type { InsightBlock as InsightBlockType } from '@/types/cortex'

const URGENCY_BG = {
  low: 'bg-primary/4',
  medium: 'bg-tertiary/6',
  high: 'bg-error/6',
}

const URGENCY_ICON = {
  low: 'text-primary/50',
  medium: 'text-tertiary/70',
  high: 'text-error/70',
}

export function InsightBlock({ block }: { block: InsightBlockType }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${URGENCY_BG[block.urgency]}`}
    >
      <Lightbulb className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${URGENCY_ICON[block.urgency]}`} strokeWidth={1.75} />
      <div className="text-xs leading-relaxed text-on-surface-variant
        [&_p]:my-0 [&_p+p]:mt-2
        [&_strong]:text-on-surface [&_strong]:font-medium
        [&_code]:bg-black/20 [&_code]:px-1 [&_code]:rounded [&_code]:font-mono
        [&_ul]:pl-4 [&_ul]:my-1 [&_li]:my-0.5">
        <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={(url) => url} components={{ a: MarkdownLink }}>{block.message}</ReactMarkdown>
      </div>
    </motion.div>
  )
}
