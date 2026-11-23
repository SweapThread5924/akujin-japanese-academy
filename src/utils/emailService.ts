import nodemailer from 'nodemailer';

export const DEFAULT_SUPPORT_EMAIL = 'kumaranshul6467@gmail.com';
export const GMAIL_SMTP_PORT = 465;

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface EmailDispatchResult {
  delivered: boolean;
  provider: 'gmail-smtp';
  messageId?: string;
  code?: 'SMTP_NOT_CONFIGURED' | 'SMTP_SEND_FAILED';
  reason?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: true;
  user: string;
  pass: string;
  from: string;
  contactReceiverEmail: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Strips CR/LF characters to prevent SMTP header injection in subjects or addresses.
 */
export function sanitizeHeaderValue(value: string): string {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Reads Gmail SMTP configuration strictly from server-side environment variables.
 * Never uses placeholder credentials. Always enforces SSL/TLS (secure: true).
 */
export function getGmailSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim() || '';
  const portRaw = env.SMTP_PORT?.trim() || String(GMAIL_SMTP_PORT);
  const parsedPort = Number(portRaw);
  const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : GMAIL_SMTP_PORT;
  const user = env.SMTP_USER?.trim() || '';
  const pass = env.SMTP_PASS?.trim() || '';
  const from = env.SMTP_FROM?.trim() || '';
  const contactReceiverEmail = env.CONTACT_RECEIVER_EMAIL?.trim() || '';

  if (!host || !user || !pass || !from || !contactReceiverEmail) {
    return null;
  }

  return {
    host,
    port,
    secure: true,
    user,
    pass,
    from: sanitizeHeaderValue(from),
    contactReceiverEmail: sanitizeHeaderValue(contactReceiverEmail),
  };
}

/**
 * Basic spam check: rejects submissions if the hidden honeypot field is filled
 * or if the message contains an excessive number of URLs.
 */
export function isLikelySpamSubmission(params: {
  honeypot?: string;
  message?: string;
}): { isSpam: boolean; reason?: string } {
  if (params.honeypot && String(params.honeypot).trim().length > 0) {
    return { isSpam: true, reason: 'honeypot_filled' };
  }
  const messageText = String(params.message ?? '');
  const urlMatches = messageText.match(/https?:\/\/\S+/gi) ?? [];
  if (urlMatches.length >= 4) {
    return { isSpam: true, reason: 'excessive_links' };
  }
  return { isSpam: false };
}

/**
 * Sliding-window in-memory rate limiter keyed by client IP address.
 */
export function createSlidingWindowRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const buckets = new Map<string, number[]>();

  return {
    check(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
      const normalizedKey = key || 'unknown';
      const cutoff = now - options.windowMs;
      const existing = (buckets.get(normalizedKey) ?? []).filter((ts) => ts > cutoff);

      if (existing.length >= options.maxRequests) {
        const oldest = existing[0] ?? now;
        const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
        buckets.set(normalizedKey, existing);
        return { allowed: false, retryAfterSec };
      }

      existing.push(now);
      buckets.set(normalizedKey, existing);

      // Periodic cleanup to keep memory bounded
      if (buckets.size > 1000) {
        for (const [k, timestamps] of buckets.entries()) {
          const fresh = timestamps.filter((ts) => ts > cutoff);
          if (fresh.length === 0) buckets.delete(k);
          else buckets.set(k, fresh);
        }
      }

      return { allowed: true, retryAfterSec: 0 };
    },
    reset() {
      buckets.clear();
    },
  };
}

export const NEWSLETTER_CONFIRMATION_MESSAGE =
  'Thank you for subscribing to AkuJin! We are excited to support your Japanese learning journey. Please reach out to us via the Contact section if you have any questions.';

