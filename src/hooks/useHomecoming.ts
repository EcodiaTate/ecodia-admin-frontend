/**
 * Homecoming — Return After Absence
 *
 * Detects >30min absence via localStorage timestamp.
 * On return: drift state → 10-15s wake sequence with scene whispers.
 *
 * Drift state: aurora at lowest, particles at edges, constellation dim.
 * Wake: whispers replay (max 3-4 significant events, one every 3s),
 *        aurora starts warm, cools to normal over 15s,
 *        constellation does a single expansion pulse.
 *
 * Immediate interaction accelerates wake to 3s.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const ABSENCE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes
const WAKE_DURATION_MS = 15_000
const FAST_WAKE_MS = 3_000
const WHISPER_INTERVAL_MS = 3_000
const LS_KEY = 'ecodia:last-active'

export interface SceneWhisper {
  scene: string
  text: string
  priority: number // higher = more important
}

export interface HomecomingState {
  /** Whether the system is in drift/waking state */
  isDrifting: boolean
  /** 0 = full drift, 1 = fully awake */
  wakeProgress: number
  /** Scene whispers to display during wake */
  whispers: SceneWhisper[]
  /** Index of currently visible whisper (-1 = none yet) */
  activeWhisperIndex: number
}

/** Collect significant events that happened while away */
function collectWhispers(): SceneWhisper[] {
  const whispers: SceneWhisper[] = []

  // Check for factory completions via stored session count
  const factoryEvents = sessionStorage.getItem('ecodia:factory-events-while-away')
  if (factoryEvents) {
    try {
      const count = JSON.parse(factoryEvents)
      if (count > 0) {
        whispers.push({
          scene: 'codebase',
          text: `factory — ${count} session${count > 1 ? 's' : ''} complete`,
          priority: 8,
        })
      }
    } catch { /* skip */ }
    sessionStorage.removeItem('ecodia:factory-events-while-away')
  }

  // Check for pending actions
  const pendingActions = sessionStorage.getItem('ecodia:pending-actions-while-away')
  if (pendingActions) {
    try {
      const count = JSON.parse(pendingActions)
      if (count > 0) {
        whispers.push({
          scene: 'dashboard',
          text: `actions — ${count} need${count > 1 ? '' : 's'} your attention`,
          priority: 7,
        })
      }
    } catch { /* skip */ }
    sessionStorage.removeItem('ecodia:pending-actions-while-away')
  }

  // Sort by priority descending — show all significant events from absence
  return whispers.sort((a, b) => b.priority - a.priority)
}

export function useHomecoming(): HomecomingState {
  const [state, setState] = useState<HomecomingState>({
    isDrifting: false,
    wakeProgress: 1,
    whispers: [],
    activeWhisperIndex: -1,
  })

  const wakeStartRef = useRef(0)
  const wakeDurationRef = useRef(WAKE_DURATION_MS)
  const rafRef = useRef(0)

  // Track activity for absence detection
  useEffect(() => {
    const mark = () => localStorage.setItem(LS_KEY, String(Date.now()))
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }))
    mark() // mark on mount

    return () => {
      events.forEach((e) => window.removeEventListener(e, mark))
      mark() // mark on unmount
    }
  }, [])

  // Track events that arrive while user may be away (WS events increment counters)
  useEffect(() => {
    const onFactory = () => {
      const current = parseInt(sessionStorage.getItem('ecodia:factory-events-while-away') || '0')
      sessionStorage.setItem('ecodia:factory-events-while-away', String(current + 1))
    }
    const onAction = () => {
      const current = parseInt(sessionStorage.getItem('ecodia:pending-actions-while-away') || '0')
      sessionStorage.setItem('ecodia:pending-actions-while-away', String(current + 1))
    }

    window.addEventListener('ecodia:cc-session-complete', onFactory)
    window.addEventListener('ecodia:action-queue-update', onAction)

    return () => {
      window.removeEventListener('ecodia:cc-session-complete', onFactory)
      window.removeEventListener('ecodia:action-queue-update', onAction)
    }
  }, [])

  // On mount: check if we've been away
  useEffect(() => {
    const lastActive = parseInt(localStorage.getItem(LS_KEY) || '0')
    const elapsed = Date.now() - lastActive

    if (elapsed > ABSENCE_THRESHOLD_MS && lastActive > 0) {
      const whispers = collectWhispers()
      setState({
        isDrifting: true,
        wakeProgress: 0,
        whispers,
        activeWhisperIndex: -1,
      })
      wakeStartRef.current = Date.now()
      wakeDurationRef.current = WAKE_DURATION_MS

      // Dispatch drift start event for aurora warm shift
      window.dispatchEvent(new CustomEvent('ecodia:homecoming-drift', { detail: { phase: 'start' } }))
    }
  }, [])

  // Accelerate wake on interaction
  const accelerateWake = useCallback(() => {
    if (!state.isDrifting) return
    wakeDurationRef.current = FAST_WAKE_MS
    wakeStartRef.current = Date.now() - (state.wakeProgress * FAST_WAKE_MS)
  }, [state.isDrifting, state.wakeProgress])

  useEffect(() => {
    if (!state.isDrifting) return
    const events = ['mousedown', 'keydown', 'touchstart']
    events.forEach((e) => window.addEventListener(e, accelerateWake, { once: true, passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, accelerateWake))
  }, [state.isDrifting, accelerateWake])

  // Wake animation loop
  useEffect(() => {
    if (!state.isDrifting) return

    const tick = () => {
      const elapsed = Date.now() - wakeStartRef.current
      const progress = Math.min(1, elapsed / wakeDurationRef.current)

      // Advance whispers: one every 3s
      const whisperIdx = Math.min(
        state.whispers.length - 1,
        Math.floor(elapsed / WHISPER_INTERVAL_MS),
      )

      setState((prev) => ({
        ...prev,
        wakeProgress: progress,
        activeWhisperIndex: whisperIdx,
        isDrifting: progress < 1,
      }))

      if (progress >= 1) {
        window.dispatchEvent(new CustomEvent('ecodia:homecoming-drift', { detail: { phase: 'end' } }))
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state.isDrifting, state.whispers.length])

  return state
}
