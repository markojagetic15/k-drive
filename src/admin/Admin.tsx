import { useEffect, useState } from 'react'
import './admin.css'
import { fetchMe } from '../api'
import Login from './Login'
import Dashboard from './Dashboard'

export default function Admin() {
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    fetchMe()
      .then((res) => setAuthenticated(res.authenticated))
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div className="admin-shell admin-center">
        <div className="spinner" aria-hidden="true" />
      </div>
    )
  }

  if (!authenticated) {
    return <Login onSuccess={() => setAuthenticated(true)} />
  }

  return <Dashboard onLogout={() => setAuthenticated(false)} />
}
