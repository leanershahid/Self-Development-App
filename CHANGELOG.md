# Changelog

## Dark cinematic redesign (app-wide)

All ~31 app pages (todos, habits, mood, finance, achievements, settings, etc.) were rebuilt on a shared component library at `src/components/ui/` (Button, Input, Select, Textarea, Checkbox, Switch, RadioGroup, Card, Badge, KpiCard, Table, Modal, ConfirmDialog, Toast, Tabs, Dropdown, Skeleton, EmptyState, Avatar) and a single token system in `src/index.css`.

The visual direction went through two iterations before landing here:
1. First pass: a light enterprise SaaS look (Navy/Slate/Emerald).
2. Final direction: a **dark, high-contrast, single-accent cinematic look** — near-black background (`#05070a`), dark surfaces (`#0d1117`), Emerald `#10B981` as the one accent color used for both primary actions and success states, off-white text, and "Space Grotesk" for headings (paired with the existing "Inter" for body text).

Because every page consumes the same CSS custom properties (`--bg`, `--surface`, `--text`, `--text-muted`, `--border`) and Tailwind-registered theme colors (`bg-primary`, `text-accent`, etc.) rather than hardcoded colors, this second shift was applied by changing the token **values** in one file (`src/index.css`) plus a handful of literal-color leaks that didn't go through tokens (field backgrounds, a sidebar fill, a few chart tooltip/grid colors) — not by rewriting each page again.

Navigation moved from the old single dark top-bar to a new shell at `src/components/layout/` (`Sidebar` as a mobile-only drawer, `Topbar`/`DesktopNav` for desktop), now styled with the dark surface tokens.

**Motion**: the shared `Card`, `Button`, `IconButton`, and `Badge` components now carry a consistent set of animations — cards fade/slide in on mount and lift slightly on hover, buttons press down on click and lift on hover, icon buttons scale on hover, and badges scale in when they appear — so motion is consistent everywhere these primitives are used, without needing to touch every page individually.

All data logic, Supabase queries, and existing features (including the achievement↔reward auto-unlock link) were preserved throughout — only the visual layer changed. Native `alert()`/`window.confirm()` calls were replaced with the `Toast`/`ConfirmDialog` components where pages were redesigned.

**Known pre-existing limitations, unchanged by this redesign:** this project's ESLint config lacks `eslint-plugin-react`, so `no-unused-vars` doesn't recognize `<motion.div>` JSX usage (shows as a false "unused" error across the app) and the `react-hooks/immutability`/`set-state-in-effect` rules flag the app's standard "fetch on mount via `useEffect`" pattern used everywhere. Neither affects runtime behavior.
