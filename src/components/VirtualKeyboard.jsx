const ROW1 = ['Q','W','E','R','T','Y','U','I','O','P']
const ROW2 = ['A','S','D','F','G','H','J','K','L']
const ROW3 = ['Z','X','C','V','B','N','M']

const GAP = 8
const KEY_W = `calc((100% - ${9 * GAP}px) / 10)`

export default function VirtualKeyboard({ onKey }) {
  const press = (e, key) => {
    e.preventDefault()
    onKey(key)
  }

  const keyClass = 'h-16 xl:h-20 rounded-xl text-base xl:text-lg font-bold text-white shadow-sm active:scale-95 transition-all hover:opacity-90 flex-shrink-0'

  return (
    <div className="mt-4 w-full space-y-2 p-4 xl:p-5 bg-gray-100 rounded-xl border border-gray-200">

      {/* Row 1 — Q to P */}
      <div className="flex gap-2">
        {ROW1.map(k => (
          <button key={k} type="button" onMouseDown={e => press(e, k)}
            className={keyClass} style={{ width: KEY_W, backgroundColor: '#9ca3af' }}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 2 — A to L */}
      <div className="flex gap-2 justify-center">
        {ROW2.map(k => (
          <button key={k} type="button" onMouseDown={e => press(e, k)}
            className={keyClass} style={{ width: KEY_W, backgroundColor: '#9ca3af' }}>
            {k}
          </button>
        ))}
      </div>

      {/* Row 3 — Z to M + Backspace */}
      <div className="flex gap-2 justify-center">
        {ROW3.map(k => (
          <button key={k} type="button" onMouseDown={e => press(e, k)}
            className={keyClass} style={{ width: KEY_W, backgroundColor: '#9ca3af' }}>
            {k}
          </button>
        ))}
        <button type="button" onMouseDown={e => press(e, 'BACKSPACE')}
          className={keyClass}
          style={{ width: `calc((100% - ${9 * GAP}px) / 10 * 1.5 + ${GAP}px)`, backgroundColor: '#e05a5a' }}>
          ⌫
        </button>
      </div>

      {/* Bottom row — Space + Enter */}
      <div className="flex gap-2 justify-center pt-1">
        <button type="button" onMouseDown={e => press(e, ' ')}
          className={keyClass}
          style={{ width: `calc((100% - ${9 * GAP}px) / 10 * 6 + ${5 * GAP}px)`, backgroundColor: '#9ca3af' }}>
          SPACE
        </button>
        <button type="button" onMouseDown={e => press(e, 'ENTER')}
          className={keyClass}
          style={{ width: `calc((100% - ${9 * GAP}px) / 10 * 2 + ${GAP}px)`, backgroundColor: '#4caf50' }}>
          Enter
        </button>
      </div>
    </div>
  )
}
