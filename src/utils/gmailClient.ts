import type { ReadingSpeedSummary } from './readingSpeed';
import type { JlptLevel } from './srsEngine';

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
}

export interface RawGmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
}

export interface ParsedGmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  isUnread: boolean;
  isStarred: boolean;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  date: string;
  messageIdHeader: string;
  snippet: string;
  textBody: string;
}

export interface GmailLabelInfo {
  id: string;
  name: string;
  type?: 'system' | 'user' | string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface ComposeGmailInput {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  threadId?: string;
  inReplyTo?: string;
}

export class GmailApiError extends Error {
  status: number;
  isAuthError: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GmailApiError';
    this.status = status;
    this.isAuthError = status === 401 || status === 403;
  }
}

export function encodeUtf8Base64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeUtf8Base64Url(base64Url: string): string {
  if (!base64Url) return '';
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function encodeRfc2047Subject(subject: string): string {
  const clean = subject.replace(/[\r\n]+/g, ' ').trim();
  // Encode with UTF-8 Base64 header encoding when non-ASCII (e.g. Japanese) is present
  if (/[^\x20-\x7E]/.test(clean)) {
    const bytes = new TextEncoder().encode(clean);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 =
      typeof btoa === 'function'
        ? btoa(binary)
        : Buffer.from(bytes).toString('base64');
    return `=?UTF-8?B?${base64}?=`;
  }
  return clean;
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function buildRawRfc2822Email(input: ComposeGmailInput): string {
  const headers: string[] = [
    `To: ${sanitizeHeaderValue(input.to)}`,
  ];
  if (input.cc && input.cc.trim()) {
    headers.push(`Cc: ${sanitizeHeaderValue(input.cc)}`);
  }
  headers.push(`Subject: ${encodeRfc2047Subject(input.subject || '(No Subject)')}`);
  if (input.inReplyTo && input.inReplyTo.trim()) {
    const ref = sanitizeHeaderValue(input.inReplyTo);
    headers.push(`In-Reply-To: ${ref}`);
    headers.push(`References: ${ref}`);
  }
  headers.push('MIME-Version: 1.0');
  headers.push('Content-Type: text/plain; charset="UTF-8"');
  headers.push('Content-Transfer-Encoding: base64');

  const bodyBytes = new TextEncoder().encode(input.body || '');
  let binary = '';
  for (let i = 0; i < bodyBytes.length; i++) {
    binary += String.fromCharCode(bodyBytes[i]);
  }
  const bodyBase64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bodyBytes).toString('base64');

  const rfc2822 = `${headers.join('\r\n')}\r\n\r\n${bodyBase64}`;
  return encodeUtf8Base64Url(rfc2822);
}

export function extractHeader(
  headers: GmailHeader[] | undefined,
  name: string
): string {
  if (!Array.isArray(headers)) return '';
  const target = name.toLowerCase();
  return headers.find((h) => h.name?.toLowerCase() === target)?.value ?? '';
}

export function formatGmailSenderName(fromHeader: string): {
  name: string;
  email: string;
} {
  const trimmed = (fromHeader || '').trim();
  if (!trimmed) return { name: 'Unknown Sender', email: '' };
  const match = trimmed.match(/^(?:"?([^"]*?)"?\s*)?<([^>]+)>$/);
  if (match) {
    const email = match[2].trim();
    const name = (match[1] || '').trim() || email;
    return { name, email };
  }
  return { name: trimmed, email: trimmed };
}

function stripHtmlTagsToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractReadableBody(payload?: GmailMessagePart): string {
  if (!payload) return '';
  const plainChunks: string[] = [];
  const htmlChunks: string[] = [];

  const visit = (part: GmailMessagePart) => {
    const mime = (part.mimeType || '').toLowerCase();
    if (part.body?.data) {
      const decoded = decodeUtf8Base64Url(part.body.data);
      if (mime.includes('text/plain')) {
        plainChunks.push(decoded);
      } else if (mime.includes('text/html')) {
        htmlChunks.push(decoded);
      } else if (!part.parts || part.parts.length === 0) {
        plainChunks.push(decoded);
      }
    }
    if (Array.isArray(part.parts)) {
      for (const child of part.parts) {
        visit(child);
      }
    }
  };

  visit(payload);
  if (plainChunks.length > 0) return plainChunks.join('\n').trim();
  if (htmlChunks.length > 0) return stripHtmlTagsToText(htmlChunks.join('\n'));
  return '';
}

export function parseGmailMessage(raw: RawGmailMessage): ParsedGmailMessage {
  const headers = raw.payload?.headers;
  const from = extractHeader(headers, 'From');
  const parsedFrom = formatGmailSenderName(from);
  const labelIds = Array.isArray(raw.labelIds) ? raw.labelIds : [];
  const textBody = extractReadableBody(raw.payload) || raw.snippet || '';

  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds,
    isUnread: labelIds.includes('UNREAD'),
    isStarred: labelIds.includes('STARRED'),
    subject: extractHeader(headers, 'Subject') || '(No Subject)',
    from,
    fromName: parsedFrom.name,
    fromEmail: parsedFrom.email,
    to: extractHeader(headers, 'To'),
    date: extractHeader(headers, 'Date'),
    messageIdHeader: extractHeader(headers, 'Message-ID'),
    snippet: raw.snippet || '',
    textBody,
  };
}

