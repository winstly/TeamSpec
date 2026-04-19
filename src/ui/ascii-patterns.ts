/**
 * ASCII art animation patterns for the welcome screen.
 * TeamSpec logo animation - letter "T" growing from stem outward.
 */

// Detect if full Unicode is supported
const supportsUnicode =
  process.platform !== 'win32' ||
  !!process.env.WT_SESSION || // Windows Terminal
  !!process.env.TERM_PROGRAM; // Modern terminal

// Character set based on Unicode support
const CHARS = supportsUnicode
  ? { full: '██', dim: '░░', empty: '  ' }
  : { full: '##', dim: '++', empty: '  ' };

const _ = CHARS.empty;
const F = CHARS.full;
const D = CHARS.dim;

/**
 * Welcome animation frames — letter "T" growing from center stem outward.
 * Grid: 5 cols × 2 chars = 10 chars wide, 7 rows tall.
 * Each frame is an array of 7 strings (one per row).
 *
 * Cell layout (col index):
 *   0   1   2   3   4
 *  [_] [_] [█] [█] [_]   row 0 — top bar center
 *  [_] [_] [_] [_] [_]   row 1 — gap under top bar
 *  [_] [_] [█] [█] [_]   row 2 — mid bar center
 *  [_] [D] [█] [█] [D]   row 3 — stem + dim corner seeds
 *  [_] [_] [█] [█] [_]   row 4 — stem
 *  [D] [_] [█] [█] [_]   row 5 — dim corner seed
 *  [_] [_] [█] [█] [_]   row 6 — stem base
 *
 * Animation sequence:
 *   1. Center stem (█ at col 2) grows upward from row 6
 *   2. Mid bar (█ at col 2,3) solidifies
 *   3. Top bar (█ at col 2,3) appears and brightens
 *   4. Dim corner seeds appear at col 1, row 3
 *   5. Dim corners solidify to full
 *   6. Left full corner appears
 *   7. Right full corner appears
 *   8. Hold
 */
export const WELCOME_ANIMATION = {
  interval: 120,
  frames: [
    // Frame 1: Only the stem base (dim seed at center)
    [
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${D}${D}${_}`,
    ],
    // Frame 2: Stem grows up to mid bar (dim)
    [
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${D}${D}${_}`,
      `${_}${_}${D}${D}${_}`,
    ],
    // Frame 3: Stem fully dim, mid bar solidifies
    [
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${D}${D}${_}`,
      `${_}${_}${D}${D}${_}`,
      `${_}${_}${D}${D}${_}`,
    ],
    // Frame 4: Mid bar solidifies (F), top bar appears (dim)
    [
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
    ],
    // Frame 5: Top bar brightens to F, dim corner seeds appear
    [
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
    ],
    // Frame 6: Top bar full, dim corner seeds appear
    [
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
    ],
    // Frame 7: Dim corners solidify to full
    [
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${D}${F}${F}${D}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
    ],
    // Frame 8: Left full corner appears
    [
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${F}${F}${_}`,
      `[${D}]${_}${F}${F}${D}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
    ],
    // Frame 9: Complete T — all full
    [
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${_}${_}${_}`,
      `${_}${_}${F}${F}${_}`,
      `[${F}]${_}${F}${F}${F}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
      `${_}${_}${F}${F}${_}`,
    ],
  ],
};
