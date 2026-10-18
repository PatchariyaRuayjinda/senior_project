---
name: "Inventory · Clear Blue"
description: "A clear, Thai-first inventory workspace with restrained blue actions and white working surfaces."
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-active: "#1e40af"
  link: "#1d4ed8"
  link-hover: "#1e40af"
  link-active: "#1e3a8a"
  selected-navigation: "#eaf1ff"
  selected-row: "#edf3ff"
  selected-row-hover: "#e4edff"
  selection: "#dbe8ff"
  text: "#172033"
  secondary: "#526176"
  placeholder: "#64748b"
  canvas: "#f6f8fc"
  surface: "#ffffff"
  border: "#79879d"
  divider: "#d4dce8"
  table-header: "#f1f4fa"
  track: "#e7ecf4"
  class-a-text: "#2250a6"
  class-b-text: "#6b42ad"
  class-b-surface: "#f3edff"
  class-c-surface: "#f1f4f8"
  warning-text: "#805a13"
  warning-surface: "#fff3db"
  pending-text: "#315e8c"
  pending-surface: "#eaf1fb"
  neutral-surface: "#f0f3f8"
  aligned-text: "#4c6273"
  aligned-surface: "#edf2f7"
typography:
  display:
    fontFamily: '"IBM Plex Sans Thai", sans-serif'
    fontSize: "52px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-1px"
  headline:
    fontFamily: '"IBM Plex Sans Thai", sans-serif'
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.45
  title:
    fontFamily: '"IBM Plex Sans Thai", sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: '"IBM Plex Sans Thai", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5714285714285714
  table:
    fontFamily: '"IBM Plex Sans Thai", sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5714285714285714
  label:
    fontFamily: '"IBM Plex Sans Thai", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6666666666666667
rounded:
  sm: "4px"
  control: "6px"
  surface: "8px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.surface}"
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 15px"
    height: "38px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.link}"
    rounded: "{rounded.control}"
    height: "38px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "38px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "38px"
  navigation-selected:
    backgroundColor: "{colors.selected-navigation}"
    textColor: "{colors.link}"
    rounded: "{rounded.surface}"
    height: "44px"
  class-a:
    backgroundColor: "{colors.selected-navigation}"
    textColor: "{colors.class-a-text}"
    rounded: "{rounded.sm}"
  status-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning-text}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "24px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
    padding: "{spacing.xl}"
  table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.table}"
    rounded: "{rounded.surface}"
---

# Design System: Inventory · Clear Blue

## Overview

**Creative North Star: "Clear Blue"**

Clear Blue is a quiet, precise workspace for Thai-speaking inventory staff. Dark text, cool pale backgrounds, white working surfaces, and restrained blue actions keep product names, quantities, and storage identifiers easy to compare. Standard Ant Design components supply familiar interaction and feedback.

The visual identity is light throughout. Desktop uses a cool canvas behind white navigation and working panels; narrow screens use a white canvas. The implementation carries its personality through typography, spacing, selection, and explicit status labels. Local fonts and interface icons provide the visual material; the shipped application has no raster imagery.

**Key Characteristics:**

- Thai-first typography with tabular numerals.
- White working surfaces on a cool desktop canvas.
- Blue actions and pale blue selection.
- Flat, gently rounded containers with visible borders.
- Status expressed through words as well as color.

This document records the implemented frontend, including its explicitly labeled sample-data inventory screens. It does not establish production ABC criteria, inventory persistence, or future features. Source authority is `frontend/src/theme/clearBlue.ts`, `frontend/src/styles.css`, and the shared Ant Design provider in `frontend/src/App.tsx`. The agreed workflow is recorded in `docs/ux/abc-stock/README.md`; this document records its implemented visual rules.

## Colors

The palette pairs a clear blue accent with cool neutrals; classification and status tints carry narrowly defined meanings. Frontmatter values are normative. The shared theme explicitly sets primary and link interaction colors to preserve readable contrast in every state.

### Primary

