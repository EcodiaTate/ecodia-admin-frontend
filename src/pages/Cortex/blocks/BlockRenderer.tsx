import type { CortexBlock } from '@/types/cortex'
import { TextBlock } from './TextBlock'
import { ActionCard } from './ActionCard'
import { EmailCard } from './EmailCard'
import { TaskCard } from './TaskCard'
import { StatusUpdate } from './StatusUpdate'
import { InsightBlock } from './InsightBlock'
import { CCSessionBlock } from './CCSessionBlock'

export function BlockRenderer({ block }: { block: CortexBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} />
    case 'action_card':
      return <ActionCard block={block} />
    case 'email_card':
      return <EmailCard block={block} />
    case 'task_card':
      return <TaskCard block={block} />
    case 'status_update':
      return <StatusUpdate block={block} />
    case 'insight':
      return <InsightBlock block={block} />
    case 'cc_session':
      return <CCSessionBlock block={block} />
    default:
      return null
  }
}
