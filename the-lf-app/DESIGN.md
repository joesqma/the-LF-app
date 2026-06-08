# Cubewise Design System

## Aesthetic Direction

Clinical performance tool. Think WCA scoreboard meets developer terminal — dense,
data-forward, zero decorative fluff. Every decision serves readability of numbers
and status. The product should feel like it was built by someone who times their
solves to the millisecond and expects their software to match that precision.

No consumer-app warmth. No gamification chrome. No gradients.
Depth comes from surface layering and hairline borders — never from shadows or glow.

---

## Color Palette — Gunmetal Cobalt

All neutrals carry a faint sky-blue chromatic cast. There are no warm tones in
the base surfaces.

### Surfaces

```
--bg:   #0b0f14   ← page background
--s1:   #121820   ← card / sidebar background
--s2:   #19232e   ← nested cells, hover states, inlay backgrounds
--s3:   #202e3c   ← deepest inlay (rarely used)
```

### Border tints (all sky-tinted)

```
--b1:   rgba(56,189,248,0.07)   ← subtle — dividers within a card
--b2:   rgba(56,189,248,0.13)   ← default — card borders, input borders
--b3:   rgba(56,189,248,0.22)   ← strong — hover state borders, active
```

### Text

```
--t1:   #def4ff   ← primary — headings, values, active labels
--t2:   #7aafc8   ← secondary — body, descriptions, inactive nav
--t3:   #3a5870   ← muted — section labels, timestamps, sub-labels
```

### Accent colors — full palette

All 8 accents are available on every page. Each accent has a full color and a
dim variant used for chip/badge backgrounds and icon hover fills.

```
--blue:    #00a8ff   dim: rgba(0,168,255,0.12)    ← primary UI accent
--green:   #16c95a   dim: rgba(22,201,90,0.11)
--teal:    #0fd9c0   dim: rgba(15,217,192,0.11)
--orange:  #ff7a20   dim: rgba(255,122,32,0.11)
--purple:  #9d6eff   dim: rgba(157,110,255,0.11)
--red:     #ff4d4d   dim: rgba(255,77,77,0.11)
--yellow:  #f5c800   dim: rgba(245,200,0,0.11)
--pink:    #f03fa0   dim: rgba(240,63,160,0.11)
```

Blue (`#00a8ff`) is the primary interactive color — used for active nav states,
primary CTA buttons, links, and the active left-edge sidebar bar. All other
accents are used for data differentiation, status, and categorical encoding.

### Accents on pages

Each page uses a distinct subset of the palette so the product feels varied and
the colors carry meaning rather than decoration. 


<!-- 
### Accent assignment per page

Each page uses a distinct subset of the palette so the product feels varied and
the colors carry meaning rather than decoration. No two pages should share the
same accent combination for their primary stat/data colors.

```
Dashboard:   blue · teal · purple · orange
Timer:       blue · green · yellow · red
Analysis:    blue · orange · red · purple
Learn:       blue · teal · green · pink
Library:     blue · purple · pink · yellow
Stats:       blue · green · teal · purple · orange · red (data-rich, uses more)
Training:    blue · orange · yellow · green
Profile:     blue · purple · teal
Settings:    blue only (functional, minimal color)
```

The rule: blue always appears (it anchors the primary interactive chrome), but
the remaining 3–4 accents rotate across pages. 
-->


## Typography

Two typefaces. Strict partition. No exceptions.

```
Display / UI / prose:  Outfit         — weights 300, 400, 500, 600, 700
Numbers / data / code: Geist Mono — weights 400, 600, 700
Logo wordmark:         DM Sans        — weight 600
```

**Rule:** If it's a number, time, date, solve count, code string, badge label,
breadcrumb, or any machine-readable value — use Geist Mono. If it's a
sentence, heading, nav label, or descriptive text — use Outfit. The logo
wordmark "Cubewise" uses DM Sans exclusively.

### Type scale

