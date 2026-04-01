# Ecodia OS — Frontend Design & Engineering Bible

You are building **Ecodia OS**: a spatial, autonomous command center for Ecodia Pty Ltd. This is not a dashboard — it is a **digital environment**. A sunlit sanctuary. A place where information floats in calm, organic stillness, and every pixel earns its place through restraint.

**Reference Material:** The `examples/` directory contains the canonical visual targets. Every screen you build must feel like it belongs alongside them. Study the screenshots — they are the law.

---

## 1. Creative North Star: "The Translucent Sanctuary"

The interface must feel like standing inside a prism at golden hour. 90% negative space. No visual clutter. Every element exists in a state of serene suspension — floating glass panes on a luminous, breathing canvas.

**The Three Commandments:**
1. **If it feels busy, remove things.** Then double the padding on what remains.
2. **If it feels flat, add atmosphere.** Aurora gradients, glass refraction, tonal layering — not borders or shadows.
3. **If it feels generic, reject it.** This is not a SaaS template. It is a spatial art installation that happens to run a business.

---

## 2. Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Routing | react-router-dom v6 (nested routes via `<AppShell />`) |
| State | Zustand (stores in `src/store/`) |
| Server State | TanStack React Query v5 |
| Styling | Tailwind CSS 3.4 + custom design tokens |
| Motion | Framer Motion (spring physics only — never linear easing) |
| Icons | lucide-react |
| Primitives | Radix UI (Dialog, Dropdown, Select, Tabs, Tooltip, Slot) |
| Charts | Recharts (styled to match glass aesthetic) |
| Utilities | clsx, tailwind-merge, class-variance-authority, date-fns |
| Terminal | @xterm/xterm (Claude Code sessions) |
| DnD | @dnd-kit (Pipeline board) |
| HTTP | Axios via `src/api/client.ts` |
| Realtime | WebSocket via `src/hooks/useWebSocket.ts` |
| Build | Vite 5, deployed on Vercel |

### File Organization
```
src/
  api/           # Typed API clients (one per domain: finance, crm, gmail, linkedin, claudeCode)
  components/
    layout/      # AppShell, Sidebar, TopBar — the spatial frame
    shared/      # DataTable, ConfirmDialog, LoadingSpinner, StatusBadge
  hooks/         # useWebSocket, useNotifications, useCCSession
  pages/         # Route-level views, co-located sub-components
    Dashboard/   # KPICards, ActivityFeed
    Finance/     # TransactionList, CategoryChart, ReconcilePanel
    Gmail/       # EmailList, EmailDetail, DraftReview
    LinkedIn/    # DMList, PostList, PostComposer, ContentCalendar, AnalyticsSummary, ConnectionRequests, DMDetail, LinkedInSettings
    CRM/         # ClientCard, Pipeline, ProjectDetail
    ClaudeCode/  # Terminal, SessionList
    Settings/
  store/         # Zustand stores (authStore, ccSessionStore, notificationStore)
  types/         # TypeScript interfaces per domain
  lib/           # utils.ts (cn helper, etc.)
```

---

## 3. Color System: Chromatic Atmosphere

Colors behave like light through glass — they are washes, not fills. Never flat, never solid.

### Surface Hierarchy (Tonal Stacking)
| Token | Hex | Usage |
|---|---|---|
| `surface` | `#F9F9F9` | Global canvas base. The "air" of the interface. |
| `surface-container-low` | `#F0F4F7` | Large content regions, inset areas |
| `surface-container` | `#E8EDF1` | Secondary containers, hover states |
| `surface-container-high` | `#E1E9EE` | Elevated interactive elements |
| `surface-container-lowest` | `#FFFFFF` | Floating cards, glass panes — the "lifted paper" |

### Text
| Token | Hex | Usage |
|---|---|---|
| `on-surface` | `#1A1C1C` | Primary text, headings, hero data |
| `on-surface-variant` | `#3D494C` | Body copy, descriptions |
| `on-surface-muted` | `#64748B` | Metadata, timestamps, secondary labels |

