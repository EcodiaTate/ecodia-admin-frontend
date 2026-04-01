import type { TextBlock as TextBlockType } from '@/types/cortex'

export function TextBlock({ block }: { block: TextBlockType }) {
  return (
    <div className="text-sm leading-[1.8] text-on-surface-variant">
      {block.content.split('\n\n').map((para, i) => (
        <p key={i} className={i > 0 ? 'mt-3' : ''}>
          {para}
        </p>
      ))}
    </div>
  )
}
