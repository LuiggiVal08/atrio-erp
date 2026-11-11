---
name: Atrio ERP
description: Compact, dark-first ERP workspace for fast, keyboard-driven operations
colors:
  canvas: "#0D0F14"
  surface: "#181C26"
  overlay: "#161A24"
  surface-hover: "#1E2330"
  surface-active: "#242A3A"
  border: "#222838"
  border-light: "#2C3348"
  accent: "#D4785C"
  accent-hover: "#C06448"
  text-primary: "#E8EAED"
  text-secondary: "#9098AD"
  text-muted: "#5C637A"
  success: "#3DA06B"
  error: "#D45C5C"
  warning: "#D4A04A"
  info: "#5C8DD4"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
  data:
    fontFamily: "JetBrains Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  compact: "8px"
  standard: "12px"
  panel: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  nav-item-active:
    backgroundColor: "rgba(212, 120, 92, 0.12)"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.section}"
---

## Overview

Atrio uses a restrained, operational visual language designed to keep attention on data and repeated tasks. The desktop workspace favors compact density, persistent navigation, clear status communication, and familiar web controls.

**Creative North Star: "The Calm Control Room."**

**Key Characteristics:**
- Dense without feeling cramped
- Dark-first with tonal surfaces and thin borders
- Copper accents reserved for active states and primary action
- Monospace used for metrics, timestamps, shortcuts, and machine-like identifiers
- Four selectable themes preserve a consistent structural system

**The State-First Rule.** Color communicates state before decoration. Accent is for selection, focus, and primary action; semantic colors are reserved for success, error, warning, and information.

## Colors

The default premium-dark theme uses a near-black canvas, layered slate surfaces, muted cool-gray text, and a restrained copper accent. Nordic Light, Warm Light, and Obsidian Emerald are full theme variants rather than isolated component recolors.

- Canvas: `#0D0F14`
- Surface: `#181C26`
- Overlay: `#161A24`
- Primary text: `#E8EAED`
- Secondary text: `#9098AD`
- Muted text: `#5C637A`
- Accent: `#D4785C`
- Success: `#3DA06B`
- Error: `#D45C5C`
- Warning: `#D4A04A`
- Info: `#5C8DD4`

**The Theme Continuity Rule.** Every theme must preserve the same surface hierarchy and semantic role; change values, not the meaning of state.

## Typography

Use Inter for general interface copy, Plus Jakarta Sans for brand and page headings, and JetBrains Mono for data values, timestamps, state badges, and keyboard labels. The application base size is 14px. Headings stay tightly tracked and utility text remains small enough to preserve density.

Avoid display typography in forms, tables, buttons, or operational labels.

## Layout

The authenticated shell is a full-height flex workspace: fixed-width collapsible sidebar, 56px header, scrollable main region, and 28px status footer. The sidebar defaults to 240px and collapses to 64px; navigation adapts through icon-only mode with tooltips.

Content regions use restrained local spacing rather than page-wide decorative margins. Preserve a dominant task column and avoid centered marketing-card composition inside operational screens.

Headers and toolbars use `px-6`-scale rhythm. Compact controls usually use 12px horizontal padding and 8px vertical padding.

## Elevation & Depth

Depth is primarily tonal rather than shadow-based. Surfaces differ through canvas/surface/overlay colors, thin borders, and hover states. Radial accent washes and subtle gradients may clarify the active workspace, but should not obscure content.

Overlays, dialogs, menus, and search surfaces use strong shadows with the backdrop separated from the foreground. Backdrop blur is limited to modal interruption states.

## Shapes

Controls and navigation use small to medium radii:

- State badges and badges: 4px
- Buttons, inputs, and nav items: 6px or 8px
- Cards, menus, and dialogs: 12px
- Avatars and status indicators: circular

Borders are thin and low-contrast by default, increasing at focus and active boundaries.

## Components

### Navigation

Navigation uses a 240px gradient sidebar, 56px header, module icons, and a 0.5px accent indicator on the active item. Active items use accent tint rather than a saturated block. Icon-only mode keeps the same active affordance.

### Buttons

Primary actions use the theme accent with white text. Secondary actions rely on surface and border treatment. Hover states shift the accent or surface and maintain compact control heights.

### Inputs and Search

Inputs use surface backgrounds, thin borders, compact padding, and a one-pixel accent focus ring. Search is exposed through the header as a keyboard shortcut and opens a modal overlay.

### Cards and Panels

Cards use `bg-surface`, thin borders, 8px or 12px radius, and compact internal padding. Avoid large shadows for ordinary panels.

### Status

Use state badges and inline semantic colors for draft, pending, approved, posted, paid, cancelled, received, and partial states. Status values remain concise and use compact uppercase monospace when badges are appropriate.

### Modals

Dialogs are centered overlays with a short accent edge, translucent scrim, thin border, and strong elevation. Content scrolling stays inside the dialog and the close affordance remains clear.

## Do's and Don'ts

### Do:
- **Do** keep POS and operational tasks keyboard-first.
- **Do** use muted borders, restrained surfaces, and short transitions.
- **Do** preserve module, role, and tenant context in the shell.
- **Do** use monospace for values, timestamps, counts, and shortcuts.
- **Do** provide hover, focus-visible, active, disabled, loading, error, and empty states.

### Don't:
- **Don't** introduce saturated accent blocks for inactive navigation.
- **Don't** use display fonts for labels, data, buttons, or form controls.
- **Don't** replace familiar controls with decorative custom affordances.
- **Don't** add page-load choreography or decorative motion to operational screens.
- **Don't** fabricate landing-page metrics or customer proof in product UI.
