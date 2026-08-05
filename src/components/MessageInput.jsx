import { useRef } from 'react'
import { SendIcon } from './Icons.jsx'

export default function MessageInput({ value, onChange, onSend, disabled }) {
  const textareaRef = useRef(null)

  // Grows the textarea as the user types multiple lines, up to a max
  // height (controlled in CSS via `max-height`), then lets it scroll.
  function handleInput(event) {
    onChange(event.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }

  function handleKeyDown(event) {
    // Enter sends the message; Shift+Enter adds a new line instead.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    if (disabled || value.trim() === '') return
    onSend()
    // Reset the textarea height after clearing its content.
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    })
  }

  const canSend = !disabled && value.trim() !== ''

  return (
    <div className="composer">
      <div className="composer__box">
        <textarea
          ref={textareaRef}
          className="composer__textarea"
          rows={1}
          placeholder="Message Kimetsu Claude..."
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn pop-hover"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
        >
          <SendIcon size={16} />
        </button>
      </div>
      <p className="composer__hint">Enter to send • Shift + Enter for a new line</p>
    </div>
  )
}
