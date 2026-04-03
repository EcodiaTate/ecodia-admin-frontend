/**
 * Activity Distillation Engine
 *
 * Parses NDJSON stream output from Claude Code sessions and distills
 * it into a single evolving narrative sentence per pipeline stage.
 * Raw tool calls, JSON, file reads are never shown directly.
 *
 * Distillation rules keyed by pipeline stage:
 *   context    → "Reading N files across src/..."
 *   executing  → "Writing corridor scoring logic" / "Editing 3 files"
 *   testing    → "14 passed, 2 failing"
 *   reviewing  → "Reviewing 5 changed files"
 *   deploying  → "Deploying to staging"
 */

export interface DistilledState {
  /** Single evolving narrative sentence */
  narrative: string
  /** Structured activity log entries (for expand-on-interest) */
  activities: ActivityEntry[]
  /** 60-segment histogram of output density (pulse line) */
  pulseHistogram: number[]
  /** Tool usage count */
  toolCount: number
  /** Files read */
  filesRead: string[]
  /** Files edited */
  filesEdited: string[]
  /** Test results */
  testsPassed: number
  testsFailed: number
  /** Total cost so far */
  costUsd: number | null
  /** Error message if any */
  error: string | null
}

export interface ActivityEntry {
  kind: 'read' | 'edit' | 'bash' | 'thought' | 'test' | 'error' | 'cost' | 'tool'
  content: string
  timestamp: number
}

const PULSE_SEGMENTS = 60

function extractJsonObjects(raw: string): unknown[] {
  const objects: unknown[] = []
  let depth = 0, start = -1
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '{') { if (depth === 0) start = i; depth++ }
    else if (raw[i] === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try { objects.push(JSON.parse(raw.slice(start, i + 1))) } catch { /* skip */ }
        start = -1
      }
    }
  }
  return objects
}

export function distillOutput(
  chunks: string[],
  stage: string | null,
): DistilledState {
  const state: DistilledState = {
    narrative: '',
    activities: [],
    pulseHistogram: new Array(PULSE_SEGMENTS).fill(0),
    toolCount: 0,
    filesRead: [],
    filesEdited: [],
    testsPassed: 0,
    testsFailed: 0,
    costUsd: null,
    error: null,
  }

  if (chunks.length === 0) {
    state.narrative = stage === 'queued' ? 'Waiting...' : 'Starting...'
    return state
  }

  const raw = chunks.join('')
  const objects = extractJsonObjects(raw)
  const now = Date.now()

  // Build pulse histogram from chunk arrival times
  // (approximate: distribute evenly across segments)
  const segSize = Math.max(1, Math.ceil(chunks.length / PULSE_SEGMENTS))
  for (let i = 0; i < chunks.length; i++) {
    const seg = Math.min(PULSE_SEGMENTS - 1, Math.floor(i / segSize))
    state.pulseHistogram[seg] += chunks[i].length
  }
  // Normalize
  const maxPulse = Math.max(1, ...state.pulseHistogram)
  state.pulseHistogram = state.pulseHistogram.map(v => v / maxPulse)

  if (objects.length > 0) {
    for (const obj of objects) {
      const msg = obj as Record<string, unknown>
      if (msg.type === 'system' || msg.type === 'rate_limit_event') continue

      if (msg.type === 'assistant') {
        const message = msg.message as Record<string, unknown> | undefined
        if (message?.content) {
          for (const block of message.content as Array<Record<string, unknown>>) {
            if (block.type === 'text' && typeof block.text === 'string') {
              const text = block.text.trim()
              if (text) {
                state.activities.push({ kind: 'thought', content: text.slice(0, 200), timestamp: now })
              }
            } else if (block.type === 'tool_use') {
              state.toolCount++
              const name = String(block.name || 'tool')
              const input = block.input as Record<string, unknown> | undefined

              if (name === 'Read' || name === 'read') {
                const path = String(input?.file_path || input?.path || '')
                if (path) state.filesRead.push(path)
                state.activities.push({ kind: 'read', content: shortenPath(path), timestamp: now })
              } else if (name === 'Edit' || name === 'edit') {
                const path = String(input?.file_path || input?.path || '')
                if (path) state.filesEdited.push(path)
                const added = String(input?.new_string || '').split('\n').length
                const removed = String(input?.old_string || '').split('\n').length
                state.activities.push({ kind: 'edit', content: `${shortenPath(path)} (+${added} -${removed})`, timestamp: now })
              } else if (name === 'Write' || name === 'write') {
                const path = String(input?.file_path || input?.path || '')
                if (path) state.filesEdited.push(path)
                state.activities.push({ kind: 'edit', content: `${shortenPath(path)} (new)`, timestamp: now })
              } else if (name === 'Bash' || name === 'bash') {
                const cmd = String(input?.command || '').slice(0, 80)
                state.activities.push({ kind: 'bash', content: cmd, timestamp: now })
                // Check for test results
                const cmdLower = cmd.toLowerCase()
                if (cmdLower.includes('test') || cmdLower.includes('jest') || cmdLower.includes('vitest') || cmdLower.includes('pytest')) {
                  state.activities.push({ kind: 'test', content: cmd, timestamp: now })
                }
              } else {
                state.activities.push({ kind: 'tool', content: name, timestamp: now })
              }
            }
          }
        }
      }

      if (msg.type === 'result') {
        if (typeof msg.total_cost_usd === 'number') {
          state.costUsd = msg.total_cost_usd as number
          state.activities.push({ kind: 'cost', content: `$${state.costUsd.toFixed(4)}`, timestamp: now })
        }
        // Parse test results from result text
        const result = typeof msg.result === 'string' ? msg.result : ''
        const testMatch = result.match(/(\d+)\s*passed|(\d+)\s*failed/gi)
        if (testMatch) {
          for (const m of testMatch) {
            const num = parseInt(m)
            if (m.toLowerCase().includes('passed')) state.testsPassed += num
            if (m.toLowerCase().includes('failed')) state.testsFailed += num
          }
        }
      }
    }
  } else {
    // Fallback: plain text
    const stripped = raw.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '')
    for (const line of stripped.split('\n')) {
      const t = line.trim()
      if (!t || /^[\s─═┌┐└┘│├┤┬┴┼]+$/.test(t) || /^\.{3,}$/.test(t)) continue
      if (t.match(/^(Error:|error:|ERR)/)) {
        state.error = t
        state.activities.push({ kind: 'error', content: t, timestamp: now })
      }
    }
  }

  // Build narrative from stage + activity stats
  state.narrative = buildNarrative(state, stage)

  return state
}

