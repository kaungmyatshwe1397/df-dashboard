# Design Tokens — DC-FMS

> **Base Unit:** 8px · **Type Scale:** 1.5 (Perfect Fifth) · **Brand:** Indigo (#4F46E5) · **Modes:** Light + Dark

---

## Spacing (8pt Grid)

| Token | Value | Use Case |
|-------|-------|----------|
| `space-0` | 0px | No spacing |
| `space-1` | 4px | Half-step — icon padding, fine alignment |
| `space-2` | 8px | Tight gaps, small padding |
| `space-3` | 16px | Default component padding |
| `space-4` | 24px | Section gaps, card padding |
| `space-5` | 32px | Larger section spacing |
| `space-6` | 40px | Page section dividers |
| `space-7` | 48px | Major section spacing |
| `space-8` | 64px | Page-level vertical spacing |

## Layout Grid

| Token | Value |
|-------|-------|
| `grid-columns` | 12 |
| `grid-gutter` | 24px |
| `grid-margin` | 32px |
| `container-max` | 1280px |

## Typography

### Font Families

| Token | Value |
|-------|-------|
| `font-family-heading` | Inter, system fallback |
| `font-family-body` | Inter, system fallback |

### Font Scale (Perfect Fifth, ratio 1.5)

| Token | Size | Role |
|-------|------|------|
| `font-display` | 48px | Hero / landing headline |
| `font-h1` | 36px | Page title |
| `font-h2` | 24px | Section heading |
| `font-h3` | 18px | Sub-section heading |
| `font-h4` | 15px | Card / component heading |
| `font-body-lg` | 18px | Emphasized body text |
| `font-body` | 16px | Default body text |
| `font-body-sm` | 14px | Secondary / helper text |
| `font-caption` | 12px | Labels, captions, metadata |

### Font Weights

| Token | Value |
|-------|-------|
| `font-weight-regular` | 400 |
| `font-weight-medium` | 500 |
| `font-weight-semibold` | 600 |
| `font-weight-bold` | 700 |

### Line Heights

| Token | Value |
|-------|-------|
| `line-height-tight` | 1.2 |
| `line-height-normal` | 1.5 |
| `line-height-relaxed` | 1.65 |

---

## Color Tokens (60:30:10 Rule)

### Light Mode

#### Surface (60% — Dominant)

| Token | Hex |
|-------|-----|
| `color-surface-primary` | `#FFFFFF` |
| `color-surface-secondary` | `#F8FAFC` |
| `color-surface-tertiary` | `#F1F5F9` |
| `color-background` | `#FFFFFF` |

#### Text (30% — Secondary)

| Token | Hex |
|-------|-----|
| `color-text-primary` | `#0F172A` |
| `color-text-secondary` | `#475569` |
| `color-text-disabled` | `#94A3B8` |
| `color-text-inverse` | `#FFFFFF` |

#### Border (30% — Secondary)

| Token | Hex |
|-------|-----|
| `color-border` | `#E2E8F0` |
| `color-border-strong` | `#CBD5E1` |

#### Action (10% — Accent)

| Token | Hex |
|-------|-----|
| `color-action-primary` | `#4F46E5` |
| `color-action-primary-hover` | `#4338CA` |
| `color-action-primary-active` | `#3730A3` |
| `color-action-secondary` | `#EEF2FF` |

#### Feedback

| Token | Hex |
|-------|-----|
| `color-success` | `#059669` |
| `color-success-surface` | `#ECFDF5` |
| `color-warning` | `#D97706` |
| `color-warning-surface` | `#FFFBEB` |
| `color-danger` | `#DC2626` |
| `color-danger-surface` | `#FEF2F2` |
| `color-info` | `#2563EB` |
| `color-info-surface` | `#EFF6FF` |

### Dark Mode

| Token | Hex |
|-------|-----|
| `color-surface-primary` | `#0F172A` |
| `color-surface-secondary` | `#1E293B` |
| `color-surface-tertiary` | `#334155` |
| `color-background` | `#0F172A` |
| `color-text-primary` | `#F8FAFC` |
| `color-text-secondary` | `#94A3B8` |
| `color-text-disabled` | `#475569` |
| `color-text-inverse` | `#0F172A` |
| `color-border` | `#1E293B` |
| `color-border-strong` | `#334155` |
| `color-action-primary` | `#818CF8` |
| `color-action-primary-hover` | `#6366F1` |
| `color-action-primary-active` | `#4F46E5` |
| `color-action-secondary` | `#1E1B4B` |
| `color-success` | `#34D399` |
| `color-success-surface` | `#064E3B` |
| `color-warning` | `#FBBF24` |
| `color-warning-surface` | `#78350F` |
| `color-danger` | `#F87171` |
| `color-danger-surface` | `#7F1D1D` |
| `color-info` | `#60A5FA` |
| `color-info-surface` | `#1E3A5F` |

---

## Rules Summary

1. **8pt Spacing** — All spacing values are multiples of 8px. 4px half-step allowed only for fine adjustments.
2. **Typography Hierarchy** — Every text size maps to a named token. No ad-hoc font sizes.
3. **Semantic Colors** — Colors are referenced by role, never by raw hex. 60:30:10 ratio enforced (surfaces : borders/text : accent).
