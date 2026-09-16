import { useState } from 'react'

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
}: {
  beforeImage: string
  afterImage: string
  beforeLabel: string
  afterLabel: string
}) {
  const [position, setPosition] = useState(50)
  const safePosition = Math.max(position, 1)

  return (
    <div className="before-after-frame">
      <img className="before-after-img" src={afterImage} alt={afterLabel} draggable={false} />
      <div className="before-after-clip" style={{ width: `${position}%` }}>
        <img
          className="before-after-img"
          src={beforeImage}
          alt={beforeLabel}
          draggable={false}
          style={{ width: `${10000 / safePosition}%` }}
        />
      </div>
      <span className="before-after-tag before-after-tag-before">{beforeLabel}</span>
      <span className="before-after-tag before-after-tag-after">{afterLabel}</span>
      <div className="before-after-handle" style={{ left: `${position}%` }}>
        <span className="before-after-handle-grip">
          <span />
          <span />
        </span>
      </div>
      <input
        className="before-after-range"
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Prije / Poslije"
      />
    </div>
  )
}
