import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import WelcomeHero from './WelcomeHero.jsx'

export default function ChatArea({ messages, isTyping, onSuggestionClick }) {
  const bottomRef = useRef(null)

  // Every time the message list changes (or the bot starts/stops typing),
  // smoothly scroll down so the newest message is visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (messages.length === 0) {
    return (
      <div className="chat-area">
        <WelcomeHero onSuggestionClick={onSuggestionClick} />
      </div>
    )
  }

  return (
    <div className="chat-area">
      <div className="message-list">
        {messages.map((message) => (
          <MessageBubble key={message.id} role={message.role} text={message.text} />
        ))}
        {isTyping && <TypingIndicator />}
        {/* an empty, invisible anchor element we scroll to */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
