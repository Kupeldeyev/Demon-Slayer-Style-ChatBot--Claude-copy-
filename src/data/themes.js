// A small list describing every theme available in the app.
// `id` MUST match a `[data-theme="..."]` block in src/index.css AND a
// matching wallpaper rule in src/App.css.
//
// To add a new theme:
//   1. Add a new `[data-theme="your-id"] { ... }` block in src/index.css
//      with the same variable names as the other themes.
//   2. Add a matching `[data-theme='your-id'] .main-panel { background-image: ... }`
//      rule in src/App.css pointing at a wallpaper in public/wallpapers/.
//   3. Add one entry to this array so it shows up in the theme switcher.
// That's it — no other file needs to change.

export const themes = [
  {
    id: 'misty',
    label: 'Misty Peaks',
    emoji: '🏔️',
    swatch: ['#2EC4B6', '#4F9DDB'],
  },
  {
    id: 'bloodmoon',
    label: 'Blood Moon',
    emoji: '🌑',
    swatch: ['#E63946', '#8E5DF5'],
  },
  {
    id: 'flame',
    label: 'Flame Hashira',
    emoji: '🔥',
    swatch: ['#FF7A00', '#FFC93C'],
  },
]
