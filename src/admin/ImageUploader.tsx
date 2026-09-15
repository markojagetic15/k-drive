import { useRef, useState } from 'react'
import { uploadImage } from '../api'

export default function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File) {
    setBusy(true)
    setError(null)
    uploadImage(file)
      .then((res) => onChange(res.url))
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false))
  }

  return (
    <div className="image-uploader">
      <span className="field-label">{label}</span>
      <div className="image-uploader-preview">
        {value && <img src={value} alt="" />}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? 'Slanje...' : 'Promijeni sliku'}
      </button>
      {error && <p className="admin-error">{error}</p>}
    </div>
  )
}
