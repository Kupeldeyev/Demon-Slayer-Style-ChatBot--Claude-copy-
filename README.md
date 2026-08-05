# Kimetsu Claude 🔥

An anime-styled front end for a Claude.ai-style chat app, built with React +
Vite — now with a Demon Slayer-inspired look. Every theme is paired with a
full-bleed wallpaper photo behind the chat, the whole palette is swappable
with one click, and every file is written and commented for someone who is
still learning React.

<br/>

## Quick start

```bash
npm install     # install dependencies
npm run dev     # start the dev server (usually http://localhost:5173)
npm run build   # build an optimized version into dist/
npm run preview # preview the production build locally
npm run lint     # check the code with oxlint
```

No backend or API key is required to try it out — the assistant's replies
are simulated locally (see `src/data/sampleChats.js`) so you can see the
whole app work without connecting anything.

<br/>

## What the app looks like

- **Sidebar** (left): a "New chat" button, your chat history, and a row of
  colored dots to switch between three themes.
- **Top bar**: a frosted-glass strip with a menu button that collapses the
  sidebar, the current chat's title, and a "model" picker badge (cosmetic —
  see `src/data/models.js`).
- **Chat area**: either a welcome screen with clickable suggestion chips
  (when a chat is empty) or the message bubbles for that chat — both sit
  directly over the theme's wallpaper photo.
- **Composer**: a frosted-glass message box at the bottom that grows as you
  type, with a send button and an "Enter to send" hint.
- Drifting petals/embers (colored per theme) float gently over the whole
  screen in the background — pure decoration, built with CSS animation.

### The three themes

| Theme | Wallpaper | Palette |
| --- | --- | --- |
| **Misty Peaks** (light, default) | `public/wallpapers/misty-peaks.jpg` — a quiet mountain overlook | Teal `#2EC4B6` + sky blue `#4F9DDB` + gold `#F4C95D` |
| **Blood Moon** (dark) | `public/wallpapers/blood-moon.jpg` — a crimson close-up | Crimson `#E63946` + ember `#FF6B4A` + violet `#8E5DF5` |
| **Flame Hashira** (dark) | `public/wallpapers/flame-hashira.jpg` — a fire duel | Flame orange `#FF7A00` + gold `#FFC93C` + red-orange `#D62828` |

Each wallpaper is painted on `.main-panel` (everything to the right of the
sidebar), so it naturally stretches and rescales as the sidebar slides open
or closed — no extra JavaScript needed. The top bar, composer, chat bubbles,
and suggestion chips use a frosted-glass effect (`backdrop-filter: blur`
over a translucent `--color-glass` tone) so the art stays visible while text
stays easy to read.

<br/>

## Folder structure

```
claudeclone/
├── index.html                 # the page Vite serves; loads fonts + main.jsx
├── vite.config.js             # Vite + React plugin configuration
├── package.json                # dependencies and npm scripts
├── public/
│   ├── favicon.svg             # the flame-drop tab icon
│   └── wallpapers/              # the three theme background photos
│       ├── misty-peaks.jpg
│       ├── blood-moon.jpg
│       └── flame-hashira.jpg
└── src/
    ├── main.jsx                 # entry point: mounts <App /> into the page
    ├── App.jsx                  # top-level component: holds all app state
    ├── App.css                  # layout + component styles (sidebar, bubbles, wallpapers, etc.)
    ├── index.css                # design tokens (colors/fonts) + global resets
    ├── components/
    │   ├── Sidebar.jsx           # chat list, new-chat button, theme switcher
    │   ├── ThemeSwitcher.jsx     # the row of theme-picker dot buttons
    │   ├── TopBar.jsx            # header: sidebar toggle, title, model picker
    │   ├── ChatArea.jsx          # switches between WelcomeHero and the message list
    │   ├── WelcomeHero.jsx       # empty-state screen with suggestion chips
    │   ├── MessageBubble.jsx     # one chat message (user or assistant style)
    │   ├── TypingIndicator.jsx   # bouncing-dots "assistant is typing" bubble
    │   ├── MessageInput.jsx      # the text box + send button at the bottom
    │   ├── SakuraPetals.jsx      # decorative falling petals/embers background
    │   └── Icons.jsx             # every small SVG icon used in the app
    └── data/
        ├── sampleChats.js        # starter chat history + fake assistant replies
        ├── themes.js              # theme names/emoji/colors for the switcher
        └── models.js               # cosmetic list of "model" names for the top bar
```

