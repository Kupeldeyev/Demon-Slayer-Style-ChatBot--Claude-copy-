// Purely decorative: a handful of petal shapes that drift from the top
// of the screen to the bottom on a loop (see the `petal-fall` animation
// in index.css). There is no interactivity here — it's the "signature"
// visual flourish that makes the app feel alive. Because each petal's
// color comes from the theme's CSS variables, this automatically becomes
// drifting embers on the fiery themes and drifting motes on Blood Moon,
// with zero extra code.
//
// `count` controls how many petals are on screen at once. Keep this
// number small (8-14) — more than that starts to distract from the chat.

const PETAL_COLORS = ['var(--color-accent)', 'var(--color-accent-2)', 'var(--color-accent-3)']

function seededPetals(count) {
  // Build a small array of random-but-stable petal settings once,
  // instead of re-randomizing on every render (which would cause the
  // petals to jump around).
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // % from left
    size: 8 + Math.random() * 10, // px
    duration: 9 + Math.random() * 8, // seconds to fall
    delay: -Math.random() * 14, // negative delay = starts mid-fall
    drift: `${Math.random() * 80 - 40}px`, // sideways sway
    color: PETAL_COLORS[i % PETAL_COLORS.length],
  }))
}

const petals = seededPetals(12)

export default function SakuraPetals() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {petals.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-5%',
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: '0 60% 0 60%',
            background: p.color,
            opacity: 0.7,
            '--drift': p.drift,
            animation: `petal-fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
