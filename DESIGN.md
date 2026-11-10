---
version: alpha
name: Vitae Studio Design System
description: Clean, high-contrast workspace and A4 document builder design tokens for Vitae Studio.
colors:
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  secondary: "#0F172A"
  tertiary: "#10B981"
  neutral: "#F8FAFC"
  surface: "#FFFFFF"
  on-surface: "#0F172A"
  text-secondary: "#475569"
  border: "#E2E8F0"
  error: "#EF4444"
  success: "#16A34A"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.35
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.04em
rounded:
  sm: 6px
  md: 8px
  lg: 14px
  full: 9999px
spacing:
  xs: 6px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 28px
components:
  modal-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  dropzone-area:
    backgroundColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
---

# Vitae Studio — Design Source of Truth

## Overview
Vitae Studio is a focused, distraction-free professional resume studio combining a split-pane editor with a live A4 WYSIWYG preview and AI-powered tailoring/extraction modals.

## Colors
- **Surface (`#FFFFFF` / Dark `#1E293B`):** Crisp elevated cards and modals.
- **Primary (`#2563EB` / Existing Studio Tokens):** High-contrast interactive states for document actions and dropzone highlights.
- **Semantic Feedback (`#16A34A` / `#EF4444`):** Clear validation states for file parsing, ATS checks, and AI status indicators.

## Typography
- **UI Workspace:** `Inter` with clear hierarchy between uppercase micro-labels (`12px`, `600` weight) and readable form controls (`14px`).

## Layout
- **Split Workspace:** Resizable left form editor + centered A4 print preview sheet, with focused modal dialogs (`480px–520px` max width) for AI workflows.

## Elevation & Depth
- Layered shadows (`--shadow-lg`) with `1px solid var(--db-border)` framing for modals and interactive dropzones.

## Shapes
- `6px` for buttons and inputs, `8px–10px` for inner cards and dropzones, `14px` for modal containers.

## Components
- **Resume Upload Dropzone:** Interactive drag-and-drop container with dashed border, tactile hover/drag-active states, file metadata badge, and step-by-step progress bar.

## Do's and Don'ts
- **Do** reuse existing CSS custom properties (`--db-card-bg`, `--db-border`, `--db-text-primary`, `--db-input-bg`) so light and dark mode work seamlessly.
- **Don't** auto-overwrite user resume fields without explicit confirmation in the modal after extraction completes.