| Element                 | Font      | Size  | Weight | Additional                              |
|-------------------------|-----------|-------|--------|-----------------------------------------|
| Section labels          | Mono      | 10px  | 600    | uppercase, letter-spacing: 2px, --t3    |
| Nav group labels        | Mono      | 9px   | 600    | uppercase, letter-spacing: 2px, --t3    |
| Body / descriptions     | Sans      | 13px  | 400    | line-height: 1.65, color --t2           |
| Nav items               | Sans      | 13px  | 400/500| 400 inactive, 500 active                |
| Card titles             | Sans      | 13px  | 600    | color --t1                              |
| Timestamps / sub-labels | Mono      | 11px  | 400    | color --t3                              |
| Meta pills              | Mono      | 10px  | 400    | color --t2                              |
| Phase chip labels       | Mono      | 9px   | 600    | uppercase, letter-spacing: 0.5px        |
| Profile sub-label       | Mono      | 10px  | 400    | color --t3                              |
| Logo wordmark           | DM Sans   | 14px  | 600    | letter-spacing: 0.1px                   |
| Recommendation headline | Sans      | 23px  | 700    | letter-spacing: -0.5px, color --t1      |
| Hero page heading       | Sans      | 38px  | 700    | letter-spacing: -1.5px, line-height 1.05|
| Stat values             | Mono      | 30px  | 700    | letter-spacing: -1px                    |
| Solve times             | Mono      | 18px  | 700    | letter-spacing: -0.5px                  |

---

## Spacing

Base unit: 8px. Use only these values:

```
4px   — between micro elements (icon + text inline, dot + label)
8px   — between stacked micro pairs (label above value)
10px  — grid gaps (quick nav, chip rows)
12px  — between grouped elements within a card section
16px  — between distinct groups within a card
20px  — card internal padding (vertical)
22px  — card internal padding (horizontal)
28px  — section gap (between major page sections)
28px  — page top padding
32px  — page horizontal padding
48px  — page bottom padding
```

NEVER use arbitrary values like 13px, 15px, 37px.
NEVER use margin/padding that is not a multiple of 4.

---

## Layout

```
Shell:    body with margin-left: 220px (main content offset for fixed sidebar)
Sidebar:  position: fixed, width: 220px, height: 100vh, background: --s1, z-index: 100
Main:     margin-left: 220px, min-height: 100vh, scrolls independently
```

No topbar. Pages begin directly with the hero heading inside `.content`.

### Grid structures

```
Quick nav grid:   repeat(4, 1fr), gap: 10px
Stats strip:      repeat(4, 1fr), no gap — cells divided by 0.5px borders
Recommendation:   1fr / auto — content left, meta pills stacked right
Analysis rows:    1fr / auto / auto / auto
```

---

## Component Patterns

### Cards

```css
background: var(--s1);
border: 0.5px solid var(--b2);
border-radius: 14px;
padding: 20px 22px;
```

Nested inlay cells step up to `--s2` background, divided by `0.5px solid var(--b1)`.
NO box-shadow. NO border-radius on the divider itself.

Hover (interactive cards): background steps to `--s2`, border steps to `--b3`.
The card color does not change — only the inner icon picks up an accent color.

### The 2px accent top-bar

Every card or cell representing a named category gets a 2px solid line flush to
the top edge in that category's color. This is the single most important motif
in the design.

```css
position: absolute;
top: 0; left: 0; right: 0;
height: 2px;          /* always exactly 2px — never thicker */
background: var(--blue);
border-radius: 0;     /* never round a flush edge */
```

Assign top-bar colors from the page's accent subset. The same category always
gets the same color within a page — consistency within, variety across pages.

### Sidebar

```css
/* Shell */
position: fixed; top: 0; left: 0;
width: 220px; height: 100vh;
background: var(--s1);
border-right: 0.5px solid var(--b1);
z-index: 100;

/* Logo mark — actual PNG, transparent bg, no background behind it */
width: 32px; height: 32px;
object-fit: contain;

/* Logo wordmark */
font-family: 'DM Sans', sans-serif;
font-size: 14px; font-weight: 600;
color: var(--t1); letter-spacing: 0.1px;

/* Active nav item */
background: rgba(0,168,255,0.12);
color: var(--blue);

/* Active nav left-edge bar */
position: absolute; left: 0; top: 0; bottom: 0;
width: 2px; background: var(--blue);
border-radius: 0;

/* Profile cell */
background: var(--s2);
border: 0.5px solid var(--b1);
border-radius: 10px;
```

