import { Router } from 'express'
import { getContent } from '../db.js'

const router = Router()

function pricedItems(content) {
  return (content.services?.items ?? []).filter((item) => item.price != null)
}

function note(item) {
  if (item.anchorPrice != null && item.price < item.anchorPrice) return 'sniženje'
  return ''
}

function escapeCsvField(value) {
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function toCsv(items) {
  const header = 'naziv,cijena,sidrena_cijena,napomena'
  const rows = items.map((item) =>
    [item.title.hr, item.price.toFixed(2), (item.anchorPrice ?? item.price).toFixed(2), note(item)]
      .map(escapeCsvField)
      .join(','),
  )
  return [header, ...rows].join('\n') + '\n'
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function toXml(items) {
  const stavke = items
    .map(
      (item) => `  <stavka>
    <naziv>${escapeXml(item.title.hr)}</naziv>
    <cijena>${item.price.toFixed(2)}</cijena>
    <sidrena_cijena>${(item.anchorPrice ?? item.price).toFixed(2)}</sidrena_cijena>
    <napomena>${escapeXml(note(item))}</napomena>
  </stavka>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<cjenik>\n${stavke}\n</cjenik>\n`
}

router.get('/price-feed.csv', async (req, res) => {
  const items = pricedItems(await getContent())
  res.type('text/csv; charset=utf-8').send(toCsv(items))
})

router.get('/price-feed.xml', async (req, res) => {
  const items = pricedItems(await getContent())
  res.type('application/xml; charset=utf-8').send(toXml(items))
})

export default router
