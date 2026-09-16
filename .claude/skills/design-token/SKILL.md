---
name: design-tokens
description: Generate a project's Design Token specification and visual rules (spacing/grid, typography scale, semantic color system) as CSS variables and/or JSON. Use this skill whenever the user asks to create design tokens, a style guide, visual rules, a spacing system, a type scale, or a color system for a project — even if they don't use the word "tokens." Also use it whenever building or styling any UI (component, page, mockup, wireframe) to confirm which token to use instead of hardcoding a pixel value, font size, or color. This skill NEVER assumes brand values (colors, fonts, spacing unit) on its own — it always asks the user first.
---

# Design Tokens & Visual Rules

This skill generates a **Design Token Specification** for a project: a single source of truth for spacing, typography, and color that every screen must follow.

It also governs how Claude behaves while *building* UI in a project that has tokens: Claude must always reference a token, and confirm with the user which one applies, rather than inventing a hardcoded value.

This skill enforces exactly 3 rules. Every design-token file this skill produces, for any project, follows all three:

1. **8pt Spacing & Layout Grid** — every spacing and sizing value is a multiple of 8 (with a 4px half-step allowed for fine adjustments).
2. **Typography Hierarchy** — a fixed, named font scale. No font size exists outside the scale.
3. **Semantic Color Tokens (60:30:10 rule)** — colors are never referenced by hex or raw name in a design or in code. They are referenced by semantic role, and every palette is proportioned 60% dominant / 30% secondary / 10% accent.

---

## Step 1 — Always interview before generating

Never invent brand specifics. Before creating or editing a token file for a project, ask the user for whatever of the below isn't already established in the conversation or an existing token file:

**Spacing & grid**
- Base unit — confirm 8pt (default) or ask if they use a different base
- Layout grid — number of columns, gutter width, max content width (e.g. 12-col, 24px gutter, 1280px max)
- Breakpoints, if the project is responsive (mobile / tablet / desktop widths)

**Typography**
- Font family (or families) for headings vs. body — ask if unsure, do not assume a default font
- Base font size (usually 16px) and scale ratio (e.g. 1.25 major third, 1.333 perfect fourth) — or ask for the exact size at each level if they already have one
- Number of heading levels needed (H1–H6, or fewer) plus body, caption/small text

**Color**
- Brand/primary color(s)
- Whether they want light mode, dark mode, or both
- Any existing semantic needs beyond the basics (e.g. do they need a distinct "info" color, or is warning/error/success enough)

Ask only for what's missing — if the user already gave a value earlier in the conversation or in an uploaded brand guide, use that instead of re-asking.

If the user says "just use sensible defaults," you may proceed with the defaults noted in each section below — but state clearly which defaults you picked, since even defaults must be visible and confirmable, not silently hardcoded.

## Step 2 — Confirm before applying while building UI

Once a token file exists for a project, Claude must not hardcode spacing, font sizes, or colors when building screens, components, or mockups. Instead:

- Check the project's token file first.
- If the needed value isn't covered by an existing token, stop and ask the user which existing token is closest, or whether a new token should be added — never silently invent a new pixel value, font size, or color.
- When presenting a mockup or component, refer to values by token name in your explanation (e.g. "uses `--space-4` and `--color-surface-secondary`"), not by raw pixel/hex values.

This applies even under time pressure or for "quick" mockups — a hardcoded value defeats the purpose of the system.

---

## Rule 1: 8pt Spacing & Layout Grid

