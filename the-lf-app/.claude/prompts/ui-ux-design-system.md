# Cubewise — UI/UX Design System Prompt

Use this prompt to give a Claude agent full context on the app's visual design without codebase access.

---

## Prompt

You are working on **Cubewise**, a dark-mode speedcubing coaching web app built with Next.js (App Router), TypeScript, and Tailwind CSS v4. The entire interface is dark-only. There is no light mode.

---

### Palette & Design Tokens

The color system uses OKLCH tokens exposed as CSS variables and consumed via Tailwind semantic classes. All custom values below are defined in `globals.css`.

**Semantic Tailwind classes (use these, not raw hex):**
| Class | Role |
|---|---|
| `bg-background` | Page background — near-black |
| `bg-card` | Card surface — slightly lifted from background |
| `bg-muted` | Subtle fill (inputs, pills) |
| `bg-accent` | Hover/active fill on nav items |
| `text-foreground` | Primary text — near-white |
| `text-muted-foreground` | Secondary text — medium gray |
| `border-border` | Default border |
| `bg-primary` / `text-primary-foreground` | High-emphasis CTA — white button, black text |
| `bg-destructive` | Destructive action — muted red |
| `ring-ring` | Focus ring |

**Raw CSS variables (for inline styles or custom CSS only):**
```
--bg-base: #0d0d0d         page canvas
--bg-card: #111111         card surface
--bg-card-hover: #161616   card hover state
--border-default: #1a1a1a  lightest border
--border: #222222          standard border
--border-hover: #2a2a2a    border on hover
--text-primary: #ffffff
--text-secondary: #cccccc
--text-muted: #888888
--text-dim: #555555
--text-dimmer: #444444
--accent-blue: #3b82f6
--accent-purple: #8b5cf6
--accent-green: #22c55e
--accent-amber: #f59e0b
--accent-red: #ef4444
```

Text hierarchy (darkest = most emphasis): `text-foreground` → `text-secondary` → `text-muted-foreground` → `text-dim` → `text-dimmer`.

---

### Typography

Three custom fonts are loaded and mapped to utility classes:

| Font | Class | Usage |
|---|---|---|
| Syne (700, 800) | `font-syne` | Display headings, marketing text |
| DM Sans (300, 400, 500) | `font-dm-sans` | Body, UI labels, nav |
| DM Mono (400, 500) | `font-dm-mono` | Timestamps, solve times, code |

**Scale conventions:**
- Page title: `text-2xl font-bold tracking-tight text-foreground`
- Section header: `text-[10px] uppercase font-medium tracking-[0.08em] text-muted-foreground`
- Card title: `text-lg font-semibold` or inline `font-size: 26px; font-weight: 700; letter-spacing: -0.01em`
- Body: `text-sm font-light leading-relaxed text-muted-foreground` (14px / 300 weight / 1.65 line-height)
- Helper/meta: `text-xs text-muted-foreground` (12px)

---

### Spacing & Sizing

- **Base unit:** 8px (Tailwind `gap-2` = 8px)
- **Page padding:** `px-8 py-8` (32px)
- **Max content width:** `max-w-5xl` (1024px)
- **Card padding:** `p-5` or `p-6` (20–24px)
- **Gap between cards:** `gap-4` or `gap-6` (16–24px)
- **Gap between sections:** `gap-8` (32px)

**Border radius:**
- Cards: `rounded-xl` (12px)
- Buttons / inputs: `rounded-md` or `rounded-lg` (6–8px)
- Badges / pills: `rounded-full`
- Modals: `rounded-xl` (16px)

---

### Layout Structure

```
┌──────────────────────────────────────────────┐
│  Sidebar (256px expanded / 56px collapsed)   │  ← fixed height, shrink-0
│  + Main content area (flex-1, overflow-y-auto)│
└──────────────────────────────────────────────┘
```

**Sidebar — expanded:**
- Header: app icon (36×36) + "Cubewise" wordmark + collapse chevron, `px-4 py-4`
- Nav: `flex-col gap-0.5`, items are `rounded-lg px-3 py-2.5 text-base`
- Active item: `bg-accent font-medium text-foreground`
- Inactive item: `text-muted-foreground hover:bg-accent/60 hover:text-foreground`

**Sidebar — collapsed (icon-only):**
- Width shrinks to 56px; labels disappear
- Each nav item renders as a centered icon-only link with `rounded-lg p-2`
- Active icon: `bg-accent text-foreground`
- Expand chevron sits above the icons

**Main content:**
- `flex-1 min-w-0 overflow-y-auto`
- Inner wrapper: `max-w-5xl mx-auto px-8 py-8`

---

### Component Patterns

#### Buttons

**Primary (white CTA):**
```tsx
<button className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5
  text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85">
  Start Analysis
</button>
```

**Secondary / outline:**
```tsx
<button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium
  text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
  Cancel
</button>
```

**Icon button (sidebar, top-nav):**
```tsx
<button className="rounded-md p-2 text-muted-foreground transition-colors
  hover:bg-accent hover:text-foreground">
  <Icon className="h-4 w-4" />
</button>
```

