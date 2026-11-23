import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProgressReportEmailDraft,
  buildRawRfc2822Email,
  decodeUtf8Base64Url,
  encodeRfc2047Subject,
  encodeUtf8Base64Url,
  formatGmailSenderName,
  parseGmailMessage,
} from './gmailClient.ts';
import { summarizeReadingSpeed } from './readingSpeed.ts';

test('UTF-8 Base64URL encode and decode round-trips Japanese text cleanly', () => {
  const original = '日本語の読解スピード：毎分180文字！';
  const encoded = encodeUtf8Base64Url(original);
  assert.equal(/[+/=]/.test(encoded), false);
  assert.equal(decodeUtf8Base64Url(encoded), original);
});

test('encodeRfc2047Subject encodes non-ASCII subjects cleanly and preserves ASCII', () => {
  assert.equal(encodeRfc2047Subject('JLPT N5 Study Notes'), 'JLPT N5 Study Notes');
  const jp = encodeRfc2047Subject('日本語 JLPT 試験');
  assert.ok(jp.startsWith('=?UTF-8?B?'));
  assert.ok(jp.endsWith('?='));
});

test('buildRawRfc2822Email creates valid Base64URL MIME message with headers and UTF-8 body', () => {
  const raw = buildRawRfc2822Email({
    to: 'kumaranshul6467@gmail.com',
    subject: 'AkuJin 質問',
    body: 'て形とない形の使い分けを教えてください。',
    inReplyTo: '<msg-1@mail.gmail.com>',
  });
  const decoded = decodeUtf8Base64Url(raw);
  assert.ok(decoded.includes('To: kumaranshul6467@gmail.com\r\n'));
  assert.ok(decoded.includes('Subject: =?UTF-8?B?'));
  assert.ok(decoded.includes('In-Reply-To: <msg-1@mail.gmail.com>\r\n'));
  assert.ok(decoded.includes('Content-Type: text/plain; charset="UTF-8"'));
});

test('parseGmailMessage extracts headers, multipart plain text body, and flags', () => {
  const rawMsg = {
    id: 'm-123',
    threadId: 't-456',
    labelIds: ['INBOX', 'UNREAD', 'STARRED'],
    snippet: 'Short preview...',
    payload: {
      mimeType: 'multipart/alternative',
      headers: [
        { name: 'Subject', value: 'JLPT N4 Feedback' },
        { name: 'From', value: '"Sensei Desk" <kumaranshul6467@gmail.com>' },
        { name: 'To', value: 'learner@example.com' },
        { name: 'Date', value: 'Mon, 23 Nov 2026 10:00:00 +0900' },
      ],
      parts: [
        {
          mimeType: 'text/plain',
          body: {
            data: encodeUtf8Base64Url('こんにちは！Great job on your reading speed!'),
          },
        },
      ],
    },
  };

  const parsed = parseGmailMessage(rawMsg);
  assert.equal(parsed.isUnread, true);
  assert.equal(parsed.isStarred, true);
  assert.equal(parsed.fromName, 'Sensei Desk');
  assert.equal(parsed.fromEmail, 'kumaranshul6467@gmail.com');
  assert.equal(parsed.subject, 'JLPT N4 Feedback');
  assert.ok(parsed.textBody.includes('Great job on your reading speed!'));
  assert.deepEqual(formatGmailSenderName('plain@example.com'), {
    name: 'plain@example.com',
    email: 'plain@example.com',
  });
});

test('buildProgressReportEmailDraft formats JLPT metrics and Reading CPM cleanly', () => {
  const readingSummary = summarizeReadingSpeed([
    {
      id: 'rs-1',
      passageId: 'n5-r1',
      passageTitle: 'Saturday Routine',
      level: 'N5',
      charCount: 150,
      elapsedSeconds: 50,
      cpm: 180,
      comprehensionCorrect: true,
      recordedAt: '2026-11-23T08:00:00Z',
    },
  ]);

  const draft = buildProgressReportEmailDraft({
    recipientEmail: 'learner@example.com',
    learnerName: 'Aarav',
    targetLevel: 'N5',
    xp: 420,
    streak: 5,
    kanjiLearnedCount: 18,
    masteredItemsCount: 24,
    readingSummary,
  });

  assert.equal(draft.to, 'learner@example.com');
  assert.ok(draft.subject.includes('JLPT N5'));
  assert.ok(draft.body.includes('Avg 180 CPM'));
  assert.ok(draft.body.includes('420 XP'));
});
