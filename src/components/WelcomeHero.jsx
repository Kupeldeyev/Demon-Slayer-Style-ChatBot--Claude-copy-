import { MascotAvatar } from './Icons.jsx'
import { BOT_NAME, BOT_TAGLINE } from '../data/sampleChats.js'

// Edit this list any time — each entry becomes a clickable chip that
// fills the message box when tapped.
const SUGGESTIONS = [
  { emoji: '⚔️', text: 'Plan a demon-slaying training arc' },
  { emoji: '🔥', text: 'Describe a flame-breathing technique' },
  { emoji: '🌙', text: 'Write a moonlit duel scene' },
  { emoji: '🏔️', text: 'Brainstorm a mountain hideout' },
]

export default function WelcomeHero({ onSuggestionClick }) {
  return (
    <div className="welcome-hero">
      <div className="welcome-hero__avatar">
        <MascotAvatar size={64} />
      </div>
      <h2 className="welcome-hero__title">{BOT_NAME}</h2>
      <p className="welcome-hero__tagline">{BOT_TAGLINE}</p>

      <div className="suggestion-grid">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.text}
            className="suggestion-chip pop-hover"
            onClick={() => onSuggestionClick(suggestion.text)}
          >
            {suggestion.emoji} {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  )
}
