# UI/UX Revamp Roadmap — Idea Incubator

> **Current state:** Functional, accessible, but visually flat and generic. Uses a 6-variable color system, system font stack, and minimal component states in `packages/ui`.
> **Target state:** A cohesive, premium-feeling design system built on "Modern Flat" styling with a teal identity.

---

## Design Direction

**Style:** Modern Flat Design — clean, 2D, minimal shadows, strong typography, refined borders.
**Palette:** Teal primary (`#0D9488`) + amber accent (`#F59E0B`), semantic color tokens for every state.
**Typography:** Plus Jakarta Sans (300–700 weights) loaded from Google Fonts with system fallbacks.
**Motion:** Subtle micro-interactions, 150–300ms transitions, stagger list entrance. All gated behind `prefers-reduced-motion`.

---

## Milestone 1 — Design Tokens (foundation)

**Goal:** Establish the source of truth every component will reference.

| Task | Details |
|------|---------|
| Extend color tokens | Add `--color-primary`, `--color-secondary`, `--color-accent`, success/warning/danger/info to `apps/client/src/assets/styles/global.css` |
| Define semantics | Map each token to light + dark values with ≥4.5:1 contrast |
| Typography scale | Heading sizes (2xl→base), body, small with line-height tokens |
| Spacing system | `--space-xs` (4px) → `--space-3xl` (64px) rhythm |
| Shadow system | 4 levels: `--shadow-xs/sm/md/lg` for cards, modals, dropdowns |
| Radius tokens | `--radius-sm/md/lg` (6/10/16px) |
| **Exit criteria** | Token table documented, both themes render correctly, no hardcoded colors remain in UI primitives |

**Files:** `apps/client/src/assets/styles/global.css`, all files under `packages/ui/src/`

---

## Milestone 2 — Typography & Brand

**Goal:** Distinct brand voice via typography.

| Task | Details |
|------|---------|
| Load Plus Jakarta Sans | Google Fonts import, weights 300–700, `display=swap` |
| Configure fallbacks | `system-ui` stack with graceful degradation |
| Letter-spacing scale | `--tracking-tight/normal/wide` for headings vs body |
| Font-feature settings | `ss01`, `cv01` etc. for optical polish |
| **Exit criteria** | Font loads with zero FOUT/FOIT flash, headings clearly distinct from body |

**Files:** `apps/client/index.html` (preconnect + font link), `apps/client/src/assets/styles/global.css`

---

## Milestone 3 — UI Component Refinement

**Goal:** Every primitive in `packages/ui/src/` polished and consistent.

| Component | Improvements |
|-----------|-------------|
| `Button` | Active/pressed state (`scale-[0.98]`), `isLoading` prop, disabled clarity, all 4 variants tokenized |
| `Card` | `interactive` prop with hover lift + border tint, optional `padding` size |
| `Input`/`Textarea` | Ring-2 focus with 40% opacity tint, placeholder color token, disabled bg |
| `Modal` | Backdrop blur + fade, scale-in entrance (200ms), `rounded-lg`, refined header divider |
| `Badge` | All tones from tokens (no hardcoded emerald/amber/red), subtle dot indicator support |
| `ProgressBar` | Animated fill (300ms), tone prop, striped/indeterminate mode |
| `Skeleton` | Shimmer sweep animation (respects reduced-motion) |
| `EmptyState` | Consistent icon + headline + body + action layout |
| **Exit criteria** | All primitives use tokens only; refined hover/focus/active/pressed states |

**Files:** all files in `packages/ui/src/`

---

## Milestone 4 — App Shell Polish

**Goal:** Cohesive chrome around all content.

| Task | Details |
|------|---------|
| Header | `backdrop-blur` + subtle bg, refined active nav (accent pill/underline), consistent heights |
| Mobile sidebar | Smooth slide-in (200ms ease), polish active item to accent-tinted pill |
| Footer | Refined typography + spacing, subtle top border |
| Page transitions | Fade/slide-in on route change (respect reduced-motion) |

**Exit criteria:** Nav states clear in both themes, sidebar animation smooth, no layout shift.

**Files:** `apps/client/src/components/layout/RootLayout.tsx`, `apps/client/src/App.tsx`

---

## Milestone 5 — Feature Page Polish

**Goal:** High-traffic pages feel premium.

| Page | Focus |
|------|-------|
| Dashboard | Stat cards with token lift, chart color matching palette, activity items refined |
| Roadmap/Kanban | Column header polish, card hover elevation, drag-over glow, status color coding |
| Idea detail | Hero header section, status badge tiers, refined metadata row |
| Ideas list | Consistent card structure, tag chips, grid/list toggle anim |
| Shared/Active share | Recipient chips with avatars, role badge polish |
| Settings | Row hover states, grouped sections with headers |

**Exit criteria:** No page uses outdated tokens; most-trafficked flows feel cohesive.

**Files:** `apps/client/src/features/**/pages/*.tsx`

---

## Milestone 6 — Micro-interactions & Motion

**Goal:** Life without sacrificing performance.

| Task | Details |
|------|---------|
| Button/Icon pressed feedback | 80–120ms press, release spring |
| List stagger | 300ms fade/slide, `--motion-moderate` token |
| Card hover | Elevation + 1px lift over 200ms |
| Toast enter/exit | Slide-in + fade, auto-dismiss with progress |
| Reduced motion | All above gated behind `prefers-reduced-motion` |
| **Exit criteria** | Motion feels responsive (<200ms response), jank-free, reduced-motion respected |

**Files:** CSS in `apps/client/src/assets/styles/global.css`, components in `packages/ui/src/`

---

## Milestone 7 — QA & Hardening

**Goal:** Ship with confidence.

| Task | Details |
|------|---------|
| Lint + typecheck + build | `pnpm lint && pnpm typecheck && pnpm build` |
| Contrast audit | Both themes, body text ≥4.5:1, non-text ≥3:1 |
| Focus states | Keyboard-only audit across all interactive elements |
| Responsive pass | 375px / 768px / 1024px / 1440px |
| Reduced-motion pass | Verify no auto-animation overrides |
| Dark mode parity | Every screen checked independently |
| **Exit criteria** | CI green, no a11y regressions, both themes pixel-checked |

---

## Phasing

| Phase | Scope | Est. impact |
|-------|-------|-------------|
| **Now** | M1–M3 (tokens, typography, components) | Core foundation — biggest impact |
| **Next** | M4–M5 (shell + key pages) | Visible polish on main flows |
| **Later** | M6–M7 (motion + QA) | Refinement & hardening |

---

## Reference

- Master design system: see `design-system/idea-incubator/MASTER.md`
- Design system content generated via the `ui-ux-pro-max` skill (`.opencode/skills/ui-ux-pro-max/`)