function buildNarrative(state: DistilledState, stage: string | null): string {
  const { filesRead, filesEdited, toolCount, testsPassed, testsFailed, error } = state

  if (error) return error.slice(0, 120)

  switch (stage) {
    case 'queued':
      return 'Waiting in queue...'
    case 'context':
      if (filesRead.length > 0) {
        const dirs = uniqueDirs(filesRead)
        return `Reading ${filesRead.length} file${filesRead.length > 1 ? 's' : ''} across ${dirs.join(', ')}`
      }
      return 'Gathering context...'
    case 'executing':
      if (filesEdited.length > 0) {
        return `Editing ${filesEdited.length} file${filesEdited.length > 1 ? 's' : ''} — ${toolCount} tools used`
      }
      if (toolCount > 0) return `Working... ${toolCount} tools used`
      return 'Executing...'
    case 'testing':
      if (testsPassed > 0 || testsFailed > 0) {
        return `${testsPassed} passed, ${testsFailed} failing`
      }
      return 'Running tests...'
    case 'reviewing':
      return `Reviewing ${filesEdited.length || '?'} changed files`
    case 'deploying':
      return 'Deploying...'
    case 'deployed':
    case 'complete':
      return buildCompletionSummary(state)
    case 'failed':
    case 'error':
      return state.error || 'Session failed'
    default:
      if (filesEdited.length > 0) return `Working on ${filesEdited.length} files`
      if (toolCount > 0) return `${toolCount} tools used`
      return 'Working...'
  }
}

function buildCompletionSummary(state: DistilledState): string {
  const parts: string[] = []
  if (state.filesEdited.length > 0) {
    parts.push(`${state.filesEdited.length} files changed`)
  }
  if (state.testsPassed > 0) parts.push(`${state.testsPassed} tests passed`)
  if (state.costUsd != null) parts.push(`$${state.costUsd.toFixed(2)}`)
  return parts.length > 0 ? parts.join(', ') : 'Complete'
}

function shortenPath(path: string): string {
  if (!path) return '?'
  const parts = path.replace(/\\/g, '/').split('/')
  if (parts.length <= 3) return parts.join('/')
  return `.../${parts.slice(-2).join('/')}`
}

function uniqueDirs(paths: string[]): string[] {
  const dirs = new Set<string>()
  for (const p of paths) {
    const parts = p.replace(/\\/g, '/').split('/')
    if (parts.length >= 2) {
      dirs.add(parts.slice(-2, -1)[0])
    }
  }
  return Array.from(dirs).slice(0, 3)
}
