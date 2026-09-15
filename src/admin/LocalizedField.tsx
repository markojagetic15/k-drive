import type { Localized } from '../content/types'

export default function LocalizedField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: Localized
  onChange: (next: Localized) => void
  multiline?: boolean
}) {
  return (
    <div className="localized-field">
      <span className="field-label">{label}</span>
      <div className="localized-field-row">
        <div className="localized-field-col">
          <span className="lang-badge">HR</span>
          {multiline ? (
            <textarea
              value={value.hr}
              onChange={(e) => onChange({ ...value, hr: e.target.value })}
            />
          ) : (
            <input
              value={value.hr}
              onChange={(e) => onChange({ ...value, hr: e.target.value })}
            />
          )}
        </div>
        <div className="localized-field-col">
          <span className="lang-badge">EN</span>
          {multiline ? (
            <textarea
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          ) : (
            <input
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
