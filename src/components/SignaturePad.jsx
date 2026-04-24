import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

const SignaturePad = forwardRef(function SignaturePad({ onChange }, ref) {
  const sigPadRef = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useImperativeHandle(ref, () => ({
    getDataURL: () => {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) return null
      return sigPadRef.current.getTrimmedCanvas().toDataURL('image/png')
    },
    clear: () => {
      sigPadRef.current?.clear()
      setIsEmpty(true)
      onChange?.(null)
    },
    isEmpty: () => sigPadRef.current?.isEmpty() ?? true,
  }))

  const handleEnd = () => {
    const empty = sigPadRef.current?.isEmpty() ?? true
    setIsEmpty(empty)
    if (!empty && onChange) {
      onChange(sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'))
    }
  }

  const handleClear = () => {
    sigPadRef.current?.clear()
    setIsEmpty(true)
    onChange?.(null)
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-transparent rounded-xl overflow-hidden relative bg-gray-100">
        <SignatureCanvas
          ref={sigPadRef}
          onEnd={handleEnd}
          canvasProps={{
            className: 'signature-canvas w-full',
            height: 150,
            style: { width: '100%', height: '150px' },
          }}
          backgroundColor="#f3f4f6"
          penColor="#1e3a5f"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-xl select-none">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          className="px-5 py-2 rounded-xl text-base font-semibold text-white bg-gray-400 hover:bg-red-400 transition-colors"
        >
          Clear signature
        </button>
      </div>
    </div>
  )
})

export default SignaturePad
