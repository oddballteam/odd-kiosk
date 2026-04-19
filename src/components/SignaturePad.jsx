import { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react'
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
      <div className="border-2 border-transparent rounded-xl overflow-hidden relative bg-white">
        <SignatureCanvas
          ref={sigPadRef}
          onEnd={handleEnd}
          canvasProps={{
            className: 'signature-canvas w-full',
            height: 110,
            style: { width: '100%', height: '110px' },
          }}
          backgroundColor="white"
          penColor="#1e3a5f"
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-lg select-none">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="h-px flex-1 bg-gray-200 mx-2" />
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors px-2"
        >
          Clear signature
        </button>
      </div>
    </div>
  )
})

export default SignaturePad
