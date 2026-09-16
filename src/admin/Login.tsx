import { useState, type FormEvent } from 'react'
import { login } from '../api'
import { Icon } from '../components/Icon'
import PasswordField from '../components/PasswordField'
import { useTheme } from '../context/ThemeContext'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    login(password)
      .then(onSuccess)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false))
  }

  return (
    <div className="admin-shell admin-center">
      <button
        type="button"
        className="icon-toggle admin-theme-toggle"
        onClick={toggleTheme}
        aria-label={
          theme === 'light' ? 'Uključi tamni način rada' : 'Uključi svijetli način rada'
        }
        title={theme === 'light' ? 'Dark mode' : 'Light mode'}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} className="icon" />
      </button>
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-brand">
          <img className="brand-mark" src="/brand-mark-boxed.png" alt="K-Drive" />
          K-Drive Admin
        </div>
        <p className="admin-login-hint">
          Prijavite se za uređivanje sadržaja stranice.
        </p>
        <PasswordField
          label="Lozinka"
          value={password}
          onChange={setPassword}
          required
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="admin-error">{error}</p>}
        <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
          {busy ? 'Prijava...' : 'Prijavi se'}
        </button>
      </form>
    </div>
  )
}
