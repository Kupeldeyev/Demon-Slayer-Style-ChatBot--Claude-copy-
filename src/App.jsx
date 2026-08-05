import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import ChatArea from './components/ChatArea.jsx'
import MessageInput from './components/MessageInput.jsx'
import SakuraPetals from './components/SakuraPetals.jsx'
import { initialChats, getAssistantReply } from './data/sampleChats.js'
import './App.css'

// Turns a user's first message into a short chat title, e.g.
// "How do I get stronger before the tournament?" -> "How do I get stronger..."
function makeTitleFromText(text) {
  const words = text.trim().split(/\s+/)
  const short = words.slice(0, 5).join(' ')
  return words.length > 5 ? `${short}…` : short
}

export default function App() {
  // --- All the app's state lives right here in the top-level component.
  // For an app this size, plain useState + passing props down is easier
  // to follow than adding a state-management library.
  const [chats, setChats] = useState(initialChats)
  const [activeChatId, setActiveChatId] = useState(initialChats[0]?.id ?? null)
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // 'misty' = Misty Peaks (default/light), see src/data/themes.js for the
  // full list and src/index.css / src/App.css for the colors + wallpapers.
  const [theme, setTheme] = useState('misty')
  const [model, setModel] = useState('sakura-sonnet')

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null

  function handleNewChat() {
    const newChat = { id: crypto.randomUUID(), title: 'New chat', messages: [] }
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setDraft('')
  }

  function handleSelectChat(chatId) {
    setActiveChatId(chatId)
  }

  function handleDeleteChat(chatId) {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (chatId === activeChatId) {
      setActiveChatId(null)
    }
  }

  function handleSuggestionClick(text) {
    setDraft(text)
  }

  async function handleSend() {
    const text = draft.trim()
    if (text === '') return

    // If there's no active chat yet (e.g. the user deleted them all),
    // create one on the fly so a message always has somewhere to go.
    let chatId = activeChatId
    if (!chatId) {
      chatId = crypto.randomUUID()
      setChats((prev) => [{ id: chatId, title: 'New chat', messages: [] }, ...prev])
      setActiveChatId(chatId)
    }

    const userMessage = { id: crypto.randomUUID(), role: 'user', text }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              // Give the chat a real title the first time a message is sent.
              title: chat.messages.length === 0 ? makeTitleFromText(text) : chat.title,
              messages: [...chat.messages, userMessage],
            }
          : chat,
      ),
    )
    setDraft('')
    setIsTyping(true)

    const replyText = await getAssistantReply(text)
    const assistantMessage = { id: crypto.randomUUID(), role: 'assistant', text: replyText }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat,
      ),
    )
    setIsTyping(false)
  }

  return (
    // `data-theme` here is what makes the CSS variable overrides in
    // index.css kick in for the whole app, AND swaps the wallpaper on
    // .main-panel (set up in App.css) to match the theme.
    <div className="app-shell" data-theme={theme}>
      <SakuraPetals />

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        activeTheme={theme}
        onThemeChange={setTheme}
      />

      <main className="main-panel">
        <TopBar
          chatTitle={activeChat ? activeChat.title : 'New chat'}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          activeModel={model}
          onModelChange={setModel}
        />

        <ChatArea
          messages={activeChat ? activeChat.messages : []}
          isTyping={isTyping}
          onSuggestionClick={handleSuggestionClick}
        />

        <MessageInput value={draft} onChange={setDraft} onSend={handleSend} disabled={isTyping} />
      </main>
    </div>
  )
}
