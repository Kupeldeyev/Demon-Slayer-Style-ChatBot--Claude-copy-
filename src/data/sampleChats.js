export const BOT_NAME = 'Kimetsu Claude'
export const BOT_TAGLINE = 'Your demon-slaying anime assistant'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const CANNED_REPLIES = [
  "Mm, great question! Here's my take: {topic} is more fun once you break it into small steps. Want me to sketch one out?",
  "Ooh, {topic}? Total training-arc energy! Let's think it through together, one breath at a time.",
  "Hmm, *tilts head* — I'd start simple with {topic} and build up from there. Should I show an example?",
  "Noted! Give me a beat while I line up my thoughts on {topic}...",
  "That's a solid question about {topic}. Here's a clean way to look at it:",
]

function guessTopic(userText) {
  const words = userText.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'that'
  return words.slice(0, 3).join(' ')
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getCannedReply(userText) {
  await wait(700 + Math.random() * 700)
  const template = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)]
  return template.replace('{topic}', guessTopic(userText))
}

// Calls YOUR FastAPI backend (which owns the MCP weather tool), instead
// of talking to any LLM provider directly from the browser. `history`
// is the array of prior { role, text } messages in this chat, so the
// backend/LLM has context.
export async function getAssistantReply(userText, history = []) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        history: history.map((m) => ({ role: m.role, text: m.text })),
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Backend /api/chat error:', response.status, errorBody)
      return getCannedReply(userText)
    }

    const data = await response.json()
    return data.reply ?? getCannedReply(userText)
  } catch (error) {
    // Backend not running (e.g. still setting up) — fall back quietly
    // instead of breaking the UI.
    console.warn('Could not reach backend, using offline fallback:', error)
    return getCannedReply(userText)
  }
}

export const initialChats = [
  {
    id: 'chat-1',
    title: 'Plan a training arc',
    messages: [
      { id: 'm1', role: 'user', text: 'How do I get stronger before the tournament?' },
      {
        id: 'm2',
        role: 'assistant',
        text:
          "First: rest is part of training too, don't skip it! Then stack small daily reps of the move you're worst at — that's usually where the biggest gains hide.",
      },
    ],
  },
  {
    id: 'chat-2',
    title: 'Naming a mascot',
    messages: [
      { id: 'm3', role: 'user', text: 'Help me name a cherry blossom spirit mascot.' },
      {
        id: 'm4',
        role: 'assistant',
        text: 'How about "Momo"? Short, sweet, and it literally means peach — close cousin of sakura!',
      },
    ],
  },
]