import { MenuIcon } from './Icons.jsx'
import { models } from '../data/models.js'

export default function TopBar({ chatTitle, onToggleSidebar, activeModel, onModelChange }) {
  return (
    <header className="top-bar">
      <button
        className="icon-btn pop-hover"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </button>

      <h2 className="top-bar__title">{chatTitle}</h2>

      {/* A plain <select> keeps this fully accessible and keyboard-friendly
          without needing any custom dropdown code. */}
      <select
        className="model-picker pop-hover"
        value={activeModel}
        onChange={(event) => onModelChange(event.target.value)}
        aria-label="Choose a model"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </header>
  )
}
