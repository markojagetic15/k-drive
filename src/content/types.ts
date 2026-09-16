export type Lang = 'hr' | 'en'

export type Localized = {
  hr: string
  en: string
}

export type IconName =
  | 'wheel'
  | 'wrench'
  | 'bolt'
  | 'snow'
  | 'clipboard'
  | 'search'
  | 'gauge'
  | 'filter'
  | 'team'
  | 'tag'
  | 'settings'
  | 'phone'
  | 'pin'
  | 'clock'
  | 'sun'
  | 'moon'
  | 'motor'
  | 'target'
  | 'key'
  | 'menu'
  | 'close'
  | 'star'
  | 'arrowUp'
  | 'eye'
  | 'eyeOff'

export type ServiceItem = {
  id: string
  icon: IconName
  title: Localized
  desc: Localized
}

export type HighlightItem = {
  id: string
  icon: IconName
  title: Localized
  desc: Localized
}

export type ProcessStep = {
  id: string
  title: Localized
  desc: Localized
  image: string
}

export type StatItem = {
  id: string
  icon: IconName
  value: string
  label: Localized
}

export type ChipItem = {
  id: string
  icon: IconName
  label: Localized
}

export type TuningModel = {
  id: string
  name: string
  baseHp: number
  baseNm: number
  stage1Hp: number
  stage1Nm: number
  stage2Hp: number
  stage2Nm: number
}

export type SiteContent = {
  contact: {
    phone: string
    phoneHref: string
    address: string
    hours: Localized
    mapQuery: string
    email: string
  }
  nav: {
    usluge: Localized
    oNama: Localized
    proces: Localized
    kontakt: Localized
  }
  hero: {
    eyebrow: Localized
    title: Localized
    lead: Localized
    ctaPrimary: Localized
    ctaSecondary: Localized
    stats: StatItem[]
    chips: ChipItem[]
    image: string
  }
  brands: {
    label: Localized
    items: string[]
  }
  reviews: {
    rating: string
    count: string
    url: string
  }
  schedule: {
    days: number[]
    open: string
    close: string
  }
  tuning: {
    eyebrow: Localized
    title: Localized
    lead: Localized
    disclaimer: Localized
    models: TuningModel[]
  }
  beforeAfter: {
    eyebrow: Localized
    title: Localized
    lead: Localized
    beforeLabel: Localized
    afterLabel: Localized
    beforeImage: string
    afterImage: string
  }
  about: {
    eyebrow: Localized
    title: Localized
    paragraphs: Localized[]
    image: string
    badgeValue: Localized
    badgeLabel: Localized
  }
  highlights: HighlightItem[]
  services: {
    eyebrow: Localized
    title: Localized
    lead: Localized
    items: ServiceItem[]
  }
  process: {
    eyebrow: Localized
    title: Localized
    lead: Localized
    steps: ProcessStep[]
  }
  cta: {
    title: Localized
    lead: Localized
    image: string
  }
  footer: {
    desc: Localized
  }
}
