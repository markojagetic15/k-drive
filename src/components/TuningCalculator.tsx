import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import type { Localized, TuningModel } from '../content/types'

type Stage = 'base' | 'stage1' | 'stage2'

function useAnimatedNumber(target: number, durationMs = 500) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, durationMs])

  return value
}

function statsFor(model: TuningModel, stage: Stage) {
  if (stage === 'stage2') return { hp: model.stage2Hp, nm: model.stage2Nm }
  if (stage === 'stage1') return { hp: model.stage1Hp, nm: model.stage1Nm }
  return { hp: model.baseHp, nm: model.baseNm }
}

export function TuningCalculator({
  eyebrow,
  title,
  lead,
  disclaimer,
  models,
  onRequestQuote,
}: {
  eyebrow: Localized
  title: Localized
  lead: Localized
  disclaimer: Localized
  models: TuningModel[]
  onRequestQuote: (modelName: string, stageLabel: string) => void
}) {
  const { t, lang } = useLanguage()
  const [modelId, setModelId] = useState(models[0]?.id)
  const [stage, setStage] = useState<Stage>('stage1')

  const model = models.find((m) => m.id === modelId) ?? models[0]
  const stats = model ? statsFor(model, stage) : { hp: 0, nm: 0 }
  const baseStats = model ? statsFor(model, 'base') : { hp: 0, nm: 0 }
  const hp = useAnimatedNumber(stats.hp)
  const nm = useAnimatedNumber(stats.nm)
  const hpGain = stats.hp - baseStats.hp
  const nmGain = stats.nm - baseStats.nm

  const stageLabels: Record<Stage, string> = {
    base: lang === 'hr' ? 'Serijski' : 'Stock',
    stage1: 'Stage 1',
    stage2: 'Stage 2',
  }

  if (!model) return null

  return (
    <div className="tuning-card">
      <span className="eyebrow">{t(eyebrow)}</span>
      <h2>{t(title)}</h2>
      <p className="tuning-lead">{t(lead)}</p>

      <div className="tuning-model-select">
        <label htmlFor="tuning-model">
          {lang === 'hr' ? 'Model vozila' : 'Vehicle model'}
        </label>
        <select
          id="tuning-model"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tuning-stage-tabs" role="tablist">
        {(['base', 'stage1', 'stage2'] as Stage[]).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={stage === s}
            className={`tuning-stage-tab${stage === s ? ' active' : ''}`}
            onClick={() => setStage(s)}
          >
            {stageLabels[s]}
          </button>
        ))}
      </div>

      <div className="tuning-readout">
        <div className="tuning-metric">
          <span className="tuning-metric-value">{hp}</span>
          <span className="tuning-metric-unit">KS</span>
          {hpGain > 0 && <span className="tuning-metric-gain">+{hpGain} KS</span>}
        </div>
        <div className="tuning-metric">
          <span className="tuning-metric-value">{nm}</span>
          <span className="tuning-metric-unit">Nm</span>
          {nmGain > 0 && <span className="tuning-metric-gain">+{nmGain} Nm</span>}
        </div>
      </div>

      <p className="tuning-disclaimer">{t(disclaimer)}</p>

      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={() => onRequestQuote(model.name, stageLabels[stage])}
      >
        {lang === 'hr' ? 'Zatraži ponudu za ovo vozilo' : 'Request a quote for this vehicle'}
      </button>
    </div>
  )
}
