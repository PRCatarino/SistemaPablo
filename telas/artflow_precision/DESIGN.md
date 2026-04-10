# Design System Strategy: The Industrial Atelier

## 1. Overview & Creative North Star
This design system is built for the high-stakes, tactile world of textile manufacturing. We are moving beyond the "generic SaaS" aesthetic to embrace a North Star we call **"The Industrial Atelier."** 

The textile industry is a blend of heavy machinery and delicate craftsmanship. Our UI must reflect this: the precision of an engineering tool paired with the refined, editorial feel of a high-end fashion house. We break the "template" look by eschewing rigid 1px borders in favor of **Tonal Architecture**—defining space through subtle shifts in weight and surface depth. The layout should feel like a well-organized workbench: high-density, hyper-functional, yet aesthetically serene.

---

## 2. Colors: Tonal Architecture
We move away from "coloring boxes" toward "sculpting surfaces."

### The Palette
*   **Primary Deep Blue (`#002045`):** Our "Command" color. Used for high-level navigation and moments of absolute authority.
*   **Secondary Cyan/Teal (`#006a6a`):** Our "Action" color. It represents the loom in motion—creativity and progress.
*   **Tertiary Earth (`#321b00`):** Used sparingly for grounded, status-heavy information.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off major UI areas. Boundaries must be defined by background color shifts. 
*   **Kanban Columns:** Instead of a border, use `surface_container_low` for the column background against a `surface` main canvas.
*   **Header to Body:** Use a subtle elevation shift or a transition from `primary` to `primary_container`.

### The Glass & Gradient Rule
To prevent a "flat" corporate feel:
*   **Main CTAs:** Use a subtle linear gradient from `primary` (`#002045`) to `primary_container` (`#1a365d`) at a 135-degree angle. This adds "soul" and depth.
*   **Floating Panels:** Modals or "Quick View" fabric details should use Glassmorphism. Apply `surface_container_lowest` at 85% opacity with a `20px` backdrop blur.

---

## 3. Typography: Editorial Precision
We utilize a dual-font system to balance industrial efficiency with premium brand positioning.

*   **Display & Headlines (Manrope):** A modern geometric sans-serif with a wide stance. This provides the "Editorial" weight. Use `headline-lg` for dashboard overviews to make the data feel curated.
*   **Body & Labels (Inter):** A workhorse typeface designed for high-density readability. Its tall x-height ensures that even `label-sm` (`0.6875rem`) remains legible on a factory floor tablet.
*   **Hierarchy Tip:** Use `on_surface_variant` (`#43474e`) for secondary data (like SKU numbers) to create a clear visual step-down from the primary task name in `title-sm`.

---

## 4. Elevation & Depth: The Layering Principle
Shadows are not decorations; they are spatial indicators. 

*   **Tonal Layering:** Depth is achieved by "stacking" surface tiers. 
    *   *Canvas:* `surface` (`#f7f9fb`)
    *   *Kanban Column:* `surface_container_low` (`#f2f4f6`)
    *   *Kanban Card:* `surface_container_lowest` (`#ffffff`)
    This creates a "lifted" effect naturally without a single line of CSS border.
*   **Ambient Shadows:** For active "dragging" states on cards, use an extra-diffused shadow: `0px 12px 32px rgba(25, 28, 30, 0.06)`. The tint is derived from `on_surface`, not pure black.
*   **The "Ghost Border":** For high-density card internal separators, use `outline_variant` at 15% opacity. It should be felt, not seen.

---

## 5. Components: High-Density Industrial Primitives

### Kanban Cards
*   **Structure:** No dividers. Use 12px vertical spacing between content blocks.
*   **Surface:** Always `surface_container_lowest`.
*   **Indicators:** Use a 4px vertical "thread" (bar) on the left edge of the card using the `secondary` color to indicate active production.

### Structured Forms
*   **Inputs:** Utilize `surface_container_high` for the input field background with a `none` border. On focus, transition to a 2px bottom-accent of `secondary`.
*   **High-Density Mode:** Labels should be `label-sm` and uppercase with 0.05em letter spacing, placed 4px above the input field.

### Status Chips
*   **Aesthetic:** No solid backgrounds for secondary statuses. Use a "Ghost" style: `outline` text with a 10% opacity background of the status color (e.g., `error` at 10% for "Delayed").
*   **Roundedness:** Use `full` (`9999px`) for chips to contrast against the `md` (`0.375rem`) corners of cards.

### Progress Thread (Custom Component)
*   Instead of a standard progress bar, use a 2px "Thread" that runs across the top of the Kanban column, using a gradient of `secondary_fixed_dim` to `secondary`.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `surface_bright` to highlight the currently active production batch.
*   **Do** utilize white space as a separator. If you feel the need for a line, add 8px of padding instead.
*   **Do** use `tertiary_container` for warnings—it provides a sophisticated "industrial amber" look that isn't as alarming as `error` red.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (`#191c1e`) to maintain the premium, ink-on-paper feel.
*   **Don't** use standard "Drop Shadows" on cards. Stick to Tonal Layering unless the object is floating (modals/tooltips).
*   **Don't** use 100% opaque borders. They clutter the high-density view and make the app feel like an Excel spreadsheet rather than a professional management tool.