### Buttons

```css
/* Primary CTA */
background: var(--blue);
color: #01111f;             /* near-black, NOT pure black */
font-family: 'Outfit', sans-serif;
font-size: 12px; font-weight: 700;
border: none; border-radius: 8px;
padding: 9px 22px;
/* Hover: opacity 0.87 only — never change color */

/* Ghost */
background: transparent;
border: 0.5px solid var(--b2);
border-radius: 8px; padding: 9px 16px;
color: var(--t2);
/* Hover: color --t1, border-color --b3 */
```

### Chips and badges

```css
/* Phase / status chips */
border-radius: 20px; padding: 2px 8px;
font-family: 'Geist Mono', monospace;
font-size: 9px; font-weight: 600;
text-transform: uppercase; letter-spacing: 0.5px;
/* background: accent dim; color: full accent */

/* Semantic phase states — consistent across all pages */
good:  background: rgba(15,217,192,0.11);  color: #0fd9c0;  /* teal   */
warn:  background: rgba(245,200,0,0.11);   color: #f5c800;  /* yellow */
bad:   background: rgba(255,77,77,0.11);   color: #ff4d4d;  /* red    */

/* Result / category badges */
border-radius: 6px; padding: 3px 8px;
font-family: 'Geist Mono', monospace;
font-size: 10px; font-weight: 600;

/* Meta pills (informational, not status) */
background: var(--s2); border: 0.5px solid var(--b2);
border-radius: 6px; padding: 4px 10px;
font-family: 'Geist Mono', monospace;
font-size: 10px; color: var(--t2);
```

### Dividers

```css
border: 0.5px solid var(--b1);   /* within-card dividers */
border: 0.5px solid var(--b2);   /* card-level borders   */
```

Always 0.5px. NEVER 1px. This applies to every border in the product.

### Avatar / initials

```css
width: 30px; height: 30px; border-radius: 8px;
background: rgba(0,168,255,0.12);
border: 0.5px solid var(--b3);
font-family: 'Geist Mono', monospace;
font-size: 11px; font-weight: 700;
color: var(--blue);
```

---

## Motion

```
Default easing:  cubic-bezier(0.16, 1, 0.3, 1)
Hover duration:  150ms
Transitions:     color, background-color, border-color, opacity only
```

Cards do NOT lift, scale, or shift. Never animate transform, box-shadow,
width, height, or border-radius.

---

## Never Do

- Drop-shadows or box-shadows anywhere
- Gradients except on the logo mark asset
- 1px borders — always 0.5px
- Border-radius on flush edges (top-bars, left-edge nav bar, dividers)
- Accent colors as large filled background regions
- More than two typefaces in a single view (DM Sans is wordmark-only)
- Font weights outside 400, 500, 600, 700
- System fonts, Inter, Roboto, or Arial
- Inline bold in body prose
- Pure black #000000 or pure white #ffffff
- Decorative icons without functional purpose
- Center-aligned body text or data labels
- Transform, scale, or translate on hover
- Gamification elements — XP bars, level badges, streak counters, points
- Hardcoded color values — always use design tokens
- Arbitrary spacing values outside the scale
- The same accent color combination on two different pages
- Gold as an accent — use yellow (#f5c800) instead

---

## Reference component — Stat strip cell

The stat strip is the densest recurring pattern and the ground truth for the
surface layering system.

```html
<div style="position:relative; padding:20px 22px; background:#121820;
            border-right:0.5px solid rgba(56,189,248,0.07);">

  <div style="position:absolute; top:0; left:0; right:0;
              height:2px; background:#00a8ff;"></div>

  <div style="font-family:'Geist Mono',monospace; font-size:10px;
              font-weight:600; letter-spacing:1.5px; text-transform:uppercase;
              color:#3a5870; margin-bottom:10px; margin-top:2px;">AO5</div>

  <div style="font-family:'Geist Mono',monospace; font-size:30px;
              font-weight:700; letter-spacing:-1px; line-height:1;
              color:#00a8ff;">1.17</div>

  <div style="font-family:'Outfit',sans-serif; font-size:11px;
              color:#3a5870; margin-top:5px;">last 5 solves</div>
</div>
```