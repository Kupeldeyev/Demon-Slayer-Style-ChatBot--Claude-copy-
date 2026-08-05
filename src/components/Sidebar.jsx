import { PlusIcon, ChatBubbleIcon, TrashIcon, SparkleIcon } from './Icons.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'
import { BOT_NAME } from '../data/sampleChats.js'

export default function Sidebar({
  chats,
  activeChatId,
  isOpen,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  activeTheme,
  onThemeChange,
}) {
  return (
    <aside
      className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}
      style={{
        background: `linear-gradient(180deg, var(--color-sidebar-start), var(--color-sidebar-end))`,
      }}
    >
      {/* --- Logo / brand -------------------------------------------------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 18px' }}>
        <SparkleIcon size={22} />
        <h1 style={{ fontSize: 19, letterSpacing: 0.2 }}>{BOT_NAME}</h1>
      </div>

      {/* --- New chat button ------------------------------------------------ */}
      <button className="pop-hover new-chat-btn" onClick={onNewChat}>
        <PlusIcon size={16} />
        New chat
      </button>

      {/* --- Chat history list ---------------------------------------------- */}
      <nav style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        {chats.map((chat) => {
          const isActive = chat.id === activeChatId
          return (
            <div
              key={chat.id}
              className="chat-row pop-hover"
              data-active={isActive}
              onClick={() => onSelectChat(chat.id)}
            >
              <ChatBubbleIcon size={15} />
              <span className="chat-row__title">{chat.title}</span>
              <button
                className="chat-row__delete"
                title="Delete chat"
                aria-label={`Delete "${chat.title}"`}
                onClick={(event) => {
                  event.stopPropagation() // don't also select the chat
                  onDeleteChat(chat.id)
                }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
          )
        })}
      </nav>

      {/* --- Footer: theme picker -------------------------------------------- */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-soft)', marginBottom: 8 }}>Theme</p>
        <ThemeSwitcher activeTheme={activeTheme} onChange={onThemeChange} />
      </div>
    </aside>
  )
}
