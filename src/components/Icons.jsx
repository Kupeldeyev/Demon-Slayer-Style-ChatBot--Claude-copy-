// A grab-bag of simple icons, each as its own tiny component.
// Keeping them together in one file makes them easy to find and reuse.
// Every icon accepts a `size` prop so you can resize it wherever it's used.

import { useId } from 'react'

export function PlusIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function SendIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11.5L20 4l-6.5 17-3-7.5L3 11.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MenuIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ChatBubbleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16v11H9l-5 4V5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SparkleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  )
}

export function TrashIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0-1 13H8L7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// The assistant's "chibi spirit" avatar — a simple round blushing face.
// Made purely from SVG shapes so it never needs an image file.
export function MascotAvatar({ size = 32, mood = 'idle' }) {
  // Several avatars can be on screen at once (one per assistant message),
  // so each needs its own gradient id — two elements can't share the same
  // id in one page. `useId` generates a unique, stable one per instance.
  const gradientId = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block' }}>
      <circle cx="20" cy="20" r="19" fill="var(--color-accent)" />
      <circle cx="20" cy="20" r="19" fill={`url(#${gradientId})`} opacity="0.5" />
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* blush */}
      <circle cx="12" cy="24" r="3" fill="#fff" opacity="0.35" />
      <circle cx="28" cy="24" r="3" fill="#fff" opacity="0.35" />
      {/* eyes: closed happy curves when idle, round dots when "thinking" */}
      {mood === 'thinking' ? (
        <>
          <circle cx="14.5" cy="19" r="1.6" fill="#2b2130" />
          <circle cx="25.5" cy="19" r="1.6" fill="#2b2130" />
        </>
      ) : (
        <>
          <path d="M11 19c1.5 2 4.5 2 6 0" stroke="#2b2130" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M23 19c1.5 2 4.5 2 6 0" stroke="#2b2130" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      )}
      {/* smile */}
      <path d="M16 25c1.5 2 6.5 2 8 0" stroke="#2b2130" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}
