import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SUPPORT_EMAIL,
  GMAIL_SMTP_PORT,
  NEWSLETTER_CONFIRMATION_MESSAGE,
  buildNewsletterWelcomeEmail,
  buildContactNotificationEmail,
  buildContactConfirmationEmail,
  createSlidingWindowRateLimiter,
  dispatchEmail,
  getGmailSmtpConfig,
  isLikelySpamSubmission,
  sanitizeHeaderValue,
} from './emailService';

test('getGmailSmtpConfig requires all 6 Gmail SMTP env vars and enforces secure: true on port 465', () => {
  assert.equal(getGmailSmtpConfig({}), null);

  const cfg = getGmailSmtpConfig({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    SMTP_USER: 'kumaranshul6467@gmail.com',
    SMTP_PASS: 'app-password-value',
    SMTP_FROM: 'AkuJin Support <kumaranshul6467@gmail.com>',
    CONTACT_RECEIVER_EMAIL: 'kumaranshul6467@gmail.com',
  });
  assert.ok(cfg);
  assert.equal(cfg.host, 'smtp.gmail.com');
  assert.equal(cfg.port, GMAIL_SMTP_PORT);
  assert.equal(cfg.secure, true);
  assert.equal(cfg.from, 'AkuJin Support <kumaranshul6467@gmail.com>');
  assert.equal(cfg.contactReceiverEmail, 'kumaranshul6467@gmail.com');
});

test('sanitizeHeaderValue strips CRLF characters to prevent SMTP header injection', () => {
  assert.equal(
    sanitizeHeaderValue('Alice\r\nBcc: attacker@evil.com'),
    'Alice Bcc: attacker@evil.com'
  );
});

test('buildContactNotificationEmail sends to CONTACT_RECEIVER_EMAIL and sets visitor email as replyTo', () => {
  const email = buildContactNotificationEmail({
    id: 'contact-123',
    name: 'Riya Patel',
    email: 'riya@example.com',
    mobile: '+91 9876543210',
    message: 'Need help with JLPT N4 grammar.',
    receivedAt: '2026-11-20T09:00:00Z',
    receiverEmail: 'kumaranshul6467@gmail.com',
  });
  assert.equal(email.to, 'kumaranshul6467@gmail.com');
  assert.equal(email.replyTo, 'riya@example.com');
  assert.match(email.subject, /Riya Patel/);
  assert.match(email.text, /JLPT N4 grammar/);
});

test('buildNewsletterWelcomeEmail includes the exact requested confirmation message in text and html', () => {
  const welcome = buildNewsletterWelcomeEmail('learner@example.com', 'kumaranshul6467@gmail.com');
  assert.equal(welcome.to, 'learner@example.com');
  assert.equal(welcome.replyTo, DEFAULT_SUPPORT_EMAIL);
  assert.match(welcome.subject, /Welcome to AkuJin/i);
  assert.ok(
    welcome.text.includes(NEWSLETTER_CONFIRMATION_MESSAGE),
    'Plain text newsletter confirmation email must include exact requested confirmation message'
  );
  assert.ok(
    welcome.html.includes(NEWSLETTER_CONFIRMATION_MESSAGE),
    'HTML newsletter confirmation email must include exact requested confirmation message'
  );

  const confirm = buildContactConfirmationEmail({
    id: 'contact-456',
    name: 'Kenji',
    email: 'kenji@example.com',
    message: 'How do I apply for MEXT?',
  });
  assert.equal(confirm.to, 'kenji@example.com');
  assert.match(confirm.text, /contact-456/);
});

test('isLikelySpamSubmission catches honeypot fields and excessive links', () => {
  assert.equal(isLikelySpamSubmission({ honeypot: '', message: 'Hello, I have a question.' }).isSpam, false);
  assert.equal(isLikelySpamSubmission({ honeypot: 'http://bot-site.com', message: 'Hi' }).isSpam, true);
  assert.equal(
    isLikelySpamSubmission({
      honeypot: '',
      message: 'Check https://a.com https://b.com https://c.com https://d.com now!',
    }).isSpam,
    true
  );
});

test('createSlidingWindowRateLimiter blocks requests exceeding maxRequests in window and resets afterward', () => {
  const limiter = createSlidingWindowRateLimiter({ windowMs: 60_000, maxRequests: 2 });
  assert.equal(limiter.check('1.2.3.4', 1000).allowed, true);
  assert.equal(limiter.check('1.2.3.4', 2000).allowed, true);
  const blocked = limiter.check('1.2.3.4', 3000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  // After window expires, requests are allowed again
  assert.equal(limiter.check('1.2.3.4', 65_000).allowed, true);
});

test('dispatchEmail returns SMTP_NOT_CONFIGURED cleanly when Gmail SMTP env vars are absent', async () => {
  const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'CONTACT_RECEIVER_EMAIL'] as const;
  const saved: Record<string, string | undefined> = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  try {
    const msg = buildNewsletterWelcomeEmail('test@example.com');
    const result = await dispatchEmail(msg);
    assert.equal(result.delivered, false);
    assert.equal(result.provider, 'gmail-smtp');
    assert.equal(result.code, 'SMTP_NOT_CONFIGURED');
  } finally {
    for (const k of keys) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
    }
  }
});

test('dispatchEmail sends newsletter confirmation via SSL/TLS port 465 using configured SMTP credentials', async () => {
  let capturedTransportConfig: Record<string, unknown> | undefined;
  let capturedMailOptions: Record<string, unknown> | undefined;

  const fakeCreateTransport = ((config: Record<string, unknown>) => {
    capturedTransportConfig = config;
    return {
      async sendMail(mailOptions: Record<string, unknown>) {
        capturedMailOptions = mailOptions;
        return { messageId: '<newsletter-1@akujin.test>' };
      },
    };
  }) as unknown as NonNullable<Parameters<typeof dispatchEmail>[1]>['createTransport'];

  const welcome = buildNewsletterWelcomeEmail('subscriber@example.com', 'kumaranshul6467@gmail.com');
  const result = await dispatchEmail(welcome, {
    env: {
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '465',
      SMTP_USER: 'kumaranshul6467@gmail.com',
      SMTP_PASS: 'test-app-pass',
      SMTP_FROM: 'AkuJin Academy <kumaranshul6467@gmail.com>',
      CONTACT_RECEIVER_EMAIL: 'kumaranshul6467@gmail.com',
    },
    createTransport: fakeCreateTransport,
  });

  assert.equal(result.delivered, true);
  assert.equal(result.provider, 'gmail-smtp');
  assert.equal(result.messageId, '<newsletter-1@akujin.test>');
  assert.deepEqual(capturedTransportConfig, {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: 'kumaranshul6467@gmail.com', pass: 'test-app-pass' },
  });
  assert.equal(capturedMailOptions?.from, 'AkuJin Academy <kumaranshul6467@gmail.com>');
  assert.equal(capturedMailOptions?.to, 'subscriber@example.com');
  assert.equal(capturedMailOptions?.replyTo, 'kumaranshul6467@gmail.com');
  assert.ok(String(capturedMailOptions?.text).includes(NEWSLETTER_CONFIRMATION_MESSAGE));
});
