import { MascotAvatar } from './Icons.jsx'
import { renderMarkdown } from '../utils/markdown.jsx'

export default function MessageBubble({ role, text }) {
  const isUser = role === 'user'

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : ''}`}>
      {!isUser && <MascotAvatar size={30} />}

      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>
        {/* User messages are shown as plain text (people don't expect their
            own typed asterisks/backticks to turn into formatting).
            Assistant replies get run through the markdown renderer so
            bold text, code, lists, etc. actually display styled instead
            of as a flat blob of raw symbols. */}
        {isUser ? text : renderMarkdown(text)}
      </div>

      {isUser && (
        <div className="user-avatar" aria-hidden="true">
          You
        </div>
      )}
    </div>
  )
}
