import { MascotAvatar } from './Icons.jsx'

export default function MessageBubble({ role, text }) {
  const isUser = role === 'user'

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : ''}`}>
      {!isUser && <MascotAvatar size={30} />}

      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>{text}</div>

      {isUser && (
        <div className="user-avatar" aria-hidden="true">
          You
        </div>
      )}
    </div>
  )
}
