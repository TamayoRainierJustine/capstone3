import nodemailer from 'nodemailer';

// Send via Resend (HTTPS) if RESEND_API_KEY is set, else use SMTP.
// HTTPS avoids outbound SMTP port blocking on some hosts.

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
    // Increased timeouts for Railway/cloud environments
    socketTimeout: 30000, // 30 seconds
    connectionTimeout: 25000, // 25 seconds
    greetingTimeout: 15000, // 15 seconds
    // Additional options for better reliability
    pool: false,
    maxConnections: 1,
    maxMessages: 1
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[mail] Transport configured: host=${host}, port=${port}, secure=${port === 465}`);
  }

  return transport;
}

export async function sendEmail({ to, subject, html, text }) {
  const from = (process.env.EMAIL_FROM || 'no-reply@structura.app').trim();

  // Prefer HTTPS provider if configured
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text
        })
      });
      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        throw new Error(`Resend API error: ${response.status} ${response.statusText} ${bodyText}`);
      }
      const data = await response.json();
      if (process.env.NODE_ENV !== 'production') {
        console.log('[mail] Resend sent:', data?.id);
      }
      return { messageId: data?.id, provider: 'resend' };
    } catch (err) {
      console.error('[mail] Resend send error:', err?.message || err);
      // If HTTPS provider fails, fall through to SMTP as a backup
    }
  }

  const transporter = createTransport();
  try {
    // Skip verify() in production to avoid timeout issues - just try sending directly
    // Verify can be slow on some networks (Railway, etc.)
    if (process.env.NODE_ENV !== 'production') {
      try {
        await transporter.verify();
        console.log('[mail] SMTP verified successfully');
      } catch (verifyErr) {
        console.warn('[mail] SMTP verify failed (continuing to send):', verifyErr?.message || verifyErr);
      }
    }

    console.log(`[mail] Attempting to send email to ${to} via SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || '587'})`);
    const info = await transporter.sendMail({ from, to, subject, html, text });
    console.log('[mail] ✅ Email sent successfully:', info?.messageId || 'no messageId', 'response:', info?.response || 'no response');
    return info;
  } catch (err) {
    console.error('[mail] ❌ sendMail error:', err?.message || err);
    console.error('[mail] Error details:', {
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode
    });
    // Re-throw so callers can surface a helpful error
    throw err;
  }
}


