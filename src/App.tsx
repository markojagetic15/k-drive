import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import './App.css'
import { Icon } from './components/Icon'
import { WrenchMotif } from './components/Decor'
import { Reveal } from './components/Reveal'
// Privremeno isključeno dok radno vrijeme ne bude pouzdano potvrđeno - vidi upotrebu niže
// import { LiveStatus } from './components/LiveStatus'
import { TuningCalculator } from './components/TuningCalculator'
import { BeforeAfterSlider } from './components/BeforeAfterSlider'
import { useContent } from './context/ContentContext'
import { useLanguage } from './context/LanguageContext'
import { useTheme } from './context/ThemeContext'
import { sendInquiry } from './api'
import type { IconName } from './content/types'

const SERVICE_CHECKBOXES: { id: string; label: Record<'hr' | 'en', string> }[] = [
  { id: 'mali-servis', label: { hr: 'Mali servis', en: 'Minor service' } },
  { id: 'veliki-servis', label: { hr: 'Veliki servis', en: 'Major service' } },
  { id: 'dijagnostika', label: { hr: 'Dijagnostika', en: 'Diagnostics' } },
  { id: 'tuning', label: { hr: 'Tuning', en: 'Tuning' } },
  { id: 'kocnice', label: { hr: 'Kočnice', en: 'Brakes' } },
  { id: 'drugo', label: { hr: 'Drugo', en: 'Other' } },
]

type InquiryForm = {
  name: string
  phone: string
  vehicle: string
  preferredDate: string
  services: string[]
  note: string
  website: string
}

const EMPTY_FORM: InquiryForm = {
  name: '',
  phone: '',
  vehicle: '',
  preferredDate: '',
  services: [],
  note: '',
  website: '',
}

type HeroFilter = {
  marka: string
  model: string
  godiste: string
  kategorija: string
}

const EMPTY_HERO_FILTER: HeroFilter = {
  marka: '',
  model: '',
  godiste: '',
  kategorija: '',
}

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error'

