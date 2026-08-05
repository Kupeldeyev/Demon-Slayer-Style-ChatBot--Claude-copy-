// This is the very first file that runs in the browser.
// Its only job is to find the <div id="root"> from index.html
// and tell React to render our <App /> component inside it.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
