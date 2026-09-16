import { useId, useState } from 'react'
import { Icon } from './Icon'

export default function PasswordField({
  label,
  value,
  onChange,
  required,
  autoFocus,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoFocus?: boolean
  autoComplete?: string
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
          title={visible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
          tabIndex={-1}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} className="icon" />
        </button>
      </div>
    </div>
  )
}