### Prismatic Accents (Use Sparingly)
| Token | Hex | Usage |
|---|---|---|
| `primary` | `#00687A` | Primary actions, active nav, focus rings |
| `primary-container` | `#06B6D4` | CTA gradients (secondary stop), links |
| `secondary` / Bioluminescent Green | `#10B981` | Success, connected, health, growth |
| `tertiary` / Sunlight Amber | `#F59E0B` | Warnings, attention, pending, in-progress |
| `error` | `#DC2626` | Errors, destructive actions, disconnected |

### Absolute Prohibitions
- **NEVER** use `#FFFFFF` as a background fill (only in `surface-container-lowest` glass cards)
- **NEVER** use `#000000` anywhere — deepest text is `#1A1C1C`
- **NEVER** use dark mode, dark themes, `zinc-950`, `zinc-900`, `zinc-800`, or any dark slate backgrounds
- **NEVER** use saturated background fills — accents are for text, icons, and data viz only

### The Aurora Canvas
The base `surface` layer should feature subtle, ambient gradient washes — ethereal aurora-like color fields using the prismatic accents at extremely low opacity (2-5%). These shift gently across the viewport. Reference: every `ambient_aurora` example. Implement with CSS radial gradients or a lightweight canvas shader.

---

## 4. The "No-Line" Rule

**1px solid borders are prohibited.** Structural boundaries are defined through:

1. **Tonal Shifts** — Place `surface-container-low` against `surface`. The eye finds the edge naturally.
2. **Natural Voids** — Use spacing scale (`gap-14` to `gap-20`) to create separation through emptiness.
3. **Glass Refraction** — `backdrop-blur` implies a container edge without drawing one.

