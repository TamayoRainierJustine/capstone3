import nodemailer from 'nodemailer';

export function createTransport() {
  // Trim to avoid trailing spaces/newlines from env UI
  const host = (process.env.SMTP_HOST || '').trim();
  const port = parseInt((process.env.SMTP_PORT || '587').toString().trim(), 10);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (!host || !user || !pass) {
    throw new Error('SMTP credentials are not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)');
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    // Force IPv4 to avoid some provider IPv6/DNS issues (EBADNAME)
    family: 4,
    requireTLS: port === 587,
    tls: {
      // Let providers with valid certs pass; if you use a custom SMTP with self-signed,
      // flip this to true at your own risk.
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    // Be explicit about timeouts to avoid hanging on serverless
    socketTimeout: 20000,
    connectionTimeout: 15000,
    greetingTimeout: 10000
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[mail] Transport configured: host=${host}, port=${port}, secure=${port === 465}`);
  }

  return transport;
}

export async function sendEmail({ to, subject, html, text }) {
  const from = (process.env.EMAIL_FROM || 'no-reply@structura.app').trim();
  const transporter = createTransport();
  try {
    // Quick capability check (non-blocking when SMTP is healthy)
    try {
      await transporter.verify();
      if (process.env.NODE_ENV !== 'production') {
        console.log('[mail] SMTP verified successfully');
      }
    } catch (verifyErr) {
      console.warn('[mail] SMTP verify failed (continuing to send):', verifyErr?.message || verifyErr);
    }

    const info = await transporter.sendMail({ from, to, subject, html, text });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[mail] Message sent:', info?.messageId, 'response:', info?.response);
    }
    return info;
  } catch (err) {
    console.error('[mail] sendMail error:', err?.message || err);
    // Re-throw so callers can surface a helpful error
    throw err;
  }
}


