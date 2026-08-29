import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ACCEPTED_INPUT_ATTR = '.pdf,.jpg,.jpeg,.png'

interface UploadZoneProps {
  onFileSelected: (file: File) => void
}

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function acceptOrReject(file: File | undefined) {
    if (!file) {
      return
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setRejectionMessage(`"${file.name}" isn't a PDF, JPG, or PNG — try a different file.`)
      return
    }
    setRejectionMessage(null)
    onFileSelected(file)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    acceptOrReject(event.dataTransfer.files[0])
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    acceptOrReject(event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-surface'
        }`}
      >
        <div className="rounded-full bg-primary/10 p-3">
          <UploadIcon />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text-primary">
            Drag and drop your invoice here
          </p>
          <p className="mt-1 text-sm text-text-secondary">Accepts PDF, JPG, and PNG</p>
        </div>
        <Button type="button" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_INPUT_ATTR}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
      {rejectionMessage && <p className="mt-2 text-sm text-danger">{rejectionMessage}</p>}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}
