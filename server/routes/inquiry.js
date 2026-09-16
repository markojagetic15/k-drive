import { Router } from 'express'
import { getContent } from '../db.js'
import { sendInquiryEmail } from '../mailer.js'
import { createRateLimiter } from '../rateLimit.js'

const isRateLimited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 })

const router = Router()

router.post('/', async (req, res) => {
  const { name, phone, vehicle, preferredDate, services, note, website } = req.body ?? {}

  // Honeypot field: hidden from real visitors via CSS, bots that fill in
  // every input trip it. Respond as if it succeeded so bots don't learn.
  if (website) {
    return res.json({ ok: true })
  }

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof phone !== 'string' ||
    !phone.trim() ||
    typeof vehicle !== 'string' ||
    !vehicle.trim()
  ) {
    return res
      .status(400)
      .json({ error: 'Ime, telefon i vozilo su obavezni.' })
  }

  if (isRateLimited(req.ip)) {
    return res
      .status(429)
      .json({ error: 'Previše upita u kratkom vremenu. Pokušajte kasnije.' })
  }

  try {
    const content = await getContent()
    await sendInquiryEmail({
      to: content.contact.email,
      name: name.trim(),
      phone: phone.trim(),
      vehicle: vehicle.trim(),
      preferredDate: typeof preferredDate === 'string' ? preferredDate.trim() : '',
      services: Array.isArray(services) ? services.filter((s) => typeof s === 'string') : [],
      note: typeof note === 'string' ? note.trim() : '',
    })
    res.json({ ok: true })
  } catch (err) {
    // Log the real reason (SMTP misconfigured, auth failure, network issue...)
    // for whoever runs the server, but never expose backend internals to the
    // public visitor submitting the form.
    console.error('[inquiry] Failed to send email:', err.message)
    res.status(500).json({
      error:
        'Trenutno ne možemo poslati vašu poruku. Nazovite nas izravno ili pokušajte kasnije.',
    })
  }
})

export default router
