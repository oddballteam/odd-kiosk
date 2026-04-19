import { TEAL } from '../lib/theme'

const ROW1 = ['Q','W','E','R','T','Y','U','I','O','P']
const ROW2 = ['A','S','D','F','G','H','J','K','L']
const ROW3 = ['Z','X','C','V','B','N','M']

// All keys share the same width, derived from the 10-key top row.
// gap-1.5 = 6px between keys.
const GAP = 6
const KEY_W = `calc((100% - ${9 * GAP}px) / 10)`

export default function VirtualKeyboard({ onKey }) {
  const press = (e, key) => {
    e.preventDefault()
    onKey(key)
  }

  const keyClass = 'h-12 rounded-lg text-sm font-bold text-white shadow-sm active:scale-95 transition-all hover:opacity-90 flex-shrink-0'

  return (
    <div className="mt-3 w-full space-y-1.5 p-3 bg-gray-100 rounded-xl border border-gray-200">

      {/* Row 1 — Q to P */}
      <div className="flex gap-1.5">
        {ROW1.map(k => (
          <button key={k} type="button" onMouseDown={e => press(e, k)}
            className={keyClass} style={{ width: KEY_W, backgroundColor: TEAL }}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 2 — A to L (indented half a key) */}
      <div className="flex gap-1.5 justify-center">
        {ROW2.map(k => (
          <button key={k} type="button" onMouseDown={e => press(e, k)}
            className={keyClass} style={{ width: KEY_W, backgroundColor: TEAL }}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 3 — Z to M + Backspace */}
      <div className="flex gap-1.5 justify-center">
        {ROW3.map(k => (
          <button key={k} type="button" onMouseDown={e => press(e, k)}
            className={keyClass} style={{ width: KEY_W, backgroundColor: TEAL }}>
            {k}
          </button>
        ))}
        <button type="button" onMouseDown={e => press(e, 'BACKSPACE')}
          className={keyClass}
          style={{ width: `calc((100% - ${9 * GAP}px) / 10 * 1.5 + ${GAP}px)`, backgroundColor: '#e05a5a' }}>
          ⌫
        </button>
      </div>

      {/* Bottom row — Space + Clear */}
      <div className="flex gap-1.5 justify-center pt-0.5">
        <button type="button" onMouseDown={e => press(e, ' ')}
          className={keyClass}
          style={{ width: `calc((100% - ${9 * GAP}px) / 10 * 6 + ${5 * GAP}px)`, backgroundColor: TEAL }}>
          SPACE
        </button>
        <button type="button" onMouseDown={e => press(e, 'CLEAR')}
          className={keyClass}
          style={{ width: `calc((100% - ${9 * GAP}px) / 10 * 2 + ${GAP}px)`, backgroundColor: '#e05a5a' }}>
          Clear
        </button>
      </div>
    </div>
  )
}