**The one exception:** If accessibility absolutely demands a visible container edge, use `outline-variant` (#A9B4B9) at **15% opacity** — a "ghost border" that is felt, not seen.

---

## 5. Glassmorphism: "Optic Glass" Specification

All floating panels, cards, modals, and overlays must use the Optic Glass treatment:

```css
/* Standard Glass Card */
background: rgba(255, 255, 255, 0.45);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.6);
border-bottom-color: rgba(0, 0, 0, 0.04);
border-right-color: rgba(0, 0, 0, 0.04);
box-shadow: 0 20px 50px -12px rgba(0, 104, 122, 0.04);
border-radius: 1.5rem;  /* xl */

/* Elevated Glass (modals, floating nav) */
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(24px);
box-shadow: 0 32px 64px -16px rgba(0, 104, 122, 0.06);
```

**Key rules:**
- Shadow color is always tinted with `primary` (0, 104, 122) — never pure black
- Shadow blur is always `40px+` with `4-6%` opacity — atmospheric, not Material
- Top/left borders are brighter (light catch), bottom/right are darker (depth)
- Internal card padding is minimum `p-7` (1.75rem), ideally `p-10` (2.5rem)

---

## 6. Typography: Editorial Scale

### Fonts
| Role | Font | Weight |
|---|---|---|
| Display / Headings | **Space Grotesk** or **Outfit** | 300-500 |
| Body / UI | **Inter** | 400-500 |
| System / Data / Code | **JetBrains Mono** or **Geist Mono** | 300-400 |

### Scale & Rhythm
| Style | Size | Tracking | Usage |
|---|---|---|---|
| `display-lg` | 3.5rem (56px) | +2% to +4% | Hero data — total balance, primary KPI. Treat like an art installation. |
| `display-md` | 2.5rem (40px) | +2% | Page titles — "Financial Ecosystem", "Autonomy Core" |
| `headline-md` | 1.75rem (28px) | normal | Section anchors, card titles |
| `body-lg` | 1rem (16px) | normal | Primary body text. Line-height: 1.6+ |
| `label-md` | 0.75rem (12px) | +5%, uppercase | Metadata, category labels, timestamps |
| `label-sm` | 0.6875rem (11px) | +5%, uppercase | Fine metadata, status indicators |

### Critical Typography Rules
- **Hero data** (the big number) must be isolated — `mb-14` to `mb-20` below the heading, with nothing competing for attention
- **Headings** use mixed-weight styling: "Relational *Entropy*", "Financial **Ecosystem**" — one word in italic or bold to add editorial elegance
- **Labels** are always uppercase, always muted (`on-surface-muted`), always tracked wide
- **Monospace** for all system output: terminal logs, API responses, financial IDs, node identifiers, timestamps with seconds
- **Never center long text.** Left-aligned, ragged right, max 60 characters per line
- **One story per screen.** If you're adding a second "hero" element, you've gone too far

---

## 7. Layout Philosophy: Spatial Curation

### The 90% Negative Space Mandate
Treat every screen like a gallery wall. The content is the art; the space is the frame. If a layout feels comfortable, it's probably too dense.

### Spacing Scale
| Token | Value | Usage |
|---|---|---|
| `spacing-4` | 1.4rem | Component internal padding |
| `spacing-6` | 2rem | Button horizontal padding, field gaps |
| `spacing-8` | 2.75rem | Card internal padding (minimum) |
| `spacing-10` | 3.5rem | Vertical voids between headline and body |
| `spacing-12` | 4rem | Visual divider replacement |
| `spacing-16` | 5.5rem | Between distinct functional groups |
| `spacing-20` | 7rem | Outer page margins (desktop minimum) |
| `spacing-24` | 8.5rem | Extreme editorial gutters |

### Layout Patterns
- **Intentional Asymmetry:** A headline far-left, a small metric far-right. Let the eye wander across the void. See: Finance flow, Autonomy Core.
- **Unboxed Data:** Let typography and alignment create structure — don't draw containers around everything. Data floats on the canvas.
- **Vertical Primacy:** Prioritize vertical scroll with generous gaps over horizontal density. Each element has "room to breathe and time to be seen."
- **Focal Hierarchy:** Only ONE element per viewport should demand attention (via color, scale, or motion). Everything else whispers.
- **Center-Aligned Hero, Left-Aligned Detail:** Main KPIs and page titles can center for impact. Supporting content aligns left.

---

## 8. Navigation: The Whisper Sidebar

The sidebar (see reference screenshots) is a **narrow icon rail** — not a full-width nav panel. It should feel like it's part of the wall, not a separate UI component.

**Specifications:**
- Narrow rail width: `w-14` to `w-16` (icons only, no text labels by default)
- Background: `surface-container-low` or glass treatment — **never dark**
- Icons: Muted (`on-surface-muted`), active state uses `primary` with a soft glow
- Tooltip on hover reveals the label (Radix Tooltip)
- No explicit dividers between nav items — spacing creates separation
- The "ECODIA" or "ECODIA OS" wordmark sits at the top in wide-tracked uppercase `label-md`

**Top bar** uses the same glass treatment — transparent, floating above the content with `backdrop-blur`. Contains: navigation tabs (text links, not buttons), search icon, notification bell, user avatar.

---

## 9. Motion & Interaction: Spring Physics

All animation uses **Framer Motion with spring physics**. No linear easing. No CSS `transition: all 0.3s ease`. Ever.

### Motion Tokens
```tsx
// Gentle entrance — cards, panels
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring', stiffness: 200, damping: 24 }
}

// Glass hover — lift and clarify
const glassHover = {
  whileHover: {
    y: -2,
    background: 'rgba(255, 255, 255, 0.55)',
    boxShadow: '0 24px 56px -14px rgba(0, 104, 122, 0.06)',
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
}

// Layout transitions — sidebar expand, panel resize
const layoutSpring = { type: 'spring', stiffness: 180, damping: 22 }
```

### Interaction Principles
- **Hover:** Gently increases glass clarity and subtly lifts the element (-2px Y)
- **Focus:** Soft `primary` glow ring, never a hard outline
- **Page transitions:** Content fades up with staggered children (50ms delay between items)
- **Data updates:** Numbers animate with spring counters, never snap
- **Loading:** Use the "Aurora Pulse" — a soft, breathing glow in `primary-container` at 10% opacity. Never a spinner unless absolutely necessary (use `LoadingSpinner` only as fallback)

---

## 10. Component Specifications

### Buttons
| Variant | Style |
|---|---|
| **Primary** | Gradient `primary` → `primary-container` at 135deg. `rounded-2xl`. No border. `px-8 py-3`. Text: white. |
| **Secondary** | `surface-container-high` background. `rounded-2xl`. No border. Text: `on-surface`. |
| **Ghost** | No background. Text: `on-surface-variant`. Hover: `surface-container-low` fill. |
| **Destructive** | Soft red glass. `error` text. Ghost style until hover, then soft red fill. |

### Cards
- **NEVER** have visible borders
- Background: `surface-container-lowest` (glass treatment) against `surface` canvas
- Roundedness: `rounded-2xl` (1.5rem) minimum, `rounded-3xl` (1.75rem) preferred
- Internal padding: `p-8` minimum, `p-10` preferred
- Separation between cards: `gap-8` minimum

### Input Fields
- Forgo the "box" — use `surface-container-low` background with `rounded-xl`
- Focus state: background shifts to `surface-container-lowest`, soft `primary` glow (not a border)
- A tiny 4px dot in `primary` next to the label indicates the active field
- No heavy outlines, no 2px focus rings

### Data Tables
- No row borders — separate rows with `py-5` spacing
- Alternate rows: `surface` / `surface-container-low` (barely perceptible)
- Header text: `label-md` uppercase, muted
- Hover: row background shifts to glass treatment

### Status Badges / Pills
- `rounded-full` always
- Background: accent color at 10% opacity
- Text: accent color at full
- Small scale: `text-xs px-3 py-1`
- Status labels: "Connected" (green), "Pending" (amber), "Error" (red), "Active" (cyan)

### Charts (Recharts)
- **No axis lines.** Remove them entirely.
- Grid lines: `surface-container` color only, dashed, 50% opacity
- Data fills: prismatic accents at 30-40% opacity — charts should "glow from within"
- Tooltips: glass treatment
- Labels: `label-sm` monospace
- Animate with spring physics on mount

### The "Aurora Pulse" (Signature Component)
A status indicator where a `tertiary-container` (amber) or `secondary-container` (green) glow sits behind a translucent glass pane. Use for high-priority alerts, health indicators, and ecosystem status. The glow breathes with a slow CSS animation (4s cycle).

---

## 11. Page-Specific Design Intent

Study these reference screenshots in `examples/` — they define the target:

| Page | Reference | Key Design Notes |
|---|---|---|
| **Dashboard** | `minimal_dashboard/`, `ecodia_atmospheric_vitals/` | One massive hero KPI dominates. Supporting metrics float in periphery. Aurora background prominent. "Atmospheric Integrity" vibe. |
| **Finance** | `ecodia_finance_flow_ambient_aurora/` | Hero: `$1.42M` display-lg. Floating bubble metrics. Transaction ledger below as unboxed list. Asset allocation as glowing bars. |
| **Gmail** | `serene_email_center/` | Split layout: email list (left), email detail (right). "Digital Curator" naming. Glass card for each email. Reading pane is expansive, editorial. |
| **LinkedIn** | `linkedin_intelligence/` | Tab navigation (DMs, Posts, Calendar, Connections, Analytics, Settings). DM view is messaging-app-style with glass bubbles. "Influence" score orb. |
| **CRM** | `crm_pipeline_ambient_aurora/` | Pipeline as floating glass cards in columns (Lead, Proposal, Contract). Project detail below with hero project name and value. |
| **Claude Code** | `ecodia_autonomy_core_ambient_aurora/`, `ecodia_autonomy_core/` | "Autonomy Core" branding. Terminal output in monospace on glass. Network health metrics. Session list as "Recent Decisions." |
| **Settings** | `ecodia_settings_ambient_aurora/` | "System Nodes" — each integration (Xero, Gmail) as a glass card with connection status orb. |
| **Notifications** | `ecodia_notifications_ambient_aurora/` | "System Pulsations" — timeline layout, no boxes, events float with timestamps. |
| **Tasks** | `ecodia_tasks_ambient_aurora/` | "Current Intentions" — minimal checklist, generous spacing, status pills. |
| **Knowledge Graph** | `ecodia_knowledge_graph_ambient_aurora/` | Floating node visualization. "Trending Node" sidebar. "12,402 Active Nodes" hero stat. |
| **Archive** | `ecodia_the_archive/` | Editorial card layout. Historical entries as curated artifacts. Dark sphere centerpiece. |
| **Causal Network** | `ecodia_causal_network/` | "Relational Entropy" — neural network visualization, topology health metric, glass overlay controls. |

---

## 12. Naming & Copy: The Ecodia Voice

Ecodia OS uses evocative, environmental language for system concepts. This is not decorative — it is the product identity.

| Standard Term | Ecodia Term |
|---|---|
| Dashboard | **Atmospheric Vitals** or **Ecosystem Overview** |
| Notifications | **System Pulsations** |
| Tasks / Todos | **Current Intentions** |
| Settings | **System Nodes** |
| Integrations | **Neural Connections** |
| AI / Claude Code | **Autonomy Core** |
| Knowledge Base | **The Archive** |
| Network Graph | **Relational Entropy** or **Causal Network** |
| Health / Status | **Ecosystem Health** |
| User Activity | **Ambient Flux** |
| Pipeline | **Flow State** |

**Copy tone:** Plain, concise, quietly confident. No hype, no reassurance, no exclamation marks. Just state what it is. "Deploying ambient logic structures across the Ecodia decentralized network." See [feedback_ecodia_tone.md](../../.claude/projects/d---code/memory/feedback_ecodia_tone.md).

---

## 13. Responsive Behavior

- **Desktop-first.** This is a command center — the primary context is a large screen.
- **1440px+:** Full spatial layout with maximum breathing room. Outer margins `spacing-20`+.
- **1024px-1440px:** Sidebar collapses to icon rail. Content margins reduce to `spacing-12`.
- **768px-1024px:** Single-column layout. Cards stack vertically. Hero data scales down to `display-md`.
- **Below 768px:** Not a primary concern, but should remain usable. Sidebar becomes a bottom tab bar or hamburger overlay (glass treatment).

---

## 14. Accessibility & Performance

### Accessibility
- All interactive elements must be keyboard-navigable
- Focus indicators: soft `primary` glow (not a hard outline — but visible)
- Color contrast: `on-surface` on `surface` must meet WCAG AA (it does: #1A1C1C on #F9F9F9 = 15.3:1)
- All icons paired with `aria-label` or visible text
- Glass effects must not prevent text readability — test at 0.45 opacity minimum
- Reduced motion: respect `prefers-reduced-motion` — disable spring animations, use instant transitions

### Performance
- `backdrop-filter` is GPU-intensive — limit to ~5 glass layers visible simultaneously
- Aurora gradients: CSS only (no JS animation loops), or a single lightweight canvas
- Lazy-load route-level pages with React.lazy + Suspense
- React Query handles cache/stale/refetch — no manual polling unless WebSocket isn't available
- Images: use WebP/AVIF, lazy-load below fold
- Bundle: keep under 300KB gzipped (excluding node_modules)

---

## 15. Anti-Patterns: What to Reject

| If you catch yourself doing this... | Do this instead... |
|---|---|
| Adding a `border` or `divide-y` | Use tonal shifts or spacing voids |
| Using `bg-zinc-950` or any dark background | Use `surface` (#F9F9F9) with aurora washes |
| Using `shadow-md` or `shadow-lg` | Use atmospheric shadows (40px+ blur, 4% opacity, primary-tinted) |
| Centering everything | Use intentional asymmetry — offset placement |
| Adding a second hero element | Remove it. One story per screen. |
| Using `ease-in-out` or `transition-all` | Use Framer Motion spring physics |
| Writing "Welcome back!" or "Let's get started!" | Write nothing, or write plainly: "Atmospheric Integrity: 98.4%" |
| Building a generic dashboard grid | Build a spatial environment with floating glass panes |
| Using `rounded-md` | Use `rounded-2xl` or `rounded-3xl` — organic, never sharp |
| Using `#FFFFFF` as a page background | Use `#F9F9F9` with aurora washes |
| Using `#000000` for text | Use `#1A1C1C` (Deep Slate) |
| Putting data in dense tables | Float key metrics, use editorial layouts, one stat per breath |

---

## 16. Development Workflow

- **Vite dev server:** `npm run dev`
- **Type-check + build:** `npm run build` (runs `tsc -b && vite build`)
- **API base:** Configured in `src/api/client.ts` — Axios instance with auth interceptor
- **Auth:** JWT in Zustand `authStore`, route guard via `<ProtectedRoute />`
- **WebSocket:** Auto-connected in `AppShell` via `useWebSocket` hook — handles real-time notifications
- **New pages:** Add route in `App.tsx`, create page directory in `src/pages/`, co-locate sub-components
- **New API domain:** Create `src/api/{domain}.ts` + `src/types/{domain}.ts`, wire into React Query hooks in the page

---

*The interface should feel like the future remembered as a dream — luminous, spacious, and profoundly calm. Build environments, not dashboards.*