- **Base unit:** 8px. Every margin, padding, gap, and most sizing values must be a multiple of 8.
- **Half-step exception:** 4px is allowed only for fine adjustments (icon padding, border alignment, small components) — never as a general-purpose spacing value.
- **Naming convention:** `space-0` through `space-N`, mapped to multiples of the base unit. Example scale (confirm/adjust with the user, don't assume this exact set applies):

  | Token | Value |
  |---|---|
  | `space-0` | 0px |
  | `space-1` | 4px (half-step exception) |
  | `space-2` | 8px |
  | `space-3` | 16px |
  | `space-4` | 24px |
  | `space-5` | 32px |
  | `space-6` | 40px |
  | `space-7` | 48px |
  | `space-8` | 64px |

- **Layout grid tokens:** columns, gutter, margin, and max-width must also be defined and named (e.g. `grid-columns`, `grid-gutter`, `grid-margin`, `container-max`) — confirmed with the user, not assumed.
- Never let a component use an arbitrary value like `13px` or `22px` margin. If a design calls for something off-scale, flag it to the user and ask whether to round to the nearest token or add a new one deliberately.

## Rule 2: Typography Hierarchy (Font Scale)

- Every text style in the project must map to a **named level** — never an ad hoc font-size.
- Standard levels to confirm with the user (add/remove based on project need):

  | Token | Typical role |
  |---|---|
  | `font-display` | Hero / landing headline |
  | `font-h1` | Page title |
  | `font-h2` | Section heading |
  | `font-h3` | Sub-section heading |
  | `font-h4` | Card / component heading |
  | `font-body-lg` | Emphasized body text |
  | `font-body` | Default body text |
  | `font-body-sm` | Secondary / helper text |
  | `font-caption` | Labels, captions, metadata |

- Each level needs: font-family, size, weight, line-height, and (optionally) letter-spacing — all as named values, confirmed with the user, not guessed.
- Sizes should follow a consistent scale ratio from the base size (ask the user for the ratio, or the exact per-level sizes if they already have brand guidelines).
- Never allow a one-off font-size in a component. If a screen seems to need something between two levels, ask the user whether an existing level should be reused or a new level should be added to the scale.

## Rule 3: Semantic Color Tokens (60:30:10 Rule)

- **No raw hex/RGB values in designs or code.** Every color used must be a semantic token (e.g. `color-surface-primary`, `color-text-secondary`, `color-action-danger`) — never `#1A73E8` referenced directly in a component.
- **60:30:10 proportion**, applied across a typical screen:
  - **60% — Dominant/neutral** — backgrounds, surfaces. Tokens like `color-surface-primary`, `color-surface-secondary`, `color-background`.
  - **30% — Secondary** — supporting UI, borders, secondary text, containers. Tokens like `color-border`, `color-text-secondary`, `color-surface-tertiary`.
  - **10% — Accent** — primary brand actions, key CTAs, and semantic states. Tokens like `color-action-primary`, `color-action-danger`, `color-action-success`, `color-action-warning`.
- Required semantic categories to confirm with the user for any project:

  | Category | Example tokens |
  |---|---|
  | Surface | `color-surface-primary`, `color-surface-secondary`, `color-surface-tertiary` |
  | Text | `color-text-primary`, `color-text-secondary`, `color-text-disabled`, `color-text-inverse` |
  | Border | `color-border`, `color-border-strong` |
  | Action | `color-action-primary`, `color-action-primary-hover`, `color-action-secondary` |
  | Feedback | `color-success`, `color-warning`, `color-danger`, `color-info` |

- If the project needs dark mode, every semantic token needs a light-mode and dark-mode value — the token *name* stays the same, only the underlying value swaps. Never introduce separate token names per mode.
- When reviewing or building a screen, check that the 60:30:10 balance roughly holds — if a design leans heavily on the accent color for large surfaces, flag it to the user; the accent tier is for drawing attention, not for filling space.

---

## Step 3 — Output format

Produce **both**, unless the user asks for only one:

1. **CSS custom properties** (`tokens.css`) — a `:root { }` block (plus a `[data-theme="dark"] { }` block if dark mode is in scope), grouped by category with a comment header per section (Spacing, Typography, Color).
2. **JSON** (`tokens.json`) — the same values structured as nested objects (`spacing`, `typography`, `color`), suitable for import into design tools or a JS/TS theme file.

Also produce a short **`tokens.md`** summary table (one per category) so the values are human-readable at a glance for the design team — this is documentation, not a replacement for the CSS/JSON.

Naming must be identical across all three outputs — the same token name in `tokens.css`, `tokens.json`, and `tokens.md`.

## Step 4 — File output

Save all three files together for the project (e.g. `tokens.css`, `tokens.json`, `tokens.md`) so the design and dev team can use them directly. When updating tokens for an existing project, edit these three files rather than creating new ones with different names.
