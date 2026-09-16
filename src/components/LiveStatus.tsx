import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

type Schedule = {
  days: number[]
  open: string
  close: string
}

function isOpenNow(schedule: Schedule, now: Date) {
  const day = now.getDay()
  if (!schedule.days.includes(day)) return false

  const [openH, openM] = schedule.open.split(':').map(Number)
  const [closeH, closeM] = schedule.close.split(':').map(Number)
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const minutesOpen = openH * 60 + openM
  const minutesClose = closeH * 60 + closeM

  return minutesNow >= minutesOpen && minutesNow < minutesClose
}

export function LiveStatus({
  schedule,
  className,
}: {
  schedule: Schedule
  className?: string
}) {
  const { lang } = useLanguage()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const open = isOpenNow(schedule, now)

  return (
    <span className={`live-status${open ? ' is-open' : ' is-closed'}${className ? ` ${className}` : ''}`}>
      <span className="live-status-dot" aria-hidden="true" />
      {open
        ? lang === 'hr'
          ? 'RADIONICA OTVORENA'
          : 'WORKSHOP OPEN'
        : lang === 'hr'
          ? 'ZATVORENO'
          : 'CLOSED'}
    </span>
  )
}
