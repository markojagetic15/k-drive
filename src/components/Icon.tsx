import type { ReactNode } from 'react'
import type { IconName } from '../content/types'

const ICON_PATHS: Record<IconName, ReactNode> = {
  wheel: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 3.5v6M12 14.5v6M20.5 12h-6M9.5 12h-6M17.8 6.2l-4.2 4.2M10.4 13.6l-4.2 4.2M17.8 17.8l-4.2-4.2M10.4 10.4L6.2 6.2" />
    </>
  ),
  wrench: (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 4.8L4 16.4V20h3.6l5.3-5.3a4 4 0 0 0 4.8-5.4l-2.7 2.7-2-2 2.7-2.7Z" />
  ),
  bolt: <path d="M13 3 5 13.5h5.2L11 21l8-11h-5.2L13 3Z" />,
  snow: (
    <>
      <path d="M12 2.5v19M4.5 7l15 10M19.5 7l-15 10" />
      <path d="M12 2.5 9.8 4.7M12 2.5l2.2 2.2M12 21.5l-2.2-2.2M12 21.5l2.2-2.2" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9 4.5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8v.7" />
      <path d="m8.5 12.5 2.2 2.2 4.8-4.8" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18 15.5 12" />
      <path d="M12 18h.01" />
    </>
  ),
  filter: <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />,
  team: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3 2.7-4.8 5.5-4.8s4.9 1.8 5.5 4.8" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.8 14.3c2.3.3 3.9 1.9 4.4 4.2" />
    </>
  ),
  tag: (
    <>
      <path d="M11.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v5.5c0 .4.2.8.4 1.1l8 8a1.5 1.5 0 0 0 2.1 0l5.5-5.5a1.5 1.5 0 0 0 0-2.1l-8-8a1.5 1.5 0 0 0-1-.5Z" />
      <circle cx="9" cy="9" r="1.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="6.8" />
      <circle cx="12" cy="12" r="2.7" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(45 12 12)" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(90 12 12)" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(135 12 12)" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(180 12 12)" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(225 12 12)" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(270 12 12)" />
      <rect x="10.8" y="1.3" width="2.4" height="3.2" rx="1" transform="rotate(315 12 12)" />
    </>
  ),
  phone: (
    <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2 9 9 0 0 0 2.8.45 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A16 16 0 0 1 3 5a1 1 0 0 1 1-1h3.35a1 1 0 0 1 1 1 9 9 0 0 0 .45 2.8 1 1 0 0 1-.25 1l-2.2 2.2Z" />
  ),
  pin: (
    <>
      <path d="M12 21s-6.8-6.1-6.8-11.2A6.8 6.8 0 0 1 12 3a6.8 6.8 0 0 1 6.8 6.8C18.8 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.6" r="2.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M4.3 4.3l1.8 1.8M17.9 17.9l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.3 19.7l1.8-1.8M17.9 6.1l1.8-1.8" />
    </>
  ),
  moon: (
    <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.8 6.8 0 0 0 9.5 9.5Z" />
  ),
  motor: (
    <>
      <rect x="4" y="11" width="16" height="8" rx="1.5" />
      <path d="M7 11V7.5h4V11M13 11V8.5h3V11" />
      <path d="M20 14h1.5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H20" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="16.5" r="3.5" />
      <path d="M10 14 19 5M16 8l2 2M19 5l2 2" />
    </>
  ),
  menu: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  star: (
    <path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9l-5.6 3.2 1.4-6.3-4.8-4.3 6.4-.6L12 3Z" />
  ),
  arrowUp: <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.4 13.4 0 0 1-3.1 3.9M7.4 7.4C4.8 9 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9.6 9.6 0 0 0 3.1-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
}

// eslint-disable-next-line react-refresh/only-export-components -- small data export alongside the Icon component; only affects fast-refresh granularity in dev.
export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[]

export function Icon({
  name,
  className,
}: {
  name: IconName
  className?: string
}) {
  return (
    <svg
      className={className ?? 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  )
}
