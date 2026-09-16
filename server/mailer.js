import nodemailer from 'nodemailer'

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
  contact,
  vehicle,
  year,
  service,
  preferredDate,
  message,
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

  const subject = `Novi upit s web stranice${service ? ` - ${service}` : ''}`
  const text = [
    `Ime i prezime: ${name}`,
    `Kontakt: ${contact}`,
    vehicle ? `Vozilo: ${vehicle}${year ? ` (${year})` : ''}` : null,
    service ? `Usluga: ${service}` : null,
    preferredDate ? `Željeni termin: ${preferredDate}` : null,
    '',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n')

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    replyTo: contact.includes('@') ? contact : undefined,
    subject,
    text,
  })
}
