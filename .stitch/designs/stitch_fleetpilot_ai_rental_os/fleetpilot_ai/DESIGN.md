---
name: FleetPilot AI
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#8083ff'
  on-tertiary-container: '#0d0096'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is engineered for the high-stakes environment of fleet management, where clarity and reliability are paramount. The brand personality is **Professional, High-Tech, and Efficient**, reflecting an AI-driven platform that handles complex logistics with ease.

The visual style is a **Modern Dark-Mode Aesthetic** that blends **Minimalism** with subtle **Glassmorphism**. By using deep, receding backgrounds and layered translucent surfaces, the interface creates a sense of spatial depth and technological sophistication. This approach ensures that data-heavy dashboards feel expansive rather than cluttered, fostering a focused user experience for fleet operators.

## Colors

The palette is anchored in deep, cinematic tones to reduce eye strain during long periods of monitoring. 

- **Primary (#3B82F6):** A vibrant electric blue used for primary actions, focus states, and active fleet tracking.
- **Secondary (#10B981):** An emerald green reserved strictly for positive status indicators, "Available" vehicle states, and successful revenue metrics.
- **Surface Neutrals:** The foundation uses Navy (#0F172A) for the base canvas and Slate Gray (#1E293B) for elevated containers.
- **Accent/Tertiary (#6366F1):** An indigo tint used sparingly for secondary data visualizations and AI-driven insights to distinguish them from manual system tasks.

## Typography

This design system utilizes **Inter** as its primary typeface due to its exceptional legibility in digital interfaces and its neutral, systematic character. To reinforce the "High-Tech" persona, **JetBrains Mono** is introduced for secondary labels, VIN numbers, coordinates, and telemetry data.

Headings utilize tighter letter-spacing and bold weights to create a strong visual hierarchy against the dark background. Body text maintains a generous line height to ensure readability of log files and rental agreements. Mobile typography scales aggressively to preserve vertical real estate, with `display-lg` shrinking significantly for handheld use.

## Layout & Spacing

The design system employs a **Fluid Grid** system based on a 4px baseline rhythm. 

- **Desktop:** 12-column grid with 24px gutters. Sidebars are fixed at 280px to maximize the dashboard workspace.
- **Tablet:** 8-column grid with 20px gutters. Content cards should reflow to 2-up stacks.
- **Mobile:** 4-column grid with 16px margins. 

Layouts should prioritize whitespace (or "dark space") to separate high-density data modules. Strategic use of the `xl` spacing unit (40px) is recommended between major sections (e.g., Fleet Overview vs. Revenue Chart) to prevent cognitive overload.

## Elevation & Depth

Visual hierarchy is achieved through **Glassmorphism** and **Tonal Layering**. 

1. **Floor (Level 0):** The base canvas (#0F172A).
2. **Surface (Level 1):** Primary containers using #1E293B with a subtle 1px border (#334155).
3. **Elevated (Level 2):** Modals and dropdowns utilizing a backdrop filter (blur: 12px) and semi-transparent fills (rgba(30, 41, 59, 0.7)).

Shadows are used sparingly; when applied, they are large, soft, and tinted with the primary blue color at very low opacity (5-8%) to suggest an ambient glow from the screen elements rather than a physical light source.

## Shapes

The shape language is **Rounded**, reflecting a modern and approachable software experience while maintaining professional rigor. 

- **Standard Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Feature Cards:** 1rem (16px) corner radius.
- **Status Pills:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

This consistent radius helps soften the high-contrast dark mode and makes the "glass" panels feel like polished, premium hardware components.

## Components

### Buttons
Primary buttons use the Electric Blue fill with white text. Secondary buttons utilize a "Ghost" style with a 1px Slate border. All buttons should have a subtle 400ms transition on hover, slightly increasing the background brightness.

### Inputs
Fields use the Level 1 surface color with a 1px border. On focus, the border transitions to Primary Blue with a subtle outer glow. Labels use the `label-sm` style for clarity.

### Cards & Glass Panels
The signature component of the design system. Cards must have a 1px border (#334155). For "active" or "highlighted" fleet items, the border can transition to a subtle Blue gradient.

### Status Indicators
Use the `label-mono` type for status chips. 
- **Active:** Emerald Green background (10% opacity) with Green text.
- **In Maintenance:** Amber background (10% opacity) with Amber text.
- **Decommissioned:** Slate background (20% opacity) with Gray text.

### Data Visualization
Charts should use high-contrast strokes. Grid lines must be very faint (#1E293B) to keep the focus on the data trends. Use the Primary and Secondary colors as the main data series colors.