function App() {
  const { content, loading, error } = useContent()
  const { t, lang, toggleLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const [form, setForm] = useState<InquiryForm>(EMPTY_FORM)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [heroFilter, setHeroFilter] = useState<HeroFilter>(EMPTY_HERO_FILTER)
  const [highlightedService, setHighlightedService] = useState<string | null>(null)

  function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault()
    setMobileNavOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToContact() {
    document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function requestServiceQuote(serviceTitle: string) {
    setForm((prev) => ({
      ...prev,
      note: lang === 'hr' ? `Zanima me: ${serviceTitle}` : `Interested in: ${serviceTitle}`,
    }))
    scrollToContact()
  }

  function requestTuningQuote(modelName: string, stageLabel: string) {
    setForm((prev) => ({
      ...prev,
      vehicle: modelName,
      services: prev.services.includes('tuning')
        ? prev.services
        : [...prev.services, 'tuning'],
      note:
        lang === 'hr'
          ? `Zanima me chip tuning (${stageLabel}) za ${modelName}`
          : `Interested in chip tuning (${stageLabel}) for ${modelName}`,
    }))
    scrollToContact()
  }

  function toggleFormService(id: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }))
  }

  useEffect(() => {
    if (!mobileNavOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileNavOpen])

  if (loading) {
    return (
      <div className="page-status">
        <div className="spinner" aria-hidden="true" />
        <p>{lang === 'hr' ? 'Učitavanje...' : 'Loading...'}</p>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="page-status">
        <p>
          {lang === 'hr'
            ? 'Sadržaj se trenutno ne može učitati. Provjerite je li backend pokrenut.'
            : 'Content could not be loaded. Please check that the backend is running.'}
        </p>
      </div>
    )
  }

  function updateField<K extends Exclude<keyof InquiryForm, 'services'>>(
    key: K,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setSubmitError(null)
    sendInquiry(form)
      .then(() => {
        setStatus('success')
        setForm(EMPTY_FORM)
      })
      .catch((err: Error) => {
        setStatus('error')
        setSubmitError(err.message)
      })
  }

  function handleHeroFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const vehicleParts = [heroFilter.marka, heroFilter.model, heroFilter.godiste]
      .map((s) => s.trim())
      .filter(Boolean)
    if (vehicleParts.length) {
      setForm((prev) => ({ ...prev, vehicle: vehicleParts.join(' ') }))
    }

    const match = content.services.items.find(
      (s) => t(s.title) === heroFilter.kategorija,
    )

    if (match) {
      setHighlightedService(match.id)
      document
        .getElementById(`service-${match.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      window.setTimeout(() => setHighlightedService(null), 2600)
    } else {
      document.getElementById('usluge')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const NAV_LINKS: { id: string; href: string; label: string }[] = [
    { id: 'o-nama', href: '#o-nama', label: t(content.nav.oNama) },
    { id: 'usluge', href: '#usluge', label: t(content.nav.usluge) },
    { id: 'proces', href: '#proces', label: t(content.nav.proces) },
    { id: 'kontakt', href: '#kontakt', label: t(content.nav.kontakt) },
  ]

  const KATEGORIJA_OPTIONS = [
    ...content.services.items.map((s) => t(s.title)),
    lang === 'hr' ? 'Drugo' : 'Other',
  ]

  return (
    <>
      <a href="#top" className="skip-link">
        {lang === 'hr' ? 'Preskoči na sadržaj' : 'Skip to content'}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <a
            href="#top"
            className="brand"
            onClick={(e) => scrollToSection(e, 'top')}
          >
            <span className="brand-mark">KD</span>
            <span className="brand-text">
              <span className="brand-name">K-Drive</span>
              <span className="brand-tagline">Autoservis</span>
            </span>
          </a>
          <nav
            className="main-nav"
            aria-label={lang === 'hr' ? 'Glavna navigacija' : 'Main navigation'}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.id)}
              >
                {link.label}
              </a>
            ))}
            {/* Privremeno isključeno - vidi komentar niže
            <LiveStatus schedule={content.schedule} className="header-live-status" />
            */}
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="icon-toggle"
              onClick={toggleLang}
              aria-label={lang === 'hr' ? 'Switch to English' : 'Prebaci na hrvatski'}
              title={lang === 'hr' ? 'Switch to English' : 'Prebaci na hrvatski'}
            >
              {lang === 'hr' ? 'HR' : 'EN'}
            </button>
            <button
              type="button"
              className="icon-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? lang === 'hr'
                    ? 'Uključi tamni način rada'
                    : 'Switch to dark mode'
                  : lang === 'hr'
                    ? 'Uključi svijetli način rada'
                    : 'Switch to light mode'
              }
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} className="icon" />
            </button>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              aria-label={
                mobileNavOpen
                  ? lang === 'hr'
                    ? 'Zatvori izbornik'
                    : 'Close menu'
                  : lang === 'hr'
                    ? 'Otvori izbornik'
                    : 'Open menu'
              }
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              <Icon name={mobileNavOpen ? 'close' : 'menu'} className="icon" />
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label={
              lang === 'hr' ? 'Mobilna navigacija' : 'Mobile navigation'
            }
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.id)}
              >
                {link.label}
              </a>
            ))}
            <a className="mobile-nav-phone" href={content.contact.phoneHref}>
              <Icon name="phone" />
              {content.contact.phone}
            </a>
            {/* Privremeno isključeno dok radno vrijeme ne bude pouzdano potvrđeno
            <LiveStatus schedule={content.schedule} className="mobile-nav-live-status" />
            */}
          </nav>
        )}
        <div className="hazard-strip" aria-hidden="true" />
      </header>

      <main id="top">
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow">
                <Icon name="wheel" />
                {t(content.hero.eyebrow)}
              </span>
              <h1>{t(content.hero.title)}</h1>
              <p className="lead">{t(content.hero.lead)}</p>
              <div className="hero-actions">
                <a
                  className="btn btn-primary btn-lg"
                  href="#kontakt"
                  onClick={(e) => scrollToSection(e, 'kontakt')}
                >
                  {t(content.hero.ctaPrimary)}
                </a>
                <a
                  className="btn btn-outline btn-lg"
                  href={content.contact.phoneHref}
                >
                  <Icon name="phone" />
                  {t(content.hero.ctaSecondary)} {content.contact.phone}
                </a>
              </div>
              <div className="hero-quick-info">
                <span>
                  <Icon name="pin" />
                  {content.contact.address}
                </span>
                <span>
                  <Icon name="clock" />
                  {t(content.contact.hours)}
                </span>
              </div>
              <div className="hero-stats">
                {content.hero.stats.map((stat) => (
                  <div key={stat.id}>
                    <div className="hero-stat-top">
                      <Icon name={stat.icon} className="icon hero-stat-icon" />
                      <strong>{stat.value}</strong>
                    </div>
                    <span>{t(stat.label)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-photo">
                <img
                  src={content.hero.image}
                  alt={t(content.hero.title)}
                />
              </div>
              {content.hero.chips.map((chip, index) => (
                <div className={`chip chip-${index + 1}`} key={chip.id}>
                  <Icon name={chip.icon} />
                  {t(chip.label)}
                </div>
              ))}
            </div>
          </div>
          <div className="container">
            <form className="vehicle-filter" onSubmit={handleHeroFilterSubmit}>
              <span className="vehicle-filter-label">
                <Icon name="search" />
                {lang === 'hr' ? 'Pronađite ponudu za svoje vozilo' : 'Find the offer for your vehicle'}
              </span>
              <div className="vehicle-filter-grid">
                <select
                  aria-label={lang === 'hr' ? 'Marka' : 'Make'}
                  value={heroFilter.marka}
                  onChange={(e) =>
                    setHeroFilter((prev) => ({ ...prev, marka: e.target.value }))
                  }
                >
                  <option value="">{lang === 'hr' ? 'Marka' : 'Make'}</option>
                  {content.brands.items.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={lang === 'hr' ? 'Model' : 'Model'}
                  aria-label={lang === 'hr' ? 'Model' : 'Model'}
                  value={heroFilter.model}
                  onChange={(e) =>
                    setHeroFilter((prev) => ({ ...prev, model: e.target.value }))
                  }
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={lang === 'hr' ? 'Godište' : 'Year'}
                  aria-label={lang === 'hr' ? 'Godište' : 'Year'}
                  value={heroFilter.godiste}
                  onChange={(e) =>
                    setHeroFilter((prev) => ({ ...prev, godiste: e.target.value }))
                  }
                />
                <select
                  aria-label={lang === 'hr' ? 'Kategorija usluge' : 'Service category'}
                  value={heroFilter.kategorija}
                  onChange={(e) =>
                    setHeroFilter((prev) => ({ ...prev, kategorija: e.target.value }))
                  }
                >
                  <option value="">
                    {lang === 'hr' ? 'Kategorija usluge' : 'Service category'}
                  </option>
                  {KATEGORIJA_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">
                  {lang === 'hr' ? 'Pretraži' : 'Search'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="brands-strip">
          <div className="container">
            <p className="brands-label">{t(content.brands.label)}</p>
            <div className="brands-row">
              {content.brands.items.map((brand) => (
                <span key={brand}>{brand}</span>
              ))}
            </div>
          </div>
          <div className="angled-divider" aria-hidden="true" />
        </section>

        <section className="reviews-strip">
          <div className="container reviews-inner">
            <div className="reviews-stars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon name="star" key={i} />
              ))}
            </div>
            {content.reviews.rating && (
              <strong className="reviews-rating">
                {content.reviews.rating}
                {content.reviews.count
                  ? ` · ${content.reviews.count} ${lang === 'hr' ? 'recenzija' : 'reviews'}`
                  : ''}
              </strong>
            )}
            <a
              className="reviews-link"
              href={content.reviews.url}
              target="_blank"
              rel="noreferrer"
            >
              {lang === 'hr'
                ? 'Pogledajte naše recenzije na Google mapama'
                : 'See our reviews on Google Maps'}
            </a>
          </div>
        </section>

        <section className="section" id="o-nama">
          <div className="container about-inner">
            <Reveal className="about-media">
              <img src={content.about.image} alt={t(content.about.title)} />
              <div className="about-badge">
                <strong>{t(content.about.badgeValue)}</strong>
                <span>{t(content.about.badgeLabel)}</span>
              </div>
            </Reveal>
            <div className="about-content">
              <Reveal className="about-text">
                <span className="eyebrow">{t(content.about.eyebrow)}</span>
                <h2>{t(content.about.title)}</h2>
                {content.about.paragraphs.map((p, i) => (
                  <p key={i}>{t(p)}</p>
                ))}
              </Reveal>
              <div className="highlight-list">
                {content.highlights.map((item, index) => (
                  <Reveal
                    className="highlight-card"
                    key={item.id}
                    delay={index * 80}
                  >
                    <Icon
                      name={item.icon as IconName}
                      className="card-watermark"
                    />
                    <div className="highlight-icon">
                      <Icon name={item.icon as IconName} />
                    </div>
                    <div>
                      <h3>{t(item.title)}</h3>
                      <p>{t(item.desc)}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section services" id="usluge">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">{t(content.services.eyebrow)}</span>
              <h2>{t(content.services.title)}</h2>
              <p>{t(content.services.lead)}</p>
            </Reveal>
            <div className="services-grid">
              {content.services.items.map((service, index) => (
                <Reveal
                  id={`service-${service.id}`}
                  className={`service-card${highlightedService === service.id ? ' is-highlighted' : ''}`}
                  key={service.id}
                  delay={(index % 4) * 70}
                >
                  <Icon name={service.icon} className="card-watermark" />
                  <div className="service-icon">
                    <Icon name={service.icon} />
                  </div>
                  <h3>{t(service.title)}</h3>
                  <p>{t(service.desc)}</p>
                  <button
                    type="button"
                    className="service-cta"
                    onClick={() => requestServiceQuote(t(service.title))}
                  >
                    {lang === 'hr' ? 'Upit za ovu uslugu' : 'Ask about this service'}
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="angled-divider" aria-hidden="true" />
        </section>

        <section className="section tuning-section" id="tuning">
          <div className="container">
            <Reveal>
              <TuningCalculator
                eyebrow={content.tuning.eyebrow}
                title={content.tuning.title}
                lead={content.tuning.lead}
                disclaimer={content.tuning.disclaimer}
                models={content.tuning.models}
                onRequestQuote={requestTuningQuote}
              />
            </Reveal>
          </div>
        </section>

        <section className="section values-strip">
          <div className="container">
            <div className="values-grid">
              {content.values.map((value) => (
                <Reveal className="value-item" key={value.id}>
                  <div className="value-icon">
                    <Icon name={value.icon} />
                  </div>
                  <h3>{t(value.title)}</h3>
                  <p>{t(value.desc)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="proces">
          <WrenchMotif className="proces-bg-decor" />
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">{t(content.process.eyebrow)}</span>
              <h2>{t(content.process.title)}</h2>
              <p>{t(content.process.lead)}</p>
            </Reveal>
            <div className="process-grid">
              {content.process.steps.map((step, index) => (
                <Reveal
                  className="process-step"
                  key={step.id}
                  delay={index * 100}
                >
                  <div className="process-media">
                    <img src={step.image} alt={t(step.title)} />
                    <div className="process-number">{index + 1}</div>
                  </div>
                  <div className="process-body">
                    <h3>{t(step.title)}</h3>
                    <p>{t(step.desc)}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section before-after-section">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">{t(content.beforeAfter.eyebrow)}</span>
              <h2>{t(content.beforeAfter.title)}</h2>
              <p>{t(content.beforeAfter.lead)}</p>
            </Reveal>
            <Reveal>
              <BeforeAfterSlider
                beforeImage={content.beforeAfter.beforeImage}
                afterImage={content.beforeAfter.afterImage}
                beforeLabel={t(content.beforeAfter.beforeLabel)}
                afterLabel={t(content.beforeAfter.afterLabel)}
              />
            </Reveal>
          </div>
        </section>

        <section
          className="cta-banner"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(5,6,10,0.94), rgba(20,22,28,0.9)), url(${content.cta.image})`,
          }}
        >
          <div className="container cta-inner">
            <Reveal>
              <h2>{t(content.cta.title)}</h2>
              <p>{t(content.cta.lead)}</p>
            </Reveal>
            <Reveal className="cta-actions" delay={100}>
              <a className="btn btn-primary btn-lg" href={content.contact.phoneHref}>
                <Icon name="phone" />
                {content.contact.phone}
              </a>
              <a
                className="btn btn-ghost-light btn-lg"
                href="#kontakt"
                onClick={(e) => scrollToSection(e, 'kontakt')}
              >
                {t(content.nav.kontakt)}
              </a>
            </Reveal>
          </div>
        </section>

        <section className="section" id="kontakt">
          <div className="container">
            <Reveal className="section-head">
              <span className="eyebrow">{t(content.nav.kontakt)}</span>
              <h2>
                {lang === 'hr' ? 'Posjetite nas ili nazovite' : 'Visit us or give us a call'}
              </h2>
              <p>
                {lang === 'hr'
                  ? 'Rado ćemo odgovoriti na sva pitanja i dogovoriti termin.'
                  : "We're happy to answer any questions and arrange a time."}
              </p>
            </Reveal>
            <div className="contact-inner">
              <Reveal className="contact-card">
                <div className="contact-row">
                  <div className="highlight-icon">
                    <Icon name="pin" />
                  </div>
                  <div>
                    <h3>{lang === 'hr' ? 'Adresa' : 'Address'}</h3>
                    <p>{content.contact.address}</p>
                  </div>
                </div>
                <div className="contact-row">
                  <div className="highlight-icon">
                    <Icon name="phone" />
                  </div>
                  <div>
                    <h3>{lang === 'hr' ? 'Telefon' : 'Phone'}</h3>
                    <a href={content.contact.phoneHref}>
                      {content.contact.phone}
                    </a>
                  </div>
                </div>
                <div className="contact-row">
                  <div className="highlight-icon">
                    <Icon name="clock" />
                  </div>
                  <div>
                    <h3>{lang === 'hr' ? 'Radno vrijeme' : 'Opening hours'}</h3>
                    <p>{t(content.contact.hours)}</p>
                  </div>
                </div>
                <a className="btn btn-primary" href={content.contact.phoneHref}>
                  {lang === 'hr' ? 'Zakaži termin' : 'Book an appointment'}
                </a>
              </Reveal>

              <Reveal className="contact-form-card" delay={100}>
                <h3>
                  {lang === 'hr' ? 'Naruči vozilo na servis' : 'Book your vehicle for service'}
                </h3>
                <p className="form-intro">
                  {lang === 'hr'
                    ? 'Ispunite obrazac i javit ćemo vam se za potvrdu termina.'
                    : "Fill out the form and we'll contact you to confirm the appointment."}
                </p>
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="name">
                        {lang === 'hr' ? 'Ime i prezime' : 'Full name'}
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder={lang === 'hr' ? 'Ivan Ivić' : 'John Smith'}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="phone">
                        {lang === 'hr' ? 'Broj telefona' : 'Phone number'}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="091 234 5678"
                      />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="vehicle">
                        {lang === 'hr'
                          ? 'Registracija / Marka i model vozila'
                          : 'Plate / Vehicle make and model'}
                      </label>
                      <input
                        id="vehicle"
                        type="text"
                        required
                        value={form.vehicle}
                        onChange={(e) => updateField('vehicle', e.target.value)}
                        placeholder={lang === 'hr' ? 'npr. ZG 1234-AB / VW Golf 7' : 'e.g. VW Golf 7'}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="preferredDate">
                        {lang === 'hr' ? 'Željeni datum' : 'Preferred date'}
                      </label>
                      <input
                        id="preferredDate"
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => updateField('preferredDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <span className="form-field-label-standalone">
                      {lang === 'hr' ? 'Odaberite uslugu/e' : 'Select service(s)'}
                    </span>
                    <div className="checkbox-grid">
                      {SERVICE_CHECKBOXES.map((option) => (
                        <label className="checkbox-item" key={option.id}>
                          <input
                            type="checkbox"
                            checked={form.services.includes(option.id)}
                            onChange={() => toggleFormService(option.id)}
                          />
                          {option.label[lang]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="note">
                      {lang === 'hr' ? 'Napomena (opcionalno)' : 'Note (optional)'}
                    </label>
                    <textarea
                      id="note"
                      value={form.note}
                      onChange={(e) => updateField('note', e.target.value)}
                      placeholder={
                        lang === 'hr'
                          ? 'Opišite kvar ili dodatne detalje...'
                          : 'Describe the issue or any extra details...'
                      }
                    />
                  </div>
                  <div className="hp-field" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => updateField('website', e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={status === 'sending'}
                  >
                    {status === 'sending'
                      ? lang === 'hr'
                        ? 'Slanje...'
                        : 'Sending...'
                      : lang === 'hr'
                        ? 'Pošalji upit'
                        : 'Send inquiry'}
                  </button>
                  {status === 'success' && (
                    <p className="form-note">
                      {lang === 'hr'
                        ? 'Hvala! Vaš upit je poslan, javit ćemo vam se u najkraćem roku.'
                        : 'Thank you! Your inquiry has been sent, we will get back to you shortly.'}
                    </p>
                  )}
                  {status === 'error' && (
                    <p className="form-note form-note-error">
                      {lang === 'hr' ? 'Greška: ' : 'Error: '}
                      {submitError}
                    </p>
                  )}
                </form>
              </Reveal>
            </div>

            <Reveal className="contact-map" delay={150}>
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(content.contact.mapQuery)}&output=embed`}
                title="K-Drive Autoservis location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
            <div className="map-actions">
              <a
                className="btn btn-outline"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(content.contact.mapQuery)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="pin" />
                {lang === 'hr' ? 'Otvori u Google mapama' : 'Open in Google Maps'}
              </a>
              <a
                className="btn btn-outline"
                href={`https://waze.com/ul?q=${encodeURIComponent(content.contact.mapQuery)}&navigate=yes`}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="pin" />
                {lang === 'hr' ? 'Otvori u Wazeu' : 'Open in Waze'}
              </a>
            </div>
          </div>
        </section>
      </main>

      <a
        className="sticky-call-bar"
        href={content.contact.phoneHref}
        aria-label={lang === 'hr' ? 'Nazovi nas' : 'Call us'}
      >
        <Icon name="phone" />
        {lang === 'hr' ? 'Nazovi' : 'Call'} {content.contact.phone}
      </a>

      <div className="hazard-strip" aria-hidden="true" />
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <a
              href="#top"
              className="brand"
              onClick={(e) => scrollToSection(e, 'top')}
            >
              <span className="brand-mark">KD</span>
              <span className="brand-text">
                <span className="brand-name">K-Drive</span>
                <span className="brand-tagline">Autoservis</span>
              </span>
            </a>
            <p>{t(content.footer.desc)}</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h3>{lang === 'hr' ? 'Navigacija' : 'Navigation'}</h3>
              <ul>
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.href}
                      onClick={(e) => scrollToSection(e, link.id)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-col">
              <h3>{lang === 'hr' ? 'Kontakt' : 'Contact'}</h3>
              <ul>
                <li>
                  <a href={content.contact.phoneHref}>
                    {content.contact.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(content.contact.mapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content.contact.address}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} K-Drive Autoservis.{' '}
            {lang === 'hr' ? 'Sva prava pridržana.' : 'All rights reserved.'}
          </span>
          <span>{lang === 'hr' ? 'Dugo Selo, Hrvatska' : 'Dugo Selo, Croatia'}</span>
        </div>
      </footer>
    </>
  )
}

export default App
