---
name: regen-icons
description: Use Regen Icons (225 outline SVG icons on a 24px grid, stroke 2, round caps, plus 159 tonal filled twins) whenever you add, pick, or replace an icon in this project's UI — buttons, nav, menus, status badges, empty states, tabs, forms. Covers finding an icon by keyword, and emitting it as inline SVG, a React/TSX component, or a React Native (react-native-svg) component. Trigger on "add an icon", "icon for X", "アイコン", building any new screen or component that shows icons.
---

# Regen Icons

This project's standard icon set is **Regen Icons** (MIT, https://github.com/kazdenc/regen-icons).
Everything needed is bundled next to this file, so no npm install or network access is required.

- `catalog.md` — every icon: name, React export name, categories, keywords. `●` marks a filled twin.
- `svg/outline/<name>.svg` — the primary set. `svg/filled/<name>.svg` — filled twins.
- `scripts/regen-icon.mjs` — search and code generation (Node built-ins only).

Paths below are relative to this skill directory (`.claude/skills/regen-icons/`).

## Policy

0. If this project's own docs (CLAUDE.md, AGENTS.md, DESIGN_SYSTEM.md or similar) name a different icon standard, that rule wins over this skill; use Regen there only when the user asks. Check before adding icons.
1. Otherwise, for any **new** icon, use Regen Icons. Don't add another icon library and don't hand-draw an icon that the set already has.
2. **Don't mass-replace** icons that already exist in the project (lucide, heroicons, react-icons, MUI, emoji, etc.) unless the user asks. When you're already editing a component that uses another library, keeping that component consistent is fine; mention the option to switch.
3. If no Regen icon fits, say so, then use the project's existing icon library if it has one. As a last resort draw a simple SVG in the same style: 24×24 viewBox, `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`, content inside 2–22.
4. Never edit the bundled SVG files; they are generated upstream.

## 1. Find the icon

Search by English keyword (the catalog is English; translate Japanese terms first, e.g. 設定 → settings, 予約 → calendar, 支払い → credit-card / wallet. If nothing matches, follow policy 3):

```bash
node .claude/skills/regen-icons/scripts/regen-icon.mjs search settings
```

Or read/grep `catalog.md`. Names are kebab-case, object first then modifier: `file-text`, `arrow-up-right`, `circle-check`.

Use a **filled twin** (`<name>-filled`) only to show an active / selected state of the same icon (e.g. current tab, starred). Default to outline.

## 2. Put it in the code

First look at how the project is built (package.json, framework, existing `components/` layout) and where shared UI lives.

### React / Next.js (web)

Keep **one** project file for all Regen icons, e.g. `src/components/icons/regen.tsx` (follow the project's existing folder and naming conventions; reuse the file if it already exists — search for `Regen Icons (MIT` to find it).

- File doesn't exist yet: generate it with the shared wrapper.

  ```bash
  node .claude/skills/regen-icons/scripts/regen-icon.mjs react home settings circle-check-filled --base > src/components/icons/regen.tsx
  ```

- File exists: generate without `--base` and append only the icons that are missing.

  ```bash
  node .claude/skills/regen-icons/scripts/regen-icon.mjs react bell trash >> src/components/icons/regen.tsx
  ```

- If the project is plain JS (no TypeScript), convert the output: drop the `type`/`IconProps` annotations and name the file `.jsx`.
- No `"use client"` needed: the components have no hooks or state, so they work in Server Components too.

Usage:

```tsx
import { IconHome, IconSettings } from "@/components/icons/regen";

<IconHome />                         // 16px, decorative (aria-hidden)
<IconHome size="md" />               // xs 12 / sm 16 / md 20 / lg 24 / or a number
<IconSettings label="設定" />         // standalone icon: announced to screen readers
```

### React Native / Expo

Requires `react-native-svg` (Expo: `npx expo install react-native-svg`; check package.json first). Same one-file approach, e.g. `components/icons/regen.tsx`:

```bash
node .claude/skills/regen-icons/scripts/regen-icon.mjs native home settings --base > components/icons/regen.tsx
```

Usage: `<IconHome size={20} color={theme.text} />`. `color` drives the stroke and the filled tint.

### Plain HTML, Vue, Svelte, Astro, server templates

Inline the SVG markup:

```bash
node .claude/skills/regen-icons/scripts/regen-icon.mjs svg home
```

Paste the output where the icon goes (or make a small component in the framework's style around it). Keep `stroke="currentColor"` and set colour on the parent text. If the icon is standalone, replace `aria-hidden="true"` with `role="img"` plus `aria-label="..."`.

### Flutter / native apps / image assets

Copy the needed files from `svg/outline/` into the project's asset folder (e.g. `assets/icons/`) and load them with the platform's SVG loader (Flutter: `flutter_svg` with `colorFilter` for colour). Only copy the icons you use.

## 3. Usage rules

- An icon next to a visible text label is decorative: no `label`.
- An icon that stands alone (icon-only button, status glyph) needs a `label`, **or** the button needs `aria-label` — never both.
- Pick a size prop; don't scale with CSS `transform`/`font-size` hacks.
- Colour comes from `currentColor`: set `color` on the parent (Tailwind `text-*`), not on the icon's paths.
- Don't animate the icon itself; animate a wrapper and respect `prefers-reduced-motion`.
- Default stroke is 2 up to 20px and 1.75 at 24px+. Use `weight={1.5}` only for large, airy decorative use.

## License

Regen Icons is MIT licensed (see `LICENSE` in this directory). Keep the `Regen Icons (MIT, ...)` comment in generated files; that is the attribution.

Bundled from kazdenc/regen-icons @ 64c0e16. To update, rebuild this directory from a newer upstream checkout.
