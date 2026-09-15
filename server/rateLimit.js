// Small in-memory per-IP rate limiter. Good enough for a single-process,
// small-business-scale app; resets on restart and isn't shared across
// multiple instances, which is an acceptable tradeoff at this scale.
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map()

  return function isRateLimited(key) {
    const now = Date.now()
    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs)
    timestamps.push(now)
    hits.set(key, timestamps)
    return timestamps.length > max
  }
}
