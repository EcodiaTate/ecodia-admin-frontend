import { create } from 'zustand'

/**
 * Focus context store — tracks whether a detail view is active.
 *
 * When focused:
 *   - Aurora tightens (dominant orb centers, others fade 50%)
 *   - Parallax flattens (depth multiplier 0.6)
 *   - Ambient particles slow (duration doubles)
 *
 * Pages call setFocused(true) when entering a detail view
 * and setFocused(false) when returning to the list.
 */
interface FocusStore {
  focused: boolean
  setFocused: (v: boolean) => void
}

export const useFocusStore = create<FocusStore>((set) => ({
  focused: false,
  setFocused: (focused) => set({ focused }),
}))
