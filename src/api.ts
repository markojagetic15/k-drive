import type { SiteContent } from './content/types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error || `Zahtjev nije uspio (${res.status}).`)
  }
  return body as T
}

export function fetchContent() {
  return request<SiteContent>('/api/content')
}

export function saveContent(content: SiteContent) {
  return request<SiteContent>('/api/content', {
    method: 'PUT',
    body: JSON.stringify(content),
  })
}

export function login(password: string) {
  return request<{ ok: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function logout() {
  return request<{ ok: true }>('/api/auth/logout', { method: 'POST' })
}

export function fetchMe() {
  return request<{ authenticated: boolean }>('/api/auth/me')
}

export function sendInquiry(data: {
  name: string
  contact: string
  vehicle: string
  year: string
  service: string
  preferredDate: string
  message: string
  website: string
}) {
  return request<{ ok: true }>('/api/inquiry', {
    method: 'POST',
    credentials: 'omit',
    body: JSON.stringify(data),
  })
}

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error || `Slanje slike nije uspjelo (${res.status}).`)
  }
  return body as { url: string }
}