export function buildNewsletterWelcomeEmail(
  recipientEmail: string,
  replyToEmail?: string
): OutgoingEmail {
  const supportEmail = sanitizeHeaderValue(
    replyToEmail || process.env.CONTACT_RECEIVER_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL
  );
  const subject = 'Welcome to AkuJin! Subscription Confirmed';
  const text = [
    NEWSLETTER_CONFIRMATION_MESSAGE,
    '',
    'What you can expect from AkuJin Weekly:',
    '- Weekly JLPT N5–N1 study notes, grammar breakdowns, and Kanji cheat sheets',
    '- Practice tips for all 2,136 Joyo Kanji SRS cards and real-life Japan scenarios',
    '- Study in Japan scholarship and university guidance updates',
    '',
    `Questions or study doubts? Reply to this email or contact us at ${supportEmail}.`,
    '',
    'Warm regards,',
    'The AkuJin Team',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background-color:#FCFBF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#141413;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
    <div style="background:#D92525;padding:24px 28px;color:#ffffff;">
      <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">AkuJin Japanese Academy</div>
      <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Welcome to AkuJin!</h1>
    </div>
    <div style="padding:28px;line-height:1.65;font-size:15px;color:#292524;">
      <p style="margin-top:0;font-size:16px;color:#141413;"><strong>${escapeHtml(NEWSLETTER_CONFIRMATION_MESSAGE)}</strong></p>
      <div style="margin:20px 0;padding:16px 18px;background:#FDF5F3;border-left:4px solid #D92525;border-radius:8px;font-size:14px;">
        <strong>What's included in your subscription:</strong>
        <ul style="margin:8px 0 0;padding-left:18px;">
          <li>Weekly JLPT N5–N1 study notes &amp; grammar guides</li>
          <li>2,136 Jōyō Kanji SRS &amp; stroke-practice tips</li>
          <li>Japan scholarship &amp; university updates</li>
        </ul>
      </div>
      <p style="font-size:14px;color:#57534e;">Need help anytime? Visit the <strong>Contact</strong> section on AkuJin or write to <a href="mailto:${escapeHtml(supportEmail)}" style="color:#D92525;font-weight:600;">${escapeHtml(supportEmail)}</a>.</p>
      <p style="margin-bottom:0;">Warm regards,<br/><strong>The AkuJin Team</strong></p>
    </div>
  </div>
</body>
</html>`;

  return {
    to: sanitizeHeaderValue(recipientEmail),
    subject: sanitizeHeaderValue(subject),
    text,
    html,
    replyTo: supportEmail,
  };
}

export function buildContactNotificationEmail(params: {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  receivedAt: string;
  receiverEmail?: string;
}): OutgoingEmail {
  const receiver = sanitizeHeaderValue(
    params.receiverEmail || process.env.CONTACT_RECEIVER_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL
  );
  const safeName = sanitizeHeaderValue(params.name);
  const safeVisitorEmail = sanitizeHeaderValue(params.email);
  const subject = sanitizeHeaderValue(`[AkuJin Support] New Query from ${safeName}`);

  const text = [
    `New Contact & Student Support Inquiry (${params.id})`,
    `Received At: ${params.receivedAt}`,
    `Name: ${safeName}`,
    `Email: ${safeVisitorEmail}`,
    `Mobile: ${params.mobile}`,
    '',
    'Message:',
    params.message,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:20px;background:#FCFBF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#141413;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:24px;">
    <h2 style="margin:0 0 12px;color:#D92525;font-size:18px;">New AkuJin Contact &amp; Student Support Query</h2>
    <p style="margin:4px 0;font-size:14px;"><strong>Name:</strong> ${escapeHtml(safeName)}</p>
    <p style="margin:4px 0;font-size:14px;"><strong>Email:</strong> ${escapeHtml(safeVisitorEmail)}</p>
    <p style="margin:4px 0;font-size:14px;"><strong>Mobile:</strong> ${escapeHtml(params.mobile)}</p>
    <p style="margin:4px 0;font-size:12px;color:#78716c;"><strong>Ticket ID:</strong> ${escapeHtml(params.id)} · ${escapeHtml(params.receivedAt)}</p>
    <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0;" />
    <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(params.message)}</p>
  </div>
</body>
</html>`;

  return {
    to: receiver,
    subject,
    text,
    html,
    // Always set visitor's submitted email as Reply-To, never as From
    replyTo: safeVisitorEmail,
  };
}

export function buildContactConfirmationEmail(params: {
  id: string;
  name: string;
  email: string;
  message: string;
}): OutgoingEmail {
  const supportEmail = sanitizeHeaderValue(
    process.env.CONTACT_RECEIVER_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL
  );
  const safeName = sanitizeHeaderValue(params.name);
  const subject = 'We received your query — AkuJin Student Support';
  const text = [
    `Hi ${safeName},`,
    '',
    'Thank you for reaching out to AkuJin Contact & Student Support!',
    `We have received your inquiry (Ref: ${params.id}) and our team will gladly get back to you within 24 business hours.`,
    '',
    'Your message:',
    params.message,
    '',
    `If you need to add anything, simply reply to this email or write to ${supportEmail}.`,
    '',
    'Warm regards,',
    'AkuJin Student Support',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:20px;background:#FCFBF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#141413;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:14px;padding:24px;">
    <h2 style="margin:0 0 12px;color:#D92525;font-size:18px;">Thank you for contacting AkuJin!</h2>
    <p style="font-size:14px;line-height:1.6;">Hi ${escapeHtml(safeName)},</p>
    <p style="font-size:14px;line-height:1.6;">We have received your message (Ref: <strong>${escapeHtml(params.id)}</strong>) and we will be glad to help you within 24 business hours.</p>
    <blockquote style="margin:16px 0;padding:12px 16px;background:#fafaf9;border-left:3px solid #D92525;font-size:13px;white-space:pre-wrap;">${escapeHtml(params.message)}</blockquote>
    <p style="font-size:13px;color:#57534e;">Direct Support Email: <a href="mailto:${escapeHtml(supportEmail)}" style="color:#D92525;">${escapeHtml(supportEmail)}</a></p>
  </div>
</body>
</html>`;

  return {
    to: sanitizeHeaderValue(params.email),
    subject,
    text,
    html,
    replyTo: supportEmail,
  };
}

/**
 * Dispatches an email exclusively through Gmail SMTP (SSL/TLS on port 465, secure: true)
 * using Nodemailer and server-side environment variables.
 */
export async function dispatchEmail(
  email: OutgoingEmail,
  options?: {
    env?: NodeJS.ProcessEnv;
    createTransport?: typeof nodemailer.createTransport;
  }
): Promise<EmailDispatchResult> {
  const config = getGmailSmtpConfig(options?.env ?? process.env);
  if (!config) {
    return {
      delivered: false,
      provider: 'gmail-smtp',
      code: 'SMTP_NOT_CONFIGURED',
      reason: 'Gmail SMTP environment variables are not configured on the server.',
    };
  }

  try {
    const createTransport = options?.createTransport ?? nodemailer.createTransport;
    const transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: true, // SSL/TLS on port 465
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const info = await transporter.sendMail({
      from: config.from,
      to: sanitizeHeaderValue(email.to),
      subject: sanitizeHeaderValue(email.subject),
      text: email.text,
      html: email.html,
      ...(email.replyTo ? { replyTo: sanitizeHeaderValue(email.replyTo) } : {}),
    });

    return {
      delivered: true,
      provider: 'gmail-smtp',
      messageId: info.messageId,
    };
  } catch (err) {
    console.error('Gmail SMTP send failed:', err instanceof Error ? err.message : err);
    return {
      delivered: false,
      provider: 'gmail-smtp',
      code: 'SMTP_SEND_FAILED',
      reason: 'Unable to deliver email via Gmail SMTP right now.',
    };
  }
}
