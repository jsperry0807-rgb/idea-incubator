# Idea Incubator — Accessibility

## Target: WCAG 2.1 AA

---

## Semantic HTML

- Use `<nav>` for sidebar and header navigation
- Use `<main>` for primary content area
- Use `<header>`, `<footer>` for page landmarks
- Use `<article>` for idea cards
- Use `<section>` with `<h2>` for planning sections
- Use `<button>` for all interactive elements (never `<div onClick>`)
- Use `<a>` for navigation links (not buttons)

---

## ARIA Labels

| Element           | ARIA Attribute                          | Example                                     |
| ----------------- | --------------------------------------- | ------------------------------------------- |
| Sidebar toggle    | `aria-label="Toggle sidebar"`           | `<button aria-label="Toggle sidebar">`      |
| Modal close       | `aria-label="Close modal"`              | `<button aria-label="Close modal">`         |
| Search input      | `aria-label="Search ideas"`             | `<input aria-label="Search ideas">`         |
| Theme toggle      | `aria-label="Switch to dark mode"`      | `<button aria-label="Switch to dark mode">` |
| Notification bell | `aria-label="Notifications (3 unread)"` | Dynamic label                               |
| Kanban column     | `aria-label="Ideas (4 items)"`          | Per column                                  |
| Drag handle       | `aria-label="Drag to reorder"`          | On sortable items                           |
| Tag filter        | `aria-label="Filter by tag: React"`     | Per tag button                              |

---

## Focus Management

### Modals

- Focus moves to first focusable element when modal opens
- Focus returns to trigger button when modal closes
- Tab key cycles within modal (focus trap)
- Esc key closes modal

```tsx
// Modal focus trap pattern
useEffect(() => {
  if (open) {
    const firstFocusable = modalRef.current?.querySelector(
      "button, input, [tabindex]",
    );
    firstFocusable?.focus();
  }
}, [open]);
```

### Route Changes

- Focus moves to main content heading after navigation
- Skip link at top of page: "Skip to main content"

---

## Keyboard Shortcuts

| Key           | Action            | Notes                          |
| ------------- | ----------------- | ------------------------------ |
| `/`           | Focus search      | Prevent default browser search |
| `n`           | Create new idea   | Navigate to create page        |
| `Esc`         | Close modal/panel | Close active overlay           |
| `Cmd+Enter`   | Save form         | Submit active form             |
| `?`           | Show shortcuts    | Open help modal                |
| `Tab`         | Navigate forward  | Standard browser behavior      |
| `Shift+Tab`   | Navigate backward | Standard browser behavior      |
| `Enter/Space` | Activate element  | Standard button/link behavior  |

All shortcuts documented in the `?` help modal.

---

## Color Contrast

| Element                 | Foreground | Background | Ratio  | Pass? |
| ----------------------- | ---------- | ---------- | ------ | ----- |
| Body text               | `#1a1a2e`  | `#ffffff`  | 16.1:1 | AAA   |
| Body text (dark)        | `#e0e0e0`  | `#1a1a2e`  | 12.8:1 | AAA   |
| Status badge (Idea)     | `#6b7280`  | `#f3f4f6`  | 4.8:1  | AA    |
| Status badge (Done)     | `#059669`  | `#d1fae5`  | 4.6:1  | AA    |
| Priority dot (Critical) | `#dc2626`  | `#ffffff`  | 5.6:1  | AA    |
| Link text               | `#2563eb`  | `#ffffff`  | 7.2:1  | AAA   |

**Never rely on color alone** to convey meaning (always pair with text, icon, or shape).

---

## Screen Reader Support

### Live Regions

```tsx
// Announce Kanban drag-and-drop
<div aria-live="polite" className="sr-only">
  {announcement} // "Moved Blog CMS to In Progress"
</div>
```

### List Structure

- Kanban columns are `<ul>` with `<li>` for each card
- Task lists use `<ul>` with `<li>`
- Comment threads use `<ol>` (ordered by time)

### Hidden Content

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

## Images and Icons

- All `<img>` elements have `alt` text
- Decorative icons use `aria-hidden="true"`
- Interactive icons have `aria-label`
- SVG icons use `<title>` element

---

## Forms

- Every input has a visible `<label>` (not just placeholder)
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"` + visual indicator
- Form errors announced to screen readers via `aria-live="assertive"`

```tsx
<Input
  label="Email"
  error={errors.email?.message}
  aria-required="true"
  aria-describedby={errors.email ? "email-error" : undefined}
/>;
{
  errors.email && (
    <span id="email-error" role="alert">
      {errors.email.message}
    </span>
  );
}
```

---

## Testing Accessibility

- Run `axe-core` in CI (via `@axe-core/react` or Playwright axe plugin)
- Manual testing with keyboard only (no mouse)
- Test with VoiceOver (macOS) or NVDA (Windows)
- Lighthouse accessibility audit target: 95+
