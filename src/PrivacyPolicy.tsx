import { Link } from 'react-router-dom'
import './App.css'
import { Icon } from './components/Icon'
import { useContent } from './context/ContentContext'
import { useLanguage } from './context/LanguageContext'
import { useTheme } from './context/ThemeContext'

function PrivacyPolicy() {
  const { content, loading, error } = useContent()
  const { lang, toggleLang } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  if (loading) {
    return (
      <div className="page-status">
        <div className="spinner" aria-hidden="true" />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="page-status">
        <p>
          {lang === 'hr'
            ? 'Sadržaj se trenutno ne može učitati.'
            : 'Content could not be loaded.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <img className="brand-mark" src="/brand-mark-boxed.png" alt="K-Drive" />
            <span className="brand-text">
              <span className="brand-name">K-Drive</span>
              <span className="brand-tagline">Autoservis</span>
            </span>
          </Link>
          <div className="header-actions">
            <button
              type="button"
              className="icon-toggle"
              onClick={toggleLang}
              aria-label={lang === 'hr' ? 'Switch to English' : 'Prebaci na hrvatski'}
            >
              {lang === 'hr' ? 'HR' : 'EN'}
            </button>
            <button
              type="button"
              className="icon-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} className="icon" />
            </button>
          </div>
        </div>
        <div className="hazard-strip" aria-hidden="true" />
      </header>

      <main className="section legal-page">
        <div className="container legal-container">
          <Link to="/" className="legal-back">
            {lang === 'hr' ? '← Natrag na početnu' : '← Back to home'}
          </Link>

          {lang === 'hr' ? (
            <>
              <h1>Politika privatnosti</h1>
              <p className="legal-updated">Zadnje ažurirano: 16.9.2026.</p>

              <h2>Tko smo mi</h2>
              <p>
                K-Drive Autoservis, {content.contact.address}. Kontakt: {content.contact.phone},{' '}
                {content.contact.email}.
              </p>

              <h2>Koje podatke prikupljamo</h2>
              <p>
                Kada ispunite obrazac za narudžbu servisa na ovoj stranici, prikupljamo: ime i
                prezime, broj telefona, podatke o vozilu (registracija, marka i model), željeni
                datum termina, odabrane usluge i eventualnu napomenu koju unesete.
              </p>

              <h2>Zašto prikupljamo te podatke</h2>
              <p>
                Isključivo kako bismo vas kontaktirali radi dogovora oko termina i pružanja
                usluge koju ste zatražili. Ne koristimo vaše podatke u marketinške svrhe.
              </p>

              <h2>Kome prosljeđujemo podatke</h2>
              <p>
                Vaš upit šaljemo putem servisa za slanje e-pošte isključivo radi dostave upita na
                naš poslovni e-mail. Ne dijelimo vaše podatke s trećim stranama u marketinške ili
                druge svrhe.
              </p>

              <h2>Koliko dugo čuvamo podatke</h2>
              <p>
                Podatke iz upita čuvamo onoliko dugo koliko je potrebno za obradu vašeg zahtjeva
                i eventualnu naknadnu komunikaciju, a najdulje 12 mjeseci, osim ako zakonska
                obveza ne zahtijeva dulje čuvanje.
              </p>

              <h2>Kolačići (cookies)</h2>
              <p>
                Ova stranica trenutno ne koristi kolačiće za analitiku ni oglašavanje.
              </p>

              <h2>Vaša prava</h2>
              <p>
                Imate pravo zatražiti pristup, ispravak ili brisanje svojih osobnih podataka, kao
                i uložiti prigovor Agenciji za zaštitu osobnih podataka (AZOP). Za sve zahtjeve
                obratite nam se na kontakte navedene iznad.
              </p>

              <h2>Izmjene ove politike</h2>
              <p>
                Zadržavamo pravo izmjene ove politike privatnosti. Sve izmjene bit će objavljene
                na ovoj stranici.
              </p>
            </>
          ) : (
            <>
              <h1>Privacy Policy</h1>
              <p className="legal-updated">Last updated: Sep 16, 2026</p>

              <h2>Who we are</h2>
              <p>
                K-Drive Autoservis, {content.contact.address}. Contact: {content.contact.phone},{' '}
                {content.contact.email}.
              </p>

              <h2>What data we collect</h2>
              <p>
                When you submit the service booking form on this site, we collect: your full
                name, phone number, vehicle details (plate, make and model), preferred
                appointment date, selected services and any note you enter.
              </p>

              <h2>Why we collect it</h2>
              <p>
                Solely to contact you to arrange an appointment and provide the service you
                requested. We do not use your data for marketing purposes.
              </p>

              <h2>Who we share it with</h2>
              <p>
                We send your inquiry through an email delivery service solely to deliver it to
                our business inbox. We do not share your data with third parties for marketing
                or other purposes.
              </p>

              <h2>How long we keep it</h2>
              <p>
                We keep inquiry data for as long as needed to process your request and any
                follow-up communication, for a maximum of 12 months, unless a legal obligation
                requires longer retention.
              </p>

              <h2>Cookies</h2>
              <p>This site does not currently use cookies for analytics or advertising.</p>

              <h2>Your rights</h2>
              <p>
                You have the right to request access to, correction of, or deletion of your
                personal data, and to file a complaint with the Croatian Data Protection Agency
                (AZOP). For any requests, contact us using the details above.
              </p>

              <h2>Changes to this policy</h2>
              <p>
                We reserve the right to change this privacy policy. Any changes will be posted
                on this page.
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} K-Drive Autoservis.{' '}
            {lang === 'hr' ? 'Sva prava pridržana.' : 'All rights reserved.'}
          </span>
          <Link to="/">{lang === 'hr' ? 'Natrag na početnu' : 'Back to home'}</Link>
        </div>
      </footer>
    </>
  )
}

export default PrivacyPolicy
