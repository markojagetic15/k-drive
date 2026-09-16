import nodemailer from 'nodemailer'

// Kept in sync with SERVICE_CHECKBOXES in src/App.tsx - the form sends
// stable ids so the checkbox state doesn't break if the visitor switches
// site language mid-fill; the email itself is always read by the (Croatian)
// shop owner, so we label the ids in Croatian here.
const SERVICE_LABELS = {
  'mali-servis': 'Mali servis',
  'veliki-servis': 'Veliki servis',
  dijagnostika: 'Dijagnostika',
  tuning: 'Tuning',
  kocnice: 'Kočnice',
  drugo: 'Drugo',
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

export async function sendInquiryEmail({
  to,
  name,
  phone,
  vehicle,
  preferredDate,
  services,
  note,
}) {
  const transporter = getTransporter()
  if (!transporter) {
    throw new Error(
      'Slanje emaila nije podešeno na serveru (nedostaju SMTP_HOST/SMTP_USER/SMTP_PASS u .env).',
    )
  }
  if (!process.env.MAIL_FROM) {
    // Providers like Resend authenticate with a fixed username ("resend")
    // that isn't a valid sender address, so silently falling back to
    // SMTP_USER here would produce a broken "From" header.
    throw new Error('MAIL_FROM nije postavljen u .env (potrebna je verificirana adresa/domena).')
  }

  const serviceLabels = (services ?? []).map((id) => SERVICE_LABELS[id] ?? id)
  const subject = `Nova narudžba servisa - ${vehicle}`
  const text = [
    `Ime i prezime: ${name}`,
    `Telefon: ${phone}`,
    `Vozilo: ${vehicle}`,
    preferredDate ? `Željeni datum: ${preferredDate}` : null,
    serviceLabels.length ? `Usluge: ${serviceLabels.join(', ')}` : null,
    note ? '' : null,
    note || null,
  ]
    .filter((line) => line !== null)
    .join('\n')

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
  })
}
