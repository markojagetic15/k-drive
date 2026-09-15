import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Lang, Localized } from '../content/types'

type LanguageContextValue = {
  lang: Lang
  toggleLang: () => void
  t: (value: Localized) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const STORAGE_KEY = 'k-drive-lang'

function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'hr' || stored === 'en') return stored
  return 'hr'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang)

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  function toggleLang() {
    setLang((prev) => (prev === 'hr' ? 'en' : 'hr'))
  }

  function t(value: Localized) {
    return value[lang]
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating the hook keeps Provider + consumer in one place; only affects fast-refresh granularity in dev.
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
