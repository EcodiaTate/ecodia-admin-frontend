import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { TextBlock as TextBlockType } from '@/types/cortex'

export function TextBlock({ block }: { block: TextBlockType }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-on-surface-variant
      [&_p]:leading-[1.8] [&_p]:my-0 [&_p+p]:mt-3
      [&_ul]:my-2 [&_ul]:pl-5 [&_li]:my-0.5
      [&_ol]:my-2 [&_ol]:pl-5
      [&_strong]:text-on-surface [&_strong]:font-medium
      [&_em]:text-on-surface-variant
      [&_code]:bg-surface-container [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-primary
      [&_pre]:bg-surface-container [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0
      [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:text-on-surface-muted
      [&_h1]:text-base [&_h1]:font-medium [&_h1]:text-on-surface [&_h1]:mt-4 [&_h1]:mb-2
      [&_h2]:text-sm [&_h2]:font-medium [&_h2]:text-on-surface [&_h2]:mt-3 [&_h2]:mb-1.5
      [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-on-surface/80 [&_h3]:mt-2 [&_h3]:mb-1
      [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 hover:[&_a]:decoration-primary
      [&_hr]:border-surface-border [&_hr]:my-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
    </div>
  )
}
