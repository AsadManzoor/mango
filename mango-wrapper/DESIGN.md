# DESIGN.md — Midnight Matinee

Dark gothic shoujo: rose and blood-red ink on near-black plum. Horror is the structure (thorned vine, blood-red ticket, flickering ink intro); shoujo is the surface (arches, petals, screentone dots, rose lettering).

## Tokens
| Token | Value | Use |
|---|---|---|
| --night | #150b13 | page background |
| --plum / --plum2 | #2a1424 / #3a1a30 | panels, tiles |
| --rose | #ffb8cf | headings, borders, "Together" |
| --blood | #d4183a | accents, "Apart", vine, ticket |
| --paper | #fff0f4 | body text, speech bubbles |
| --mint / --sky / --gold | #8fe0b4 / #9ec5ff / #ffd36b | done / in progress / today |

Type: Shippori Mincho (headings), Zen Maru Gothic (body). Screentone dots overlay on the body.

## Shapes
- Arch (`border-radius:140px 140px 8px 8px`): every poster, memory, and the hero stage.
- Double rose border: calendar panels. Dashed border: "Potential" and travel passports.
- Stamps (rotated, outlined): status labels.

## Motion
- Ease-out `cubic-bezier(.23,1,.32,1)`; UI transitions under 300ms; press = `scale(.97)`.
- Only transform and opacity animate; hover effects only on `(hover:hover) and (pointer:fine)`.
- `prefers-reduced-motion` removes animation and reveals.

## Companion rules
Gaja waits in the hero arch, then follows the pointer (docks bottom-right on touch). Quiet mode is saved in localStorage.

## Accessibility
Skip link, visible focus rings, real buttons for calendar days, labelled lightbox (arrow keys, Esc), 44px menu targets.
