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

export async function sendInquiryEmail({ to, name, contact, service, message }) {
  const transporter = getTransporter()
  if (!transporter) {
    throw new Error(
      'Slanje emaila nije podešeno na serveru (nedostaju SMTP_HOST/SMTP_USER/SMTP_PASS u .env).',
    )
  }

  const subject = `Novi upit s web stranice${service ? ` - ${service}` : ''}`
  const text = [
    `Ime i prezime: ${name}`,
    `Kontakt: ${contact}`,
    service ? `Usluga: ${service}` : null,
    '',
    message,
  ]
    .filter((line) => line !== null)
    .join('\n')

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    replyTo: contact.includes('@') ? contact : undefined,
    subject,
    text,
  })
}
