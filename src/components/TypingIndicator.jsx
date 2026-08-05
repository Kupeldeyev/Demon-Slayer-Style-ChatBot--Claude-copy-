import { MascotAvatar } from './Icons.jsx'

export default function TypingIndicator() {
  return (
    <div className="message-row">
      <MascotAvatar size={30} mood="thinking" />
      <div className="bubble bubble--bot bubble--typing">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
