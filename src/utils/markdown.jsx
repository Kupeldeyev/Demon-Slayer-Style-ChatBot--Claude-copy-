// A minimal, dependency-free markdown renderer for chat messages.
//
// Assistant replies often come back with markdown-ish formatting
// (**bold**, `code`, fenced code blocks, lists, headings, links) but
// MessageBubble was just dropping that text into a <div> as a raw
// string, so it rendered as one flat, unstyled blob with literal
// asterisks and backticks still showing.
//
// This file turns that same text into real React elements so the
// existing formatting actually shows up. It intentionally supports a
// small, common subset of markdown rather than pulling in a full
// parser library:
//   - fenced code blocks:      ```js ... ```
//   - inline code:             `like this`
//   - bold / italic:           **bold** / *italic*
//   - links:                   [label](https://example.com)
//   - headings:                #, ##, ###
//   - bullet lists:            - item / * item
//   - numbered lists:          1. item
//   - blockquotes:             > quoted text
//   - paragraphs with soft line breaks

function renderInline(text, keyPrefix) {
  // Split the line into alternating "plain text" / "matched token" chunks.
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(pattern).filter((part) => part !== '')

  return parts.map((part, i) => {
    const key = `${keyPrefix}-inline-${i}`

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="md-inline-code">
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, url] = linkMatch
      return (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="md-link">
          {label}
        </a>
      )
    }

    return part
  })
}

export function renderMarkdown(text) {
  if (!text) return null

  // First pass: pull out fenced code blocks so their contents never get
  // mangled by the list/heading/paragraph parsing below.
  const codeBlockPattern = /```([\w-]*)\n?([\s\S]*?)```/g
  const segments = []
  let lastIndex = 0
  let match

  while ((match = codeBlockPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'code', lang: match[1], content: match[2].replace(/\n$/, '') })
    lastIndex = codeBlockPattern.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  const blocks = []

  segments.forEach((segment, segIndex) => {
    if (segment.type === 'code') {
      blocks.push(
        <pre key={`code-${segIndex}`} className="md-code-block">
          <code>{segment.content}</code>
        </pre>,
      )
      return
    }

    // Second pass: walk the remaining plain-text lines, grouping
    // consecutive lines of the same kind (heading / list / quote /
    // paragraph) into one block each.
    const lines = segment.content.split('\n')
    let i = 0
    let blockIndex = 0

    const isHeading = (line) => /^(#{1,3})\s+(.*)$/.test(line)
    const isBullet = (line) => /^\s*[-*]\s+(.*)$/.test(line)
    const isOrdered = (line) => /^\s*\d+[.)]\s+(.*)$/.test(line)
    const isQuote = (line) => /^\s*>\s?(.*)$/.test(line)

    while (i < lines.length) {
      const line = lines[i]

      if (line.trim() === '') {
        i += 1
        continue
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
      if (headingMatch) {
        const level = headingMatch[1].length
        // Keep headings modest inside a small chat bubble (h4-h6 instead
        // of h1-h3, which would look oversized next to normal text).
        const HeadingTag = `h${Math.min(level + 3, 6)}`
        blocks.push(
          <HeadingTag key={`s${segIndex}-b${blockIndex}`} className="md-heading">
            {renderInline(headingMatch[2], `s${segIndex}-b${blockIndex}`)}
          </HeadingTag>,
        )
        blockIndex += 1
        i += 1
        continue
      }

      if (isBullet(line)) {
        const items = []
        while (i < lines.length && isBullet(lines[i])) {
          items.push(lines[i].match(/^\s*[-*]\s+(.*)$/)[1])
          i += 1
        }
        blocks.push(
          <ul key={`s${segIndex}-b${blockIndex}`} className="md-list">
            {items.map((item, idx) => (
              <li key={idx}>{renderInline(item, `s${segIndex}-b${blockIndex}-${idx}`)}</li>
            ))}
          </ul>,
        )
        blockIndex += 1
        continue
      }

      if (isOrdered(line)) {
        const items = []
        while (i < lines.length && isOrdered(lines[i])) {
          items.push(lines[i].match(/^\s*\d+[.)]\s+(.*)$/)[1])
          i += 1
        }
        blocks.push(
          <ol key={`s${segIndex}-b${blockIndex}`} className="md-list">
            {items.map((item, idx) => (
              <li key={idx}>{renderInline(item, `s${segIndex}-b${blockIndex}-${idx}`)}</li>
            ))}
          </ol>,
        )
        blockIndex += 1
        continue
      }

      if (isQuote(line)) {
        const items = []
        while (i < lines.length && isQuote(lines[i])) {
          items.push(lines[i].match(/^\s*>\s?(.*)$/)[1])
          i += 1
        }
        blocks.push(
          <blockquote key={`s${segIndex}-b${blockIndex}`} className="md-quote">
            {renderInline(items.join(' '), `s${segIndex}-b${blockIndex}`)}
          </blockquote>,
        )
        blockIndex += 1
        continue
      }

      // Plain paragraph: gather consecutive lines that aren't one of the
      // special block types above, joined with soft line breaks.
      const paraLines = []
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !isHeading(lines[i]) &&
        !isBullet(lines[i]) &&
        !isOrdered(lines[i]) &&
        !isQuote(lines[i])
      ) {
        paraLines.push(lines[i])
        i += 1
      }
      blocks.push(
        <p key={`s${segIndex}-b${blockIndex}`} className="md-paragraph">
          {paraLines.map((paraLine, lineIdx) => (
            <span key={lineIdx}>
              {renderInline(paraLine, `s${segIndex}-b${blockIndex}-${lineIdx}`)}
              {lineIdx < paraLines.length - 1 && <br />}
            </span>
          ))}
        </p>,
      )
      blockIndex += 1
    }
  })

  return blocks
}