<br/>

## How the pieces fit together

`main.jsx` renders `<App />`. **`App.jsx` is the "brain" of the app** — it's
the only file that holds real state (the list of chats, which chat is
active, the current theme, the text being typed, etc.). Every other
component receives what it needs through **props** and calls a function
(also passed as a prop) when the user does something, like clicking a
button. This "state lives at the top, data flows down, events flow up"
pattern is the most common way to structure a small React app, and it means
you never have to hunt through multiple files to find where something is
stored.

For example, sending a message works like this:

1. You type in `MessageInput`, which calls `onChange` on every keystroke —
   that's actually `setDraft` from `App.jsx`.
2. You press Enter (or click send), which calls `onSend` — that's
   `handleSend` in `App.jsx`.
3. `handleSend` adds your message to the active chat's `messages` array,
   shows the typing indicator, and calls `getAssistantReply` from
   `sampleChats.js` to get a canned response.
4. Once that "reply" comes back, it's added to the same array, and React
   re-renders `ChatArea` with the new message.

<br/>

## Customizing things

### Colors, fonts, and wallpapers — `src/index.css` + `src/App.css`
Every color in the app is a CSS variable (custom property) defined per
theme at the top of `src/index.css`, for example `--color-accent` or
`--color-bg`. Change a value there and it updates everywhere that color is
used. The two Google Fonts are set with `--font-display` (headings/logo) and
`--font-body` (everyday text) — swap the `<link>` in `index.html` and these
variable names to use different fonts. Each theme's wallpaper photo is set
in `src/App.css` under a `[data-theme='...'] .main-panel` rule.

### Adding a new theme
1. Copy one of the `[data-theme='...']` blocks near the top of
   `src/index.css`, rename it, and change its colors (including
   `--color-glass` and the `--wallpaper-tint-*` pair).
2. Drop a wallpaper photo into `public/wallpapers/` and add a matching
   `[data-theme='your-id'] .main-panel { background-image: ... }` rule in
   `src/App.css`.
3. Add a matching entry to `src/data/themes.js` (id, label, emoji, and the
   two swatch colors shown on its button).

That's it — the switcher in the sidebar picks it up automatically.

### Changing the assistant's name, avatar, or replies
- Name/tagline: `BOT_NAME` and `BOT_TAGLINE` in `src/data/sampleChats.js`.
- Avatar: the `MascotAvatar` component in `src/components/Icons.jsx` (it's
  plain SVG shapes, no image file needed).
- Replies: the `CANNED_REPLIES` array in `src/data/sampleChats.js`.
- Suggestion chips on the welcome screen: `SUGGESTIONS` in
  `src/components/WelcomeHero.jsx`.

### Connecting a real AI (Gemini is wired up already)
`getAssistantReply(userText)` in `src/data/sampleChats.js` already calls the
real Gemini API. To turn it on:

1. Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to a new file named `.env` and paste your key in:
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
3. Restart `npm run dev` (Vite only reads `.env` on startup).

Without a key, the app quietly falls back to the offline canned replies so
it still works out of the box.

**Security note:** this calls Gemini directly from the browser, so the key
is visible to anyone who opens dev tools on a deployed site. That's fine
for local use, but before deploying publicly, move the `fetch` call into a
small backend or serverless function that holds the key server-side, and
have the browser call that instead.

Want a different provider? The whole integration is one function — swap
the `fetch` call and response parsing for whichever API you'd rather use.

<br/>

## Notes on the code style

- **No extra state-management library.** Everything uses React's built-in
  `useState`. For an app this size that's simpler to read than adding
  Redux/Zustand/etc.
- **No CSS framework.** Styles are plain CSS using variables, split into
  `index.css` (tokens + resets, rarely touched) and `App.css` (layout,
  components, and the wallpaper/glass treatment, where most visual tweaks
  happen).
- **Every interactive element has a hover/press effect** via the shared
  `.pop-hover` class in `index.css` (a small grow-on-hover, shrink-on-click
  animation), plus visible keyboard focus rings for accessibility.
- **Comments explain the "why", not just the "what"**, especially in the
  trickier spots (auto-growing textarea, theme switching, the wallpaper
  glass effect, scroll-to-bottom).
- The layout is responsive: below 760px wide, the sidebar becomes an
  overlay drawer instead of a fixed column (see the `@media` query at the
  bottom of `App.css`).