**Destructive:**
```tsx
<button className="rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium
  text-white transition-opacity hover:opacity-85">
  Delete
</button>
```

---

#### Cards

**Standard content card:**
```tsx
<div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold text-foreground">Card Title</h2>
    <span className="text-xs text-muted-foreground">Meta</span>
  </div>
  <p className="text-sm font-light leading-relaxed text-muted-foreground">
    Body content here.
  </p>
</div>
```

**Stat card (dashboard metrics):**
```tsx
<div className="rounded-xl border border-border bg-card p-5 transition-colors
  hover:border-border/70">
  <p className="mb-2.5 text-[10px] uppercase font-medium tracking-[0.08em]
    text-muted-foreground">
    Avg Time
  </p>
  <p className="text-2xl font-light tracking-tight text-foreground">18.42s</p>
  <p className="mt-1 text-[11px] font-light text-muted-foreground">−0.8s this week</p>
</div>
```

**Recommended lesson card (with decorative gradient):**
- Border-radius 16px, border `border-border`, bg `bg-card`
- 1px top accent line: `linear-gradient(90deg, transparent, #3b82f6 40%, #8b5cf6 70%, transparent)` at 70% opacity
- Corner glow (top-right): `radial-gradient(circle at top right, rgba(59,130,246,0.06), transparent)` 220px circle

---

#### Inputs & Forms

**Text input:**
```tsx
<input className="h-9 w-full rounded-md border border-input bg-transparent px-3
  text-sm outline-none transition-[color,box-shadow]
  placeholder:text-muted-foreground
  focus:border-ring focus:ring-[3px] focus:ring-ring/50
  disabled:cursor-not-allowed disabled:opacity-50" />
```

**Toggle switch:**
```tsx
<button
  role="switch"
  className={cn(
    "relative h-[22px] w-10 rounded-full border transition-colors",
    checked
      ? "border-foreground bg-foreground"
      : "border-border bg-transparent",
  )}
>
  <span className={cn(
    "absolute top-[2px] h-4 w-4 rounded-full transition-[left]",
    checked ? "left-[22px] bg-background" : "left-[2px] bg-muted-foreground",
  )} />
</button>
```

---

#### Badges & Pills

**Track badge:**
```tsx
<span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium
  text-background">
  CFOP
</span>
```

**Status pill (active lesson, coming soon):**
```tsx
// Active
<span className="rounded-full border border-[#1d3557] bg-[#0d1f35] px-2.5 py-0.5
  text-[10px] font-medium text-[#3b82f6]">
  Current
</span>

// Coming Soon
<span className="rounded-full border border-border px-2.5 py-0.5
  text-[10px] font-medium text-muted-foreground opacity-60">
  Coming Soon
</span>
```

---

#### Modals & Dialogs

```tsx
// Backdrop
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

  // Panel
  <div className="relative z-10 w-full max-w-sm rounded-xl border border-border
    bg-card p-6 shadow-lg">
    <h2 className="text-base font-semibold text-foreground">Dialog Title</h2>
    <p className="mt-2 text-sm text-muted-foreground">Description text.</p>

    <div className="mt-5 flex justify-end gap-2">
      <button className="rounded-lg border border-border px-3 py-1.5 text-sm
        text-muted-foreground hover:bg-accent">
        Cancel
      </button>
      <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium
        text-primary-foreground hover:opacity-85">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

### States

| State | Treatment |
|---|---|
| Active / selected | `bg-accent text-foreground font-medium` |
| Hover | `hover:bg-accent/60 hover:text-foreground` or border-color lift |
| Disabled | `opacity-50 cursor-not-allowed pointer-events-none` |
| Locked (content gating) | `opacity-20 pointer-events-none` |
| Completed | `opacity-50` (dimmed, still readable) |
| Destructive hover | `hover:opacity-85` on red bg |

---

### Animations

```css
/* Fade-up entry (all page sections) */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 0.22s ease-out both; }

/* Pulsing ring (current lesson indicator) */
@keyframes ring-pulse {
  0%, 100% { border-color: #1d4ed8; }
  50%       { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
}
```

- Interactive transitions: `transition-colors` or `transition-all duration-150`
- No animations on skeleton/loading states — use `animate-pulse` from Tailwind
- Scrollbars: thin, `scrollbar-color: #1d1d1d transparent`

---

### Do / Don't

**Do:**
- Use semantic token classes (`text-foreground`, `bg-card`, `border-border`) — not raw hex in JSX
- Keep border-radius consistent: `rounded-xl` for cards, `rounded-lg` for buttons/inputs
- Use `text-[10px] uppercase tracking-[0.08em]` for all section labels
- Fade-up entry animations on new content sections
- `transition-colors` on every interactive element

**Don't:**
- Use light backgrounds or light mode assumptions
- Use `font-bold` on body text — prefer `font-medium` (500) max for UI, `font-light` (300) for prose
- Skip `shrink-0` on icons inside flex containers
- Use hard-coded pixel colors in className — only in `style={{}}` when a CSS variable isn't exposed as a Tailwind token
- Add box shadows heavier than `shadow-sm` on cards (modals get `shadow-lg`)
