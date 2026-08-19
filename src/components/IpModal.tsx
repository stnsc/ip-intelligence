import { useEffect, useRef, useState } from 'react'

interface IpModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (ip: string) => void
}

function IpModal({ open, onClose, onSubmit }: IpModalProps) {
  const [ip, setIp] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ip.trim()) {
      onSubmit(ip.trim())
      setIp('')
      onClose()
    }
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="ip-input"
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="Paste IP address here"
          />
          <button type="submit">Lookup</button>
        </form>
      </div>
    </div>
  )
}

export default IpModal
