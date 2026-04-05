import api from './client'

export interface MomentumSummary {
  sessions7d: number
  complete: number
  deployed: number
  successRate: number | null
  filesChanged: number
  commits7d: number
  actionsExecuted7d: number
}

export interface MomentumSession {
  id: string
  status: string
  prompt: string
  confidence: number | null
  stream: string | null
  deployStatus: string | null
  trigger: string | null
  filesChanged: number
  durationSeconds: number
  startedAt: string
  completedAt: string | null
}

export interface TimelinePoint {
  hour: string
  sessions: number
  complete: number
  errors: number
}

export interface StreamStat {
  stream: string
  total: number
  complete: number
  errors: number
  deployed: number
  avg_confidence: number | null
}

export interface MomentumGoal {
  id: number
  title: string
  progress: number
  priority: number
  status: string
  goal_type: string
  created_at: string
}

export interface GitActivity {
  name: string
  commits: number
}

export interface Percept {
  message: string
  stream: string | null
  createdAt: string
}

export interface PM2Process {
  name: string
  status: string
  cpu: number
  memory: number
  restarts: number
  uptime: number
}

export interface SystemHealth {
  ecodiaos: {
    db: boolean
    neo4j: boolean
    memory: { rss: number; heapUsed: number; heapTotal: number; systemFree: number } | null
    cpu: number | null
    eventLoopLagMs: number | null
    activeCCSessions: number
    pm2Processes: PM2Process[]
  }
  organism: {
    healthy: boolean | null
    lastResponseMs: number | null
    consecutiveFailures: number
  }
}

export interface MomentumData {
  summary: MomentumSummary
  sessions: MomentumSession[]
  timeline: TimelinePoint[]
  streams: StreamStat[]
  actions: {
    pending?: number
    urgent?: number
    executed_24h?: number
    dismissed_24h?: number
    executed_7d?: number
  }
  goals: MomentumGoal[]
  gitActivity: GitActivity[]
  percepts: Percept[]
  health: SystemHealth | null
}

export async function getMomentum() {
  const { data } = await api.get<MomentumData>('/momentum')
  return data
}
