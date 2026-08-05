import { themes } from '../data/themes.js'

// Renders one small round button per theme (see src/data/themes.js).
// Clicking a button calls `onChange` with the theme's id; App.jsx then
// puts that id on <html data-theme="..."> and every CSS variable in
// index.css swaps to the new theme automatically.
export default function ThemeSwitcher({ activeTheme, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {themes.map((theme) => {
        const isActive = theme.id === activeTheme
        return (
          <button
            key={theme.id}
            className="pop-hover"
            onClick={() => onChange(theme.id)}
            title={theme.label}
            aria-label={`Switch to ${theme.label} theme`}
            aria-pressed={isActive}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})`,
              border: isActive ? '2px solid var(--color-text)' : '2px solid transparent',
              boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
              fontSize: 13,
            }}
          >
            {theme.emoji}
          </button>
        )
      })}
    </div>
  )
}