- **Clear Blue** (`primary`): primary buttons, informational feedback, caret, destination emphasis, and keyboard outlines.
- **Deep Blue / Pressed Blue** (`primary-hover`, `primary-active`): explicit high-contrast interaction states in the shared theme.
- **Deep Blue** (`link`): links and selected navigation text. The darker `link-hover` and `link-active` steps preserve contrast for interactive link labels.
- **Pale Blue** (`selected-navigation`, `selected-row`, `selected-row-hover`, `selection`): navigation selection, selected table rows, row hover, and text selection respectively. These roles remain distinct.

### Secondary

- **Slate** (`secondary`): descriptions, form labels, secondary text, and neutral classifications. It is a supporting text color rather than a competing brand accent.
- **Muted Slate** (`placeholder`): placeholder text.

### Neutral

- **Ink** (`text`): primary content, headings, and product names.
- **Cool Canvas** (`canvas`): desktop workspace background.
- **White** (`surface`): containers, navigation, header, inputs, and mobile canvas.
- **Control Slate** (`border`): visible outlines for interactive controls.
- **Pale Divider** (`divider`): table boundaries, panel borders, and content separators.
- **Cool Header / Recessed Track** (`table-header`, `track`): table headers, menu hover, segmented-control tracks, and quiet shell dividers.

Classification A pairs Class A Blue with Pale Blue; B pairs violet text and a pale violet surface; C pairs Slate with its cool neutral surface. These are semantic tags, not alternate themes. Warning uses amber text on pale amber, pending uses muted blue, aligned uses blue-gray, and no-history uses neutral Slate. Preserve the text label with every status. Standard Ant Design alert, validation, loading, and success feedback retain the library's semantic colors.

**The Selection Rule.** Use pale blue to identify the active product or navigation destination; reserve solid blue for actions and deliberate emphasis.

## Typography

**Display and Body Font:** IBM Plex Sans Thai, with sans-serif fallback. Regular (400), Medium (500), and SemiBold (600) are local TTF files under `frontend/public/fonts/`, accompanied by their OFL license. Font loading uses `swap`; synthetic fonts are disabled.

The same family supports Thai and Latin labels without switching voice. Use sentence-style labels and readable Thai line spacing. Numerals are tabular so quantities and identifiers align in comparison views.

### Hierarchy

- **Display:** the large desktop sign-in introduction; it is hidden in the narrow sign-in layout.
- **Headline:** workspace page headings. Narrow screens reduce these to 23px; the sign-in form heading is 30px.
- **Title:** panel and account headings. Product headings use 17px on desktop and 20px in the narrow drawer; storage values use 26px.
- **Body:** standard Ant Design controls and content. Global unstyled text uses line height 1.6; standard Ant Design body text follows the frontmatter role.
- **Table:** compact product rows, summaries, and form help. Product links allow wrapping with line height 1.55; explanatory panel copy can use 1.9.
- **Label:** account details, references, footnotes, and status labels. Buttons use Medium weight; headings and brand use SemiBold.

**The Readable Numbers Rule.** Keep numeric comparisons aligned, label their units, and retain tabular numerals.

## Layout

Use a white application shell with a desktop sidebar (212px), header (64px), and flexible content area. Desktop content padding is 24px vertically and 28px horizontally, with 32px below. Repeated space follows the frontmatter scale; fine form-label separation also uses 6px.

The implemented ABC screen has a flexible results area beside a 360px bordered panel, separated by 24px. The panel uses 24px padding. At widths below 1200px, the panel becomes a full-width right Drawer opened by product selection, while the sidebar remains until the next breakpoint. Table product identifiers move into the product cell at this width.

Below 992px, the canvas becomes white, the sidebar becomes a menu Drawer, horizontal content padding becomes 16px, and the workbench is one column. The table retains product, ABC, and current slot; status moves beneath the product name. Date and filter controls expand across the available width. Main narrow-screen controls and product links have a minimum height of 44px. The location Drawer uses safe-area-aware bottom padding and a sticky action area.

At 1400px and above the date controls fit on a single toolbar row; smaller layouts wrap with a visible date label. The desktop sign-in layout is split 46%/54%, with a form capped at 390px. Below 992px it becomes a single white column and omits the introductory display copy.

