# Design System Document: The Ambient Aurora

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Translucent Sanctuary."** 

We are moving away from the "Dashboard" archetype toward a "Digital Environment." This system does not just display information; it hosts it within a serene, spatial atmosphere. By leveraging 90% negative space and high-end editorial layouts, we create a "Whisper-Quiet" experience that feels advanced yet organic. 

Instead of rigid grids, we utilize **intentional asymmetry**. Primary data points should float with expansive breathing room, while secondary elements are tucked into the periphery, allowing the "Aurora" background to dictate the rhythm of the page. This is a rejection of the "boxed-in" web; we are designing light and air.

---

## 2. Colors: Chromatic Atmosphere
Our color philosophy is based on the behavior of light passing through a prism. Colors are never "solid"—they are washes of energy.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through:
- **Tonal Shifts:** Placing a `surface_container_low` section against a `surface` background.
- **Natural Voids:** Using the Spacing Scale (specifically `20` or `24`) to create separation.
- **Glass Refraction:** Using backdrop blurs to signify a container edge.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of frosted glass.
- **Base:** `surface` (#F9F9F9) with Aurora washes.
- **Level 1 (Subtle Inset):** `surface_container_low` for large content areas.
- **Level 2 (Floating Cards):** `surface_container_lowest` (#FFFFFF) to create a soft, natural "lift."

### The "Glass & Gradient" Rule
Standard CTAs are too heavy for this system. Use a **Signature Texture**:
- **Primary Actions:** Transition from `primary` (#00687A) to `primary_container` (#06B6D4) at a 135-degree angle.
- **Glassmorphism:** For floating overlays, use `surface_container_lowest` at 60% opacity with a `24px` backdrop blur.

---

## 3. Typography: Editorial Refinement
We use **Inter** not as a functional workhorse, but as a high-fashion editorial typeface.

*   **Letter Spacing:** Increase tracking for all `display` and `title` styles by +2% to +4% to enhance the "Whisper-Quiet" personality.
*   **Coloration:** Primary text must stay within `on_surface_variant` (#3D494C) or `on_surface` (#1A1C1C) for critical legibility.
*   **Scale Harmony:**
    *   **Display Large (3.5rem):** Use for "Hero Data" (e.g., total balance). It should feel like an art installation.
    *   **Label Medium (0.75rem):** Use for metadata, always in All-Caps with +5% tracking.

The hierarchy is driven by **Vertical Voids**. A `display-lg` headline should often be separated from its body text by at least `spacing-10` (3.5rem) to signify importance through isolation.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden. We use "Atmospheric Depth."

*   **The Layering Principle:** Depth is achieved by stacking `surface-container` tiers. A `surface_container_highest` element sitting on a `surface_dim` background creates a profound sense of "physicality" without a single shadow.
*   **Ambient Shadows:** If an element must "float" (like a modal), use a shadow with a blur of `64px`, spread of `-10px`, and an opacity of `4%`. The shadow color must be tinted with `primary` (0, 104, 122) to mimic refracted light.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use `outline_variant` at **15% opacity**. It should be felt, not seen.
*   **Fluid Data:** Data visualizations should use the `secondary_fixed_dim` and `tertiary_fixed_dim` palettes with 40% transparency, making charts feel like they are "glowing" from within the background.

---

## 5. Components: Primitives & Signature Elements

### Buttons
*   **Primary:** A soft gradient of `primary` to `primary_container`. No border. `Roundedness: xl (1.5rem)`.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No shadow.
*   **Ghost:** `on_surface` text with no background. Interaction state is a subtle `surface_container_low` fill.

### Input Fields
Forgo the "box." Use a `surface_container_low` background with a `Roundedness: lg`. The focus state is not a border change, but a subtle shift to `surface_container_lowest`.

### Cards
Cards must never have borders. Use `surface_container_lowest` against the Aurora background. Ensure internal padding is at least `spacing-8` (2.75rem) to maintain the "90% Negative Space" mandate.

### Signature Component: The "Aurora Pulse"
A data visualization component where a `tertiary_container` (Amber) or `secondary_container` (Green) glow sits behind a translucent glass pane. Use this for high-priority alerts or status indicators.

---

## 6. Do’s and Don’ts

### Do
*   **Do** center-align core experiences to emphasize the vastness of the background.
*   **Do** use asymmetrical layouts (e.g., a headline on the far left, a small label on the far right).
*   **Do** lean into the Spacing Scale. If a layout feels "busy," double the padding.
*   **Do** use `backdrop-filter: blur(20px)` on all floating containers.

### Don’t
*   **Don't** use 1px solid dividers. Use `spacing-12` as a divider instead.
*   **Don't** use pure black (#000000) or high-contrast grey. Use `Deep Slate` (#334155).
*   **Don't** cram multiple data points into one view. One "story" per screen.
*   **Don't** use sharp corners. This system is organic; adhere strictly to the `Roundedness Scale` (md, lg, xl).

---

## 7. Spacing & Margin Intent
This system thrives on **intentional emptiness**. 

*   **Outer Margins:** Minimum `spacing-20` (7rem) on desktop.
*   **Component Gaps:** Use `spacing-16` (5.5rem) to separate distinct functional groups.
*   **Verticality:** Prioritize vertical scrolling with huge gaps over horizontal density. Every element should feel like it has "room to breathe" and "time to be seen."