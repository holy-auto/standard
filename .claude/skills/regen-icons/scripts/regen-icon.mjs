#!/usr/bin/env node
// Regen Icons helper. Node built-ins only.
//
//   node regen-icon.mjs search <words...>            find icons by name/keyword
//   node regen-icon.mjs svg <name> [--filled]         print the raw SVG
//   node regen-icon.mjs react <names...> [--base]     print React (TSX) components
//   node regen-icon.mjs native <names...> [--base]    print React Native (react-native-svg) components
//
// A name ending in "-filled" (e.g. circle-check-filled) uses the filled twin.
// --base also prints the shared <Svg> wrapper; emit it once per project file.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const args = rest.filter((a) => !a.startsWith("--"));

const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

function catalog() {
  return readFileSync(join(root, "catalog.md"), "utf8")
    .split("\n")
    .filter((l) => l.startsWith("- `"))
    .map((l) => {
      const [head, exp, cats, kw] = l.slice(2).split(" · ");
      return {
        name: head.match(/`([^`]+)`/)[1],
        filled: head.includes("●"),
        exp,
        cats,
        kw,
        line: l,
      };
    });
}

function resolve(name) {
  const filled = name.endsWith("-filled") || flags.has("--filled");
  const base = name.replace(/-filled$/, "");
  const file = join(root, "svg", filled ? "filled" : "outline", `${base}.svg`);
  if (!existsSync(file)) {
    const hint = catalog()
      .filter((i) => i.name.includes(base) || base.includes(i.name))
      .map((i) => i.name)
      .slice(0, 8);
    die(`No ${filled ? "filled " : ""}icon "${base}".${hint.length ? ` Similar: ${hint.join(", ")}` : ""} Try: search <word>`);
  }
  return { base, filled, svg: readFileSync(file, "utf8").trim() };
}

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

function paths(svg) {
  return [...svg.matchAll(/<path ([^>]*?)\/>/g)].map((m) => {
    const attrs = {};
    for (const a of m[1].matchAll(/([a-z-]+)="([^"]*)"/g)) {
      attrs[a[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = a[2];
    }
    return attrs;
  });
}

const jsxAttrs = (attrs) =>
  Object.entries(attrs)
    .map(([k, v]) => (k === "opacity" ? `opacity={${Number(v)}}` : `${k}="${v}"`))
    .join(" ");

const REACT_BASE = `import * as React from "react";

// Regen Icons (MIT, https://github.com/kazdenc/regen-icons)
export type IconSize = "xs" | "sm" | "md" | "lg" | number;
export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> & {
  /** xs 12 / sm 16 / md 20 / lg 24, or a pixel number. Default sm. */
  size?: IconSize;
  /** Stroke width on the 24 grid. Default 2 up to 20px, 1.75 at 24px and above. */
  weight?: 1.5 | 1.75 | 2;
  /** Accessible name. Omit for decorative icons next to visible text. */
  label?: string;
};

const px = { xs: 12, sm: 16, md: 20, lg: 24 } as const;

export function Svg({ size = "sm", weight, label, children, ...rest }: IconProps & { children: React.ReactNode }) {
  const n = typeof size === "number" ? size : px[size];
  const dim = typeof size === "number" ? size : \`var(--regen-icon-\${size}, \${n}px)\`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight ?? (n >= 24 ? 1.75 : 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: "img" } : { "aria-hidden": true })}
      {...rest}
    >
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  );
}
`;

const NATIVE_BASE = `import * as React from "react";
import Svg, { Path, type SvgProps } from "react-native-svg";

// Regen Icons (MIT, https://github.com/kazdenc/regen-icons)
export type IconProps = Omit<SvgProps, "width" | "height"> & {
  size?: number; // default 16
  color?: string; // default "#000"; drives stroke and the filled tint via currentColor
  weight?: 1.5 | 1.75 | 2;
  label?: string;
};

export function RegenSvg({ size = 16, color = "#000", weight, label, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color={color}
      fill="none"
      stroke="currentColor"
      strokeWidth={weight ?? (size >= 24 ? 1.75 : 2)}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityLabel={label}
      accessible={!!label}
      {...rest}
    >
      {children}
    </Svg>
  );
}
`;

function components(names, native) {
  if (!names.length) die("Give at least one icon name.");
  const out = [];
  if (flags.has("--base")) out.push(native ? NATIVE_BASE : REACT_BASE);
  for (const name of names) {
    const { base, filled, svg } = resolve(name);
    const id = `Icon${pascal(base)}${filled ? "Filled" : ""}`;
    const kids = paths(svg).map((a) => {
      return native ? `<Path ${jsxAttrs(a)} />` : `<path ${jsxAttrs(a)} />`;
    });
    const body = kids.length === 1 ? kids[0] : `<>${kids.join("")}</>`;
    out.push(
      native
        ? `export const ${id} = (p: IconProps) => <RegenSvg {...p}>${body}</RegenSvg>;`
        : `export const ${id} = (p: IconProps) => <Svg {...p}>${body}</Svg>;`,
    );
  }
  console.log(out.join("\n"));
}

switch (cmd) {
  case "search": {
    const words = args.map((w) => w.toLowerCase());
    if (!words.length) die("Give a search word.");
    const hits = catalog()
      .map((i) => {
        const nameTokens = i.name.split("-");
        const tokens = `${i.kw} ${i.cats}`.toLowerCase().split(/[\s,/]+/).filter(Boolean);
        const score = words.reduce(
          (s, w) =>
            s +
            (i.name === w ? 5 : 0) +
            (nameTokens.includes(w) ? 3 : 0) +
            (tokens.includes(w) ? 2 : 0) +
            (w.length >= 4 && [...nameTokens, ...tokens].some((t) => t.startsWith(w)) ? 1 : 0),
          0,
        );
        return { i, score };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score || a.i.name.length - b.i.name.length);
    if (!hits.length) die(`No match for "${args.join(" ")}". Read catalog.md for the full list.`);
    console.log(hits.slice(0, 20).map((h) => h.i.line).join("\n"));
    break;
  }
  case "svg":
    if (!args[0]) die("Give an icon name.");
    console.log(resolve(args[0]).svg);
    break;
  case "react":
    components(args, false);
    break;
  case "native":
    components(args, true);
    break;
  default:
    die("Usage: regen-icon.mjs search|svg|react|native ... (see header comment)");
}
