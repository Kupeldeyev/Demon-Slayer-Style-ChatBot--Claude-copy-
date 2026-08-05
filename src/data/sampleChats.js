// This file holds three things:
//   1. Some starter data so the app isn't empty on first load.
//   2. A real call to the Gemini API (getAssistantReply) that talks to
//      Google's servers and gets an actual AI-generated reply.
//   3. A tiny offline fallback (canned replies) used only if you haven't
//      set up an API key yet, so the app still works out of the box.
//
// --------------------------------------------------------------------------
// SETUP — 2 steps:
//   1. Get a free API key from Google AI Studio:
//        https://aistudio.google.com/app/apikey
//   2. Create a file named `.env` in the project root (same folder as
//      package.json) containing this one line:
//        VITE_GEMINI_API_KEY=your_key_here
//      Then restart `npm run dev` (Vite only reads .env on startup).
//
// IMPORTANT SECURITY NOTE:
// This calls the Gemini API directly from the browser, which means the
// key is visible to anyone who opens dev tools on your deployed site.
// That's fine for local development, learning, or a private/personal
// project. Before you deploy this somewhere public, move this fetch call
// into a small backend (a serverless function works great) that holds the
// key server-side, and have the browser call *your* backend instead.
// --------------------------------------------------------------------------

export const BOT_NAME = 'Kimetsu Claude'
export const BOT_TAGLINE = 'Your demon-slaying anime assistant'

// The model to use. "gemini-2.5-flash" is fast, cheap, and has a free
// tier — good for a project like this. Swap it for any other Gemini
// model id if you want.
const GEMINI_MODEL = 'gemini-3.5-flash'

// A few "personality" replies used ONLY as an offline fallback, so the
// app still feels alive before you've set up an API key. Feel free to
// rewrite these in your own voice.
const CANNED_REPLIES = [
  "Mm, great question! Here's my take: {topic} is more fun once you break it into small steps. Want me to sketch one out?",
  "Ooh, {topic}? Total training-arc energy! Let's think it through together, one breath at a time.",
  "Hmm, *tilts head* — I'd start simple with {topic} and build up from there. Should I show an example?",
  "Noted! Give me a beat while I line up my thoughts on {topic}...",
  "That's a solid question about {topic}. Here's a clean way to look at it:",
]

// Pulls a short "topic" word out of the user's message just so the
// canned reply feels like it's responding to *something* specific.
function guessTopic(userText) {
  const words = userText.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'that'
  return words.slice(0, 3).join(' ')
}

// Fake network delay so the typing indicator has time to show up
// (only used by the offline fallback below).
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The offline fallback: picks a canned line and slots the user's topic
// into it, so the demo still feels alive with no API key configured.
async function getCannedReply(userText) {
  await wait(700 + Math.random() * 700)
  const template = CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)]
  return template.replace('{topic}', guessTopic(userText))
}

// The real "assistant" — sends the user's message to the Gemini API and
// returns the model's text reply.
export async function getAssistantReply(userText) {
  // import.meta.env is how Vite exposes values from your .env file to
  // the browser. Only variables starting with VITE_ are exposed this way
  // (that prefix is a safety net so you don't accidentally leak secrets
  // that were never meant to reach the browser).
  const apiKey = ""

  if (!apiKey) {
    // No key yet — fall back to the offline canned replies instead of
    // breaking the app. See the setup steps in the comment at the top
    // of this file.
    return getCannedReply(userText)
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      // Gemini expects this specific shape: a `contents` array, where
      // each entry has a `parts` array of `{ text }` objects. For a
      // single-turn message like this, one entry is enough.
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userText }],
          },
        ],
      }),
    })

    if (!response.ok) {
      // The request reached Google but was rejected (bad key, bad model
      // name, rate limit, etc). Log the details for you to debug, and
      // show something friendly in the chat instead of crashing.
      const errorBody = await response.text()
      console.error('Gemini API error:', response.status, errorBody)
      return "Mm, Gemini couldn't answer that one — check the browser console for the error details."
    }

    const data = await response.json()

    // The reply text lives at this path in Gemini's response. The `?.`
    // (optional chaining) means "if any step along the way is missing,
    // just return undefined instead of crashing" — so a weird/empty
    // response doesn't break the app either.
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text

    return replyText ?? 'Gemini sent back an empty reply — try rephrasing your message?'
  } catch (error) {
    // This catches network failures (no internet, CORS issues, etc.) —
    // different from an API error, which is handled above.
    console.error('Network error talking to Gemini:', error)
    return "I couldn't reach Gemini — check your internet connection and try again."
  }
}

// Starter conversation list shown in the sidebar.
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