export function buildProgressReportEmailDraft(params: {
  recipientEmail: string;
  learnerName: string;
  targetLevel: JlptLevel;
  xp: number;
  streak: number;
  kanjiLearnedCount: number;
  masteredItemsCount: number;
  readingSummary: ReadingSpeedSummary;
}): ComposeGmailInput {
  const {
    recipientEmail,
    learnerName,
    targetLevel,
    xp,
    streak,
    kanjiLearnedCount,
    masteredItemsCount,
    readingSummary,
  } = params;

  const readingLines =
    readingSummary.totalPassagesTimed > 0
      ? [
          `Reading Speed (CPM): Avg ${readingSummary.averageCpm} CPM · Best ${readingSummary.bestCpm} CPM (${readingSummary.totalPassagesTimed} timed passages)`,
          readingSummary.comprehensionAccuracyPct !== null
            ? `Timed Reading Comprehension Accuracy: ${readingSummary.comprehensionAccuracyPct}%`
            : 'Timed Reading Comprehension Accuracy: N/A',
        ]
      : ['Reading Speed (CPM): No timed reading comprehension sessions recorded yet.'];

  return {
    to: recipientEmail,
    subject: `[AkuJin 日本語] ${learnerName}'s JLPT ${targetLevel} Progress Report (${xp} XP)`,
    body: [
      `こんにちは ${learnerName}さん,`,
      '',
      `Here is your live AkuJin Japanese Study Progress Report:`,
      `- Target JLPT Track: JLPT ${targetLevel}`,
      `- Total XP Earned: ${xp.toLocaleString()} XP`,
      `- Active Daily Streak: ${streak} day(s)`,
      `- Kanji Learned (SRS): ${kanjiLearnedCount}`,
      `- Mastered Syllabus Items: ${masteredItemsCount}`,
      ...readingLines.map((l) => `- ${l}`),
      '',
      'Keep practicing daily — 継続は力なり (Continuity is strength)!',
      'AkuJin Japanese Academy',
    ].join('\n'),
  };
}

// ==================== CLIENT-SIDE GMAIL REST API v1 ====================

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function gmailFetch<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let errMsg = `Gmail API request failed (${res.status})`;
    try {
      const payload = (await res.json()) as { error?: { message?: string } };
      if (payload?.error?.message) {
        errMsg = payload.error.message;
      }
    } catch {
      // keep default message
    }
    throw new GmailApiError(errMsg, res.status);
  }

  if (res.status === 204) {
    return {} as T;
  }
  return (await res.json()) as T;
}

export async function fetchGmailProfile(token: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}> {
  return gmailFetch(token, '/profile');
}

export async function listGmailLabels(token: string): Promise<GmailLabelInfo[]> {
  const data = await gmailFetch<{ labels?: GmailLabelInfo[] }>(token, '/labels');
  return Array.isArray(data.labels) ? data.labels : [];
}

export async function listGmailMessages(
  token: string,
  options?: { q?: string; labelIds?: string[]; maxResults?: number }
): Promise<{ messages: ParsedGmailMessage[]; resultSizeEstimate: number }> {
  const params = new URLSearchParams();
  params.set('maxResults', String(options?.maxResults ?? 15));
  if (options?.q?.trim()) {
    params.set('q', options.q.trim());
  }
  if (options?.labelIds && options.labelIds.length > 0) {
    for (const lbl of options.labelIds) {
      params.append('labelIds', lbl);
    }
  }

  const listData = await gmailFetch<{
    messages?: { id: string; threadId: string }[];
    resultSizeEstimate?: number;
  }>(token, `/messages?${params.toString()}`);

  const refs = Array.isArray(listData.messages) ? listData.messages : [];
  const details = await Promise.all(
    refs.slice(0, options?.maxResults ?? 15).map((ref) =>
      gmailFetch<RawGmailMessage>(
        token,
        `/messages/${encodeURIComponent(ref.id)}?format=full`
      ).then(parseGmailMessage)
    )
  );

  return {
    messages: details,
    resultSizeEstimate: listData.resultSizeEstimate ?? details.length,
  };
}

export async function getGmailMessage(
  token: string,
  messageId: string
): Promise<ParsedGmailMessage> {
  const raw = await gmailFetch<RawGmailMessage>(
    token,
    `/messages/${encodeURIComponent(messageId)}?format=full`
  );
  return parseGmailMessage(raw);
}

export async function sendGmailMessage(
  token: string,
  input: ComposeGmailInput
): Promise<{ id: string; threadId: string }> {
  const raw = buildRawRfc2822Email(input);
  return gmailFetch(token, '/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      raw,
      ...(input.threadId ? { threadId: input.threadId } : {}),
    }),
  });
}

export async function createGmailDraft(
  token: string,
  input: ComposeGmailInput
): Promise<{ id: string }> {
  const raw = buildRawRfc2822Email(input);
  return gmailFetch(token, '/drafts', {
    method: 'POST',
    body: JSON.stringify({
      message: {
        raw,
        ...(input.threadId ? { threadId: input.threadId } : {}),
      },
    }),
  });
}

export async function modifyGmailMessageLabels(
  token: string,
  messageId: string,
  changes: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<ParsedGmailMessage> {
  const raw = await gmailFetch<RawGmailMessage>(
    token,
    `/messages/${encodeURIComponent(messageId)}/modify`,
    {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: changes.addLabelIds ?? [],
        removeLabelIds: changes.removeLabelIds ?? [],
      }),
    }
  );
  return parseGmailMessage(raw);
}

export async function trashGmailMessage(
  token: string,
  messageId: string
): Promise<void> {
  await gmailFetch(token, `/messages/${encodeURIComponent(messageId)}/trash`, {
    method: 'POST',
  });
}