## Elevation & Depth

Working panels and tables are flat at rest: white fill, a thin divider-colored border, and no custom shadow. Primary and default button shadows are explicitly disabled. Depth comes from canvas contrast, selected-row tint, and dividers. Standard Ant Design segmented selection, popovers, date/select menus, messages, and Drawers retain their library elevation; do not flatten these feedback layers indiscriminately.

**The Flat Workspace Rule.** Use borders and tonal separation for working surfaces; reserve floating elevation for standard interactive overlays.

State transitions use Ant Design's configured mid and slow durations (0.18s and 0.22s). `prefers-reduced-motion` disables Ant Design motion through the provider and keeps scrolling automatic. Do not introduce decorative motion.

## Shapes

Controls have gently curved corners; larger tables and working panels use the surface radius. Tags use the smaller library radius. Use visible one-pixel control borders and quieter one-pixel container borders. ABC and status tags are borderless. Preserve the native silhouettes, icons, control affordances, and validation behavior of Ant Design rather than recreating them.

## Components

### Buttons

Use standard Ant Design primary, default, link, and text buttons. Primary buttons have white text and a solid blue fill; default buttons have white fill and a visible control border. Both are flat. Standard desktop controls are 38px high, with 15px inline button padding. Sign-in buttons and the main narrow-screen controls are at least 44px high. Product links are Ink at rest and Deep Blue on hover; explanatory links use the standard blue link treatment. Keep loading and disabled states native. Keyboard-visible buttons and links receive a two-pixel blue outline offset by three pixels.

### Inputs / Fields

Use standard Ant Design Form, Input, Select, DatePicker, and Checkbox. Inputs are white, visibly outlined, and gently rounded, with Slate labels and muted placeholder text. Preserve library focus, error, disabled, and busy states. Labels remain visible; the date field label is hidden only in the wide toolbar composition. Sign-in fields are at least 44px high.

### Navigation

Use Ant Design Menu on a white sidebar. Items are 44px high with Slate default text, a cool hover surface, and pale blue selection with Deep Blue text. The sidebar includes the text wordmark and account summary; compact navigation opens in a left Drawer. Keep the header white with a quiet bottom divider.

### Chips

ABC chips show the letter and its semantic tint. Status chips show a short Thai phrase, 24px line height, small type, and 10px horizontal padding. Neither chip family has a visible border. Classification and status remain separate concepts; use the implemented role colors rather than arbitrary tag colors.

### Cards / Containers

Working panels, account sections, and user sections use white fill, a divider-colored border, surface corners, and 24px internal padding. A narrow Drawer uses 16px side padding and a white body. Keep actions grouped, with help or state text adjacent to the action it explains.

### Tables

Use Ant Design Table with compact body typography, cool header fill, Slate header text, 15px vertical and 12px horizontal cell padding, and pale blue selected rows. Columns carry visible labels; numeric frequency aligns right. The responsive variants preserve the key identifying fields and move secondary information into the product cell where necessary. Keep native selection and empty-state controls.

### Feedback

Use Ant Design Alert, message, Empty, Skeleton, and loading affordances. Errors and sample-data notices use visible text; do not rely on a color tint alone. Selection and pending state must stay distinguishable while current and destination locations remain separately labeled.

## Do's and Don'ts

### Do:

- **Do** use Clear Blue consistently through the shared Ant Design theme.
- **Do** keep the narrow-screen canvas and Drawer body white.
- **Do** load the local IBM Plex Sans Thai weights and retain tabular numerals.
- **Do** preserve visible control boundaries, keyboard focus, and reduced-motion preferences.
- **Do** pair semantic tints with readable classification or status text.
- **Do** build standard controls, tables, forms, menus, and overlays with Ant Design.

### Don't:

- **Don't** reintroduce the replaced green identity or treat historical Graphite and Navy studies as active themes.
- **Don't** add a dark-theme toggle to the current interface.
- **Don't** turn flat working panels into decorative elevated cards.
- **Don't** use status colors as interchangeable brand accents.
- **Don't** introduce remote font dependencies or decorative raster imagery into this established interface without a new design decision.
