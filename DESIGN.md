---
version: alpha
name: Vitae Studio Editorial Workspace
description: Design system and tokens for Vitae Studio — an ATS-optimized CV editor and multi-provider AI enrichment workspace.
colors:
  primary: "#0F172A"
  secondary: "#475569"
  tertiary: "#0D9488"
  accent-brand: "#7C3AED"
  neutral: "#F8FAFC"
  surface: "#FFFFFF"
  surface-elevated: "#F1F5F9"
  on-surface: "#0F172A"
  border: "#E2E8F0"
  border-strong: "#CBD5E1"
  focus: "#3B82F6"
  success: "#16A34A"
  warning: "#D97706"
  error: "#EF4444"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.2
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0.04em
  mono-sm:
    fontFamily: JetBrains Mono, monospace
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 14px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 28px
components:
  modal-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  button-primary:
    backgroundColor: "{colors.accent-brand}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: 8px
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 8px
  status-badge-ready:
    backgroundColor: "{colors.success}"
    rounded: "{rounded.full}"
  status-badge-pending:
    backgroundColor: "{colors.warning}"
    rounded: "{rounded.full}"
---

# Vitae Studio — Design Specification

## Overview
Vitae Studio is a technical, distraction-free CV authoring and ATS optimization studio. Its interface combines an editorial split-pane workspace (structured form controls on the left, live print-accurate A4 sheet preview on the right) with focused modal workflows for ATS validation, multi-provider AI enrichment, and zero-config onboarding.

## Colors
- **Primary (`#0F172A`):** Deep slate ink used for primary typography and structural headers.
- **Secondary (`#475569`):** Muted slate for helper descriptions, field labels, and secondary metadata.
- **Tertiary (`#0D9488`):** Technical teal accent used for provider connection badges and gateway indicators.
- **Accent Brand (`#7C3AED`):** Existing workspace primary action color (`--btn-primary-bg`) preserved for visual continuity across the navbar and dialogs.
- **Neutral (`#F8FAFC`) & Surface (`#FFFFFF`):** High-contrast light canvas (`#0F172A` / `#1E293B` in `prefers-color-scheme: dark`) that keeps the A4 document preview visually dominant.
- **Semantic Status (`#16A34A` / `#D97706` / `#EF4444`):** Clear signal colors for AI connection tests, API key configuration readiness, and validation feedback.

## Typography
- **UI Workspace (`Inter`):** Clean, high-legibility grotesk for dense form controls, provider cards, and status diagnostics.
- **Document Preview (`Inter`, `Lora`, `Roboto`):** User-selectable typographic themes for the A4 curriculum sheet.
- **Technical Inputs (`monospace`):** Used for API keys, Base URLs (such as `http://localhost:20128/v1` for 9router), and model identifiers (`gemini-2.5-flash`, `gpt-4o-mini`).

## Layout
- **Workspace Split:** Fixed top `Navbar` (actions + AI status trigger) over a resizable two-column workspace (`CVEditor` sidebar + `CVPreview` canvas).
- **Modal Architecture:** Centered dialog containers (`460px` to `560px` width) with structured header, scrollable body, and sticky action footer.

## Elevation & Depth
- **Crisp Borders + Layered Shadows:** Surfaces use `1px solid var(--db-border)` paired with `--shadow-lg` (`0 10px 15px -3px rgb(0 0 0 / 0.1)`) for modals and `--sheet-shadow` for the A4 preview sheet.

## Shapes
- **Buttons & Inputs:** `6px` (`rounded.sm`) to `8px` (`rounded.md`) for tactile, precise form controls.
- **Modals & Cards:** `14px` (`rounded.lg`) container radius matching existing modal dialogs (`EnrichmentModal`, `AtsModal`).

## Components
- **Provider Selector Cards:** Interactive 3-option segmented grid (`Google Gemini`, `OpenAI`, `OpenAPI / 9router`) with clear active border and icon indicator.
- **Connection Test Banner:** Inline diagnostic alert showing real-time latency/status from `POST /settings/test`.
- **Navbar AI Trigger:** Secondary button with a live status dot (`#16A34A` when configured, `#D97706` pulse when unconfigured).

## Do's and Don'ts
- **Do** use existing CSS custom properties (`--db-card-bg`, `--db-text-primary`, `--db-border`, `--db-input-bg`) so light and dark mode work seamlessly.
- **Do** mask saved API keys in the UI (`sk-...9f2a`) and allow updating provider/model/baseUrl without re-entering the key.
- **Don't** block manual CV editing if the user chooses "Configurar depois" during first-time onboarding.
