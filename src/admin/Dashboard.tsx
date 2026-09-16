import { useEffect, useState } from 'react'
import type {
  HighlightItem,
  ProcessStep,
  ServiceItem,
  SiteContent,
  StatItem,
  ValueItem,
} from '../content/types'
import { fetchContent, logout, saveContent } from '../api'
import { Icon, ICON_NAMES } from '../components/Icon'
import { useTheme } from '../context/ThemeContext'
import LocalizedField from './LocalizedField'
import ImageUploader from './ImageUploader'

const TABS = [
  { id: 'kontakt', label: 'Kontakt' },
  { id: 'hero', label: 'Naslovnica' },
  { id: 'onama', label: 'O nama' },
  { id: 'usluge', label: 'Usluge' },
  { id: 'proces', label: 'Proces' },
  { id: 'ostalo', label: 'CTA i footer' },
] as const

type TabId = (typeof TABS)[number]['id']

function emptyLocalized() {
  return { hr: '', en: '' }
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { theme, toggleTheme } = useTheme()
  const [draft, setDraft] = useState<SiteContent | null>(null)
  const [tab, setTab] = useState<TabId>('kontakt')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchContent().then(setDraft)
  }, [])

  if (!draft) {
    return (
      <div className="admin-shell admin-center">
        <div className="spinner" aria-hidden="true" />
      </div>
    )
  }

  function handleSave() {
    if (!draft) return
    setSaving(true)
    setStatus(null)
    saveContent(draft)
      .then((saved) => {
        setDraft(saved)
        setStatus('Spremljeno.')
      })
      .catch((err: Error) => setStatus(`Greška: ${err.message}`))
      .finally(() => setSaving(false))
  }

  function handleLogout() {
    logout().finally(onLogout)
  }

  // Images are persisted immediately on upload (not just on "Spremi promjene")
  // so a new image is never lost by navigating away or restarting the server
  // before an explicit save.
  function persist(next: SiteContent) {
    setDraft(next)
    setStatus('Spremanje slike...')
    saveContent(next)
      .then((saved) => {
        setDraft(saved)
        setStatus('Slika spremljena.')
      })
      .catch((err: Error) => setStatus(`Greška: ${err.message}`))
  }

  function updateHighlight(index: number, patch: Partial<HighlightItem>) {
    setDraft((prev) => {
      if (!prev) return prev
      const next = [...prev.highlights]
      next[index] = { ...next[index], ...patch }
      return { ...prev, highlights: next }
    })
  }

  function addHighlight() {
    setDraft((prev) => {
      if (!prev) return prev
      const item: HighlightItem = {
        id: crypto.randomUUID(),
        icon: 'settings',
        title: emptyLocalized(),
        desc: emptyLocalized(),
      }
      return { ...prev, highlights: [...prev.highlights, item] }
    })
  }

  function removeHighlight(index: number) {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, highlights: prev.highlights.filter((_, i) => i !== index) }
    })
  }

  function updateService(index: number, patch: Partial<ServiceItem>) {
    setDraft((prev) => {
      if (!prev) return prev
      const items = [...prev.services.items]
      items[index] = { ...items[index], ...patch }
      return { ...prev, services: { ...prev.services, items } }
    })
  }

  function addService() {
    setDraft((prev) => {
      if (!prev) return prev
      const item: ServiceItem = {
        id: crypto.randomUUID(),
        icon: 'wrench',
        title: emptyLocalized(),
        desc: emptyLocalized(),
      }
      return {
        ...prev,
        services: { ...prev.services, items: [...prev.services.items, item] },
      }
    })
  }

  function removeService(index: number) {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        services: {
          ...prev.services,
          items: prev.services.items.filter((_, i) => i !== index),
        },
      }
    })
  }

  function updateValue(index: number, patch: Partial<ValueItem>) {
    setDraft((prev) => {
      if (!prev) return prev
      const values = [...prev.values]
      values[index] = { ...values[index], ...patch }
      return { ...prev, values }
    })
  }

  function updateStep(index: number, patch: Partial<ProcessStep>) {
    setDraft((prev) => {
      if (!prev) return prev
      const steps = [...prev.process.steps]
      steps[index] = { ...steps[index], ...patch }
      return { ...prev, process: { ...prev.process, steps } }
    })
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-brand">
          <span className="brand-mark">KD</span>
          K-Drive Admin
        </div>
        <div className="admin-header-actions">
          {status && <span className="admin-status">{status}</span>}
          <button
            type="button"
            className="icon-toggle"
            onClick={toggleTheme}
            aria-label={
              theme === 'light' ? 'Uključi tamni način rada' : 'Uključi svijetli način rada'
            }
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="icon" />
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saving ? 'Spremanje...' : 'Spremi promjene'}
          </button>
          <button className="btn btn-outline" onClick={handleLogout} type="button">
            Odjava
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-panel">
          {tab === 'kontakt' && (
            <section className="admin-section">
              <h2>Kontakt podaci</h2>
              <div className="field-grid">
                <div className="field">
                  <span className="field-label">Telefon (prikazano)</span>
                  <input
                    value={draft.contact.phone}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        contact: { ...draft.contact, phone: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">
                    Telefon (tel: link, npr. tel:+385911234567)
                  </span>
                  <input
                    value={draft.contact.phoneHref}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        contact: { ...draft.contact, phoneHref: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">Email (za formu upita)</span>
                  <input
                    value={draft.contact.email}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        contact: { ...draft.contact, email: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">Adresa</span>
                  <input
                    value={draft.contact.address}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        contact: { ...draft.contact, address: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">
                    Adresa za Google Maps pretragu
                  </span>
                  <input
                    value={draft.contact.mapQuery}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        contact: { ...draft.contact, mapQuery: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <LocalizedField
                label="Radno vrijeme"
                value={draft.contact.hours}
                onChange={(hours) =>
                  setDraft({ ...draft, contact: { ...draft.contact, hours } })
                }
              />
            </section>
          )}

          {tab === 'hero' && (
            <section className="admin-section">
              <h2>Naslovnica</h2>
              <ImageUploader
                label="Slika naslovnice"
                value={draft.hero.image}
                onChange={(image) =>
                  persist({ ...draft, hero: { ...draft.hero, image } })
                }
              />
              <LocalizedField
                label="Oznaka iznad naslova"
                value={draft.hero.eyebrow}
                onChange={(eyebrow) =>
                  setDraft({ ...draft, hero: { ...draft.hero, eyebrow } })
                }
              />
              <LocalizedField
                label="Naslov"
                value={draft.hero.title}
                onChange={(title) =>
                  setDraft({ ...draft, hero: { ...draft.hero, title } })
                }
              />
              <LocalizedField
                label="Opis"
                value={draft.hero.lead}
                onChange={(lead) =>
                  setDraft({ ...draft, hero: { ...draft.hero, lead } })
                }
                multiline
              />
              <LocalizedField
                label="Glavni gumb"
                value={draft.hero.ctaPrimary}
                onChange={(ctaPrimary) =>
                  setDraft({ ...draft, hero: { ...draft.hero, ctaPrimary } })
                }
              />
              <LocalizedField
                label="Sporedni gumb (prefiks pored telefona)"
                value={draft.hero.ctaSecondary}
                onChange={(ctaSecondary) =>
                  setDraft({ ...draft, hero: { ...draft.hero, ctaSecondary } })
                }
              />

              <h3>Statistika ispod gumba</h3>
              {draft.hero.stats.map((stat, index) => (
                <div className="array-item" key={stat.id}>
                  <div className="field-grid">
                    <div className="field">
                      <span className="field-label">Ikona</span>
                      <div className="icon-select">
                        <Icon name={stat.icon} />
                        <select
                          value={stat.icon}
                          onChange={(e) => {
                            const stats = [...draft.hero.stats]
                            stats[index] = {
                              ...stat,
                              icon: e.target.value as StatItem['icon'],
                            }
                            setDraft({ ...draft, hero: { ...draft.hero, stats } })
                          }}
                        >
                          {ICON_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <span className="field-label">Broj/vrijednost</span>
                      <input
                        value={stat.value}
                        onChange={(e) => {
                          const stats = [...draft.hero.stats]
                          stats[index] = { ...stat, value: e.target.value }
                          setDraft({ ...draft, hero: { ...draft.hero, stats } })
                        }}
                      />
                    </div>
                  </div>
                  <LocalizedField
                    label="Opis"
                    value={stat.label}
                    onChange={(label) => {
                      const stats = [...draft.hero.stats]
                      stats[index] = { ...stat, label }
                      setDraft({ ...draft, hero: { ...draft.hero, stats } })
                    }}
                  />
                </div>
              ))}

              <h3>Plutajuće oznake na slici</h3>
              {draft.hero.chips.map((chip, index) => (
                <div className="array-item" key={chip.id}>
                  <div className="field-grid">
                    <div className="field">
                      <span className="field-label">Ikona</span>
                      <div className="icon-select">
                        <Icon name={chip.icon} />
                        <select
                          value={chip.icon}
                          onChange={(e) => {
                            const chips = [...draft.hero.chips]
                            chips[index] = {
                              ...chip,
                              icon: e.target.value as ServiceItem['icon'],
                            }
                            setDraft({ ...draft, hero: { ...draft.hero, chips } })
                          }}
                        >
                          {ICON_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <LocalizedField
                    label="Tekst oznake"
                    value={chip.label}
                    onChange={(label) => {
                      const chips = [...draft.hero.chips]
                      chips[index] = { ...chip, label }
                      setDraft({ ...draft, hero: { ...draft.hero, chips } })
                    }}
                  />
                </div>
              ))}

              <h3>Marke vozila (traka ispod naslovnice)</h3>
              <LocalizedField
                label="Tekst iznad popisa marki"
                value={draft.brands.label}
                onChange={(label) =>
                  setDraft({ ...draft, brands: { ...draft.brands, label } })
                }
              />
              <div className="field">
                <span className="field-label">
                  Marke (odvojene zarezom)
                </span>
                <input
                  value={draft.brands.items.join(', ')}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      brands: {
                        ...draft.brands,
                        items: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </div>

              <h3>Google recenzije</h3>
              <p className="field-hint">
                Ocjenu i broj recenzija ostavite prazno dok nemate stvarne
                podatke s Google profila - prikazat će se samo poveznica.
              </p>
              <div className="field-grid">
                <div className="field">
                  <span className="field-label">Ocjena (npr. 4.9/5)</span>
                  <input
                    value={draft.reviews.rating}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        reviews: { ...draft.reviews, rating: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">Broj recenzija</span>
                  <input
                    value={draft.reviews.count}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        reviews: { ...draft.reviews, count: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <span className="field-label">Poveznica na Google recenzije</span>
                  <input
                    value={draft.reviews.url}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        reviews: { ...draft.reviews, url: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </section>
          )}

          {tab === 'onama' && (
            <section className="admin-section">
              <h2>O nama</h2>
              <ImageUploader
                label="Slika"
                value={draft.about.image}
                onChange={(image) =>
                  persist({ ...draft, about: { ...draft.about, image } })
                }
              />
              <LocalizedField
                label="Oznaka iznad naslova"
                value={draft.about.eyebrow}
                onChange={(eyebrow) =>
                  setDraft({ ...draft, about: { ...draft.about, eyebrow } })
                }
              />
              <LocalizedField
                label="Naslov"
                value={draft.about.title}
                onChange={(title) =>
                  setDraft({ ...draft, about: { ...draft.about, title } })
                }
              />
              {draft.about.paragraphs.map((p, index) => (
                <LocalizedField
                  key={index}
                  label={`Odlomak ${index + 1}`}
                  value={p}
                  multiline
                  onChange={(next) => {
                    const paragraphs = [...draft.about.paragraphs]
                    paragraphs[index] = next
                    setDraft({ ...draft, about: { ...draft.about, paragraphs } })
                  }}
                />
              ))}
              <LocalizedField
                label="Značka - vrijednost"
                value={draft.about.badgeValue}
                onChange={(badgeValue) =>
                  setDraft({ ...draft, about: { ...draft.about, badgeValue } })
                }
              />
              <LocalizedField
                label="Značka - opis"
                value={draft.about.badgeLabel}
                onChange={(badgeLabel) =>
                  setDraft({ ...draft, about: { ...draft.about, badgeLabel } })
                }
              />

              <h3>Prednosti (kartice)</h3>
              {draft.highlights.map((item, index) => (
                <div className="array-item" key={item.id}>
                  <div className="field-grid">
                    <div className="field">
                      <span className="field-label">Ikona</span>
                      <div className="icon-select">
                        <Icon name={item.icon} />
                        <select
                          value={item.icon}
                          onChange={(e) =>
                            updateHighlight(index, {
                              icon: e.target.value as HighlightItem['icon'],
                            })
                          }
                        >
                          {ICON_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <LocalizedField
                    label="Naslov"
                    value={item.title}
                    onChange={(title) => updateHighlight(index, { title })}
                  />
                  <LocalizedField
                    label="Opis"
                    value={item.desc}
                    multiline
                    onChange={(desc) => updateHighlight(index, { desc })}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-danger"
                    onClick={() => removeHighlight(index)}
                  >
                    Ukloni
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={addHighlight}>
                + Dodaj prednost
              </button>
            </section>
          )}

          {tab === 'usluge' && (
            <section className="admin-section">
              <h2>Usluge</h2>
              <LocalizedField
                label="Oznaka iznad naslova"
                value={draft.services.eyebrow}
                onChange={(eyebrow) =>
                  setDraft({ ...draft, services: { ...draft.services, eyebrow } })
                }
              />
              <LocalizedField
                label="Naslov"
                value={draft.services.title}
                onChange={(title) =>
                  setDraft({ ...draft, services: { ...draft.services, title } })
                }
              />
              <LocalizedField
                label="Opis"
                value={draft.services.lead}
                multiline
                onChange={(lead) =>
                  setDraft({ ...draft, services: { ...draft.services, lead } })
                }
              />

              <h3>Popis usluga</h3>
              {draft.services.items.map((service, index) => (
                <div className="array-item" key={service.id}>
                  <div className="field-grid">
                    <div className="field">
                      <span className="field-label">Ikona</span>
                      <div className="icon-select">
                        <Icon name={service.icon} />
                        <select
                          value={service.icon}
                          onChange={(e) =>
                            updateService(index, {
                              icon: e.target.value as ServiceItem['icon'],
                            })
                          }
                        >
                          {ICON_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <LocalizedField
                    label="Naziv usluge"
                    value={service.title}
                    onChange={(title) => updateService(index, { title })}
                  />
                  <LocalizedField
                    label="Opis"
                    value={service.desc}
                    multiline
                    onChange={(desc) => updateService(index, { desc })}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-danger"
                    onClick={() => removeService(index)}
                  >
                    Ukloni
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline" onClick={addService}>
                + Dodaj uslugu
              </button>

              <h3>Zašto nas odabrati (tri vrijednosti)</h3>
              {draft.values.map((value, index) => (
                <div className="array-item" key={value.id}>
                  <div className="field-grid">
                    <div className="field">
                      <span className="field-label">Ikona</span>
                      <div className="icon-select">
                        <Icon name={value.icon} />
                        <select
                          value={value.icon}
                          onChange={(e) =>
                            updateValue(index, {
                              icon: e.target.value as ValueItem['icon'],
                            })
                          }
                        >
                          {ICON_NAMES.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <LocalizedField
                    label="Naslov"
                    value={value.title}
                    onChange={(title) => updateValue(index, { title })}
                  />
                  <LocalizedField
                    label="Opis"
                    value={value.desc}
                    multiline
                    onChange={(desc) => updateValue(index, { desc })}
                  />
                </div>
              ))}
            </section>
          )}

          {tab === 'proces' && (
            <section className="admin-section">
              <h2>Naš proces</h2>
              <LocalizedField
                label="Oznaka iznad naslova"
                value={draft.process.eyebrow}
                onChange={(eyebrow) =>
                  setDraft({ ...draft, process: { ...draft.process, eyebrow } })
                }
              />
              <LocalizedField
                label="Naslov"
                value={draft.process.title}
                onChange={(title) =>
                  setDraft({ ...draft, process: { ...draft.process, title } })
                }
              />
              <LocalizedField
                label="Opis"
                value={draft.process.lead}
                multiline
                onChange={(lead) =>
                  setDraft({ ...draft, process: { ...draft.process, lead } })
                }
              />

              <h3>Koraci</h3>
              {draft.process.steps.map((step, index) => (
                <div className="array-item" key={step.id}>
                  <ImageUploader
                    label={`Slika koraka ${index + 1}`}
                    value={step.image}
                    onChange={(image) => {
                      const steps = [...draft.process.steps]
                      steps[index] = { ...steps[index], image }
                      persist({ ...draft, process: { ...draft.process, steps } })
                    }}
                  />
                  <LocalizedField
                    label="Naslov koraka"
                    value={step.title}
                    onChange={(title) => updateStep(index, { title })}
                  />
                  <LocalizedField
                    label="Opis koraka"
                    value={step.desc}
                    multiline
                    onChange={(desc) => updateStep(index, { desc })}
                  />
                </div>
              ))}
            </section>
          )}

          {tab === 'ostalo' && (
            <section className="admin-section">
              <h2>CTA traka</h2>
              <ImageUploader
                label="Pozadinska slika CTA trake"
                value={draft.cta.image}
                onChange={(image) =>
                  persist({ ...draft, cta: { ...draft.cta, image } })
                }
              />
              <LocalizedField
                label="Naslov"
                value={draft.cta.title}
                onChange={(title) =>
                  setDraft({ ...draft, cta: { ...draft.cta, title } })
                }
              />
              <LocalizedField
                label="Opis"
                value={draft.cta.lead}
                multiline
                onChange={(lead) =>
                  setDraft({ ...draft, cta: { ...draft.cta, lead } })
                }
              />

              <h2>Footer</h2>
              <LocalizedField
                label="Opis servisa"
                value={draft.footer.desc}
                multiline
                onChange={(desc) =>
                  setDraft({ ...draft, footer: { ...draft.footer, desc } })
                }
              />

              <h2>Navigacija</h2>
              <LocalizedField
                label="Usluge"
                value={draft.nav.usluge}
                onChange={(usluge) =>
                  setDraft({ ...draft, nav: { ...draft.nav, usluge } })
                }
              />
              <LocalizedField
                label="O nama"
                value={draft.nav.oNama}
                onChange={(oNama) =>
                  setDraft({ ...draft, nav: { ...draft.nav, oNama } })
                }
              />
              <LocalizedField
                label="Proces"
                value={draft.nav.proces}
                onChange={(proces) =>
                  setDraft({ ...draft, nav: { ...draft.nav, proces } })
                }
              />
              <LocalizedField
                label="Kontakt"
                value={draft.nav.kontakt}
                onChange={(kontakt) =>
                  setDraft({ ...draft, nav: { ...draft.nav, kontakt } })
                }
              />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
