const ANCHOR_WINDOW_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// The anchor price is the lowest price that was active at any point during
// the 30 days before a price change - not just the lowest ever recorded
// price. Each history entry is active from its own effectiveFrom until the
// next entry's effectiveFrom (or until now, for the most recent one).
export function computeAnchorPrice(history, asOfDateStr) {
  if (!history || history.length === 0) return undefined

  const asOf = new Date(asOfDateStr)
  const windowStart = new Date(asOf.getTime() - ANCHOR_WINDOW_DAYS * DAY_MS)

  let lowest
  for (let i = 0; i < history.length; i++) {
    const activeFrom = new Date(history[i].effectiveFrom)
    const activeTo = i + 1 < history.length ? new Date(history[i + 1].effectiveFrom) : asOf
    const intersectsWindow = activeFrom < asOf && activeTo > windowStart
    if (intersectsWindow && (lowest === undefined || history[i].price < lowest)) {
      lowest = history[i].price
    }
  }
  return lowest
}

// Server-authoritative price bookkeeping: whatever the client sends for
// anchorPrice/priceHistory is ignored - these are always derived here so
// the legally-required anchor price can't be edited or reset by a caller.
export function applyPriceChanges(oldItems, newItems, todayStr) {
  const oldById = new Map((oldItems ?? []).map((item) => [item.id, item]))

  return (newItems ?? []).map((item) => {
    const old = oldById.get(item.id)
    const oldPrice = old?.price ?? undefined

    if (item.price == null) {
      const { anchorPrice: _anchorPrice, ...rest } = item
      return old?.priceHistory ? { ...rest, priceHistory: old.priceHistory } : rest
    }

    if (item.price === oldPrice) {
      return { ...item, anchorPrice: old?.anchorPrice, priceHistory: old?.priceHistory }
    }

    const history = old?.priceHistory ? [...old.priceHistory] : []
    const anchorPrice = computeAnchorPrice(history, todayStr) ?? oldPrice ?? item.price
    history.push({ price: item.price, effectiveFrom: todayStr })

    return { ...item, anchorPrice, priceHistory: history }
  })
}
