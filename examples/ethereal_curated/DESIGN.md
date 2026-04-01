```markdown
# Design System Document: The Digital Curator

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

Unlike traditional digital interfaces that fight for every pixel of attention, this system treats the screen as a high-end art gallery—a sunlit, expansive space where the interface "recedes" to allow content to breathe. We are moving away from "App Design" toward "Spatial Curation." This is achieved through an extreme commitment to negative space (aiming for 90% unoccupied area), intentional asymmetry that mimics the placement of art on a wall, and a total rejection of traditional structural lines.

The experience should feel "invisible." We don't build boxes; we create environments where information floats in a state of calm, organic fluidity.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the soft, diffused light of a museum at noon. We use a sophisticated range of off-whites and slates to create depth without visual noise.

### The "No-Line" Rule
**Explicit Instruction:** Use of 1px solid borders for sectioning or containment is strictly prohibited. 
Boundaries must be defined solely through background color shifts or tonal transitions. To separate a functional area from the background, use a shift from `surface` (`#f7f9fb`) to `surface_container_low` (`#f0f4f7`).

### Surface Hierarchy & Nesting
Hierarchy is established through "Tonal Stacking." Imagine sheets of fine paper layered upon one another:
- **Base Layer:** `surface` (#f7f9fb)
- **Secondary Content Area:** `surface_container_low` (#f0f4f7)
- **Interactive Elements/Cards:** `surface_container_lowest` (#ffffff) for a "lifted" feel.
- **Accents:** Use `primary` (#515f74) sparingly for critical actions only.

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat" or "cheap," use Glassmorphism for floating elements (like hidden navigation or tooltips). Use the `surface` color at 70% opacity with a `backdrop-blur` of 20px. 
**Signature Texture:** For primary CTAs or focal points, apply a subtle linear gradient from `primary` (#515f74) to `primary_dim` (#455368) at a 135-degree angle to provide a "weighted" professional polish.

---

## 3. Typography
We utilize a single, highly refined typeface: **Inter.** The strength of this system lies in its sparse placement and dramatic scale shifts.

- **Display (The Curator's Statement):** Use `display-lg` (3.5rem) with `-0.02em` letter spacing. These should be placed with massive margins—often occupying a screen alone to introduce a section.
- **Headlines:** `headline-md` (1.75rem) serves as the primary anchor for content blocks.
- **Body:** `body-lg` (1rem) is the workhorse. Ensure a line-height of at least 1.6 to maintain the "Calm" aesthetic.
- **Labels:** `label-sm` (0.6875rem) with `+0.05em` letter spacing in `on_surface_variant` (#566166) for unobtrusive metadata.

**Editorial Layout Tip:** Never center-align long-form text. Use left-aligned "ragged right" layouts with a maximum line width of 60 characters to ensure the eye never feels fatigued.

---

## 4. Elevation & Depth
Depth in this system is a whisper, not a shout. We move away from Material-style drop shadows in favor of environmental lighting.

- **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. The subtle shift from #ffffff to #f0f4f7 creates a natural, soft lift that mimics physical paper.
- **Ambient Shadows:** If a floating effect is required (e.g., a modal), use a shadow with a blur of `40px` and an opacity of `4%`. The shadow color must be derived from `on_surface` (#2a3439), never pure black.
- **The "Ghost Border" Fallback:** If accessibility requires a container edge, use the `outline_variant` token (#a9b4b9) at **15% opacity**. It should be barely perceptible—a "ghost" of a line.

---

## 5. Components

### Buttons
- **Primary:** `full` roundedness (9999px). Background: `primary` (#515f74). Text: `on_primary` (#f6f7ff). Use `spacing-6` (2rem) for horizontal padding to create a wide, pill-like footprint.
- **Secondary:** `full` roundedness. Background: `surface_container_high` (#e1e9ee). No border.
- **Tertiary:** Text only. Use `label-md` uppercase with increased letter spacing.

### Input Fields
- **Styling:** Forgo the "box." Use a `surface_container_low` background with `md` (1.5rem) roundedness. 
- **Interaction:** On focus, transition the background to `surface_container_highest` (#d9e4ea). Use a "fluid" focal point—a tiny 4px dot in `primary` next to the label to indicate the active field.

### Cards & Lists
- **The "No-Divider" Rule:** Vertical lines or horizontal dividers are forbidden. Separate list items using `spacing-8` (2.75rem) of negative space.
- **Cards:** Use `xl` (3rem) roundedness. Cards should never have a border. Use a subtle background shift from the page's surface color to define the card's bounds.

### Hidden Navigation
- **Behavior:** Navigation should be hidden by default. Triggered by a tiny, unobtrusive icon or a "hush" gesture.
- **Appearance:** A full-screen overlay using a `surface` background with 90% opacity and a heavy backdrop blur.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Place a single image 1/3rd from the left and text 2/3rds from the right. Let the eye wander.
- **Use Massive Margins:** If you think you have enough padding, double it. Use `spacing-24` (8.5rem) for page gutters.
- **Focus on the "Focal Point":** Ensure only one element on the screen has a high-contrast color or fluid motion at any time.

### Don't:
- **Don't use "Grey":** Use the slate-tinted `on_surface_variant` (#566166). Pure greys feel "office-like" and break the sunlit museum mood.
- **Don't crowd the interface:** If a screen feels "busy," remove elements until it functions with the bare minimum.
- **Don't use sharp corners:** Except for images, everything should use the `md` to `full` roundedness scale to maintain organic fluidity.
- **Don't use dividers:** If items are blurring together, increase the `spacing` tokens between them rather than adding a line.

---

## 7. Spacing Scale Reference
Always use these tokens to ensure rhythmic consistency:
- **Micro-adjustments:** `0.5` (0.175rem) or `1` (0.35rem).
- **Component Padding:** `4` (1.4rem) or `6` (2rem).
- **Section Breathing Room:** `16` (5.5rem) or `20` (7rem).
- **Extreme Editorial Margins:** `24` (8.5rem).```