import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  FileEdit,
  Inbox,
  Mail,
  MailOpen,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  clearAccessToken,
  getAccessToken,
  initAuth,
  signInWithGoogleWorkspace,
} from '../firebase';
import {
  buildProgressReportEmailDraft,
  createGmailDraft,
  fetchGmailProfile,
  GmailApiError,
  listGmailLabels,
  listGmailMessages,
  modifyGmailMessageLabels,
  sendGmailMessage,
  trashGmailMessage,
  type ComposeGmailInput,
  type GmailLabelInfo,
  type ParsedGmailMessage,
} from '../utils/gmailClient';
import type { ReadingSpeedSummary } from '../utils/readingSpeed';
import type { JlptLevel } from '../utils/srsEngine';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GmailWorkspacePanelProps {
  learnerName: string;
  learnerEmail?: string;
  targetLevel: JlptLevel;
  xp: number;
  streak: number;
  kanjiLearnedCount: number;
  masteredItemsCount: number;
  readingSummary: ReadingSpeedSummary;
  onGoogleConnected?: () => Promise<void> | void;
}

type MailboxFilter = 'INBOX' | 'SENT' | 'STARRED' | 'DRAFT' | 'TRASH' | 'ALL';

interface PendingConfirmation {
  title: string;
  description: string;
  details: { label: string; value: string }[];
  confirmLabel: string;
  destructive?: boolean;
  execute: (token: string) => Promise<void>;
}

const MAILBOX_TABS: { id: MailboxFilter; label: string }[] = [
  { id: 'INBOX', label: 'Inbox' },
  { id: 'STARRED', label: 'Starred' },
  { id: 'SENT', label: 'Sent' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'TRASH', label: 'Trash' },
  { id: 'ALL', label: 'All Mail' },
];

export const GmailWorkspacePanel: React.FC<GmailWorkspacePanelProps> = ({
  learnerName,
  learnerEmail,
  targetLevel,
  xp,
  streak,
  kanjiLearnedCount,
  masteredItemsCount,
  readingSummary,
  onGoogleConnected,
}) => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [mailboxStats, setMailboxStats] = useState<{
    messagesTotal: number;
    threadsTotal: number;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<MailboxFilter>('INBOX');
  const [customLabelId, setCustomLabelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const [labels, setLabels] = useState<GmailLabelInfo[]>([]);
  const [messages, setMessages] = useState<ParsedGmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ParsedGmailMessage | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState<ComposeGmailInput>({
    to: '',
    cc: '',
    subject: '',
    body: '',
  });

  const [actionBusy, setActionBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof GmailApiError && err.isAuthError) {
      clearAccessToken();
      setNeedsAuth(true);
      setErrorBanner(
        'Your Gmail session expired or lacks permission. Please sign in with Google again to continue.'
      );
      return true;
    }
    setErrorBanner(err instanceof Error ? err.message : 'Gmail request failed.');
    return false;
  }, []);

  const loadMailbox = useCallback(
    async (overrideToken?: string) => {
      const token = overrideToken ?? (await getAccessToken());
      if (!token) {
        setNeedsAuth(true);
        return;
      }

      setLoadingInbox(true);
      setErrorBanner(null);
      try {
        const labelIds = customLabelId
          ? [customLabelId]
          : activeFilter === 'ALL'
          ? undefined
          : [activeFilter];

        const [profile, labelList, listResult] = await Promise.all([
          fetchGmailProfile(token),
          listGmailLabels(token),
          listGmailMessages(token, {
            q: appliedQuery,
            labelIds,
            maxResults: 15,
          }),
        ]);

        setConnectedEmail(profile.emailAddress);
        setMailboxStats({
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
        });
        setLabels(labelList);
        setMessages(listResult.messages);
        setSelectedMessage((prev) => {
          if (listResult.messages.length === 0) return null;
          if (!prev) return listResult.messages[0];
          return (
            listResult.messages.find((m) => m.id === prev.id) ??
            listResult.messages[0]
          );
        });
        setNeedsAuth(false);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoadingInbox(false);
      }
    },
    [activeFilter, customLabelId, appliedQuery, handleAuthError]
  );

  useEffect(() => {
    const unsub = initAuth(
      (_user, token) => {
        setNeedsAuth(false);
        void loadMailbox(token);
      },
      () => {
        setNeedsAuth(true);
        setConnectedEmail(null);
        setMessages([]);
        setSelectedMessage(null);
      }
    );
    return () => unsub();
  }, [loadMailbox]);

  useEffect(() => {
    if (!needsAuth) {
      void loadMailbox();
    }
  }, [needsAuth, activeFilter, customLabelId, appliedQuery, loadMailbox]);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    setErrorBanner(null);
    setStatusBanner(null);
    try {
      const { user, accessToken } = await signInWithGoogleWorkspace();
      setNeedsAuth(false);
      setConnectedEmail(user.email ?? null);
      if (onGoogleConnected) {
        await onGoogleConnected();
      }
      await loadMailbox(accessToken);
      setStatusBanner(`Connected Gmail mailbox for ${user.email || 'your Google account'}.`);
    } catch (err) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'Google Sign-In was cancelled or blocked by popup settings.'
      );
    } finally {
      setConnecting(false);
    }
  };

  const prefillProgressReport = () => {
    const draft = buildProgressReportEmailDraft({
      recipientEmail: connectedEmail || learnerEmail || '',
      learnerName,
      targetLevel,
      xp,
      streak,
      kanjiLearnedCount,
      masteredItemsCount,
      readingSummary,
    });
    setComposeForm({ ...draft, cc: '' });
    setComposeOpen(true);
    setErrorBanner(null);
  };

  const prefillSenseiQuestion = () => {
    setComposeForm({
      to: 'kumaranshul6467@gmail.com',
      cc: '',
      subject: `[AkuJin Study Desk] JLPT ${targetLevel} Question from ${learnerName}`,
      body: `こんにちは Sensei,\n\nI am studying JLPT ${targetLevel} on AkuJin (Current XP: ${xp}, Reading Speed Avg: ${
        readingSummary.averageCpm > 0 ? `${readingSummary.averageCpm} CPM` : 'Not timed yet'
      }).\n\nMy question:\n`,
    });
    setComposeOpen(true);
    setErrorBanner(null);
  };

  const handleReplyToSelected = (msg: ParsedGmailMessage) => {
    const replySubject = msg.subject.toLowerCase().startsWith('re:')
      ? msg.subject
      : `Re: ${msg.subject}`;
    setComposeForm({
      to: msg.fromEmail || msg.from,
      cc: '',
      subject: replySubject,
      threadId: msg.threadId,
      inReplyTo: msg.messageIdHeader || undefined,
      body: `\n\n--- On ${msg.date}, ${msg.fromName} wrote ---\n${msg.textBody.slice(0, 800)}`,
    });
    setComposeOpen(true);
  };

  const requestSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    if (!composeForm.to.trim() || !composeForm.to.includes('@')) {
      setErrorBanner('Please enter a valid recipient email address.');
      return;
    }
    if (!composeForm.subject.trim()) {
      setErrorBanner('Please enter an email subject.');
      return;
    }
    if (!composeForm.body.trim()) {
      setErrorBanner('Please write a message body before sending.');
      return;
    }

    setPendingConfirmation({
      title: 'Confirm Send Email via Gmail',
      description:
        'This will send an email directly from your connected Gmail account. Review the recipient and subject below before proceeding.',
      details: [
        { label: 'From', value: connectedEmail || 'Connected Gmail Account' },
        { label: 'To', value: composeForm.to.trim() },
        ...(composeForm.cc?.trim() ? [{ label: 'Cc', value: composeForm.cc.trim() }] : []),
        { label: 'Subject', value: composeForm.subject.trim() },
      ],
      confirmLabel: 'Send Email Now',
      execute: async (token) => {
        await sendGmailMessage(token, composeForm);
        setComposeOpen(false);
        setComposeForm({ to: '', cc: '', subject: '', body: '' });
        setStatusBanner(`Email sent to ${composeForm.to.trim()} via Gmail.`);
        await loadMailbox(token);
      },
    });
  };

  const requestSaveDraft = () => {
    setErrorBanner(null);
    if (!composeForm.subject.trim() && !composeForm.body.trim() && !composeForm.to.trim()) {
      setErrorBanner('Enter a recipient, subject, or message before saving a draft.');
      return;
    }
    setPendingConfirmation({
      title: 'Confirm Save Gmail Draft',
      description: 'Save this message as a draft in your Gmail Drafts folder?',
      details: [
        { label: 'To', value: composeForm.to.trim() || '(Unaddressed)' },
        { label: 'Subject', value: composeForm.subject.trim() || '(No Subject)' },
      ],
      confirmLabel: 'Save Draft',
      execute: async (token) => {
        await createGmailDraft(token, composeForm);
        setComposeOpen(false);
        setStatusBanner('Draft saved to your Gmail account.');
        await loadMailbox(token);
      },
    });
  };

  const requestTrashMessage = (msg: ParsedGmailMessage) => {
    setPendingConfirmation({
      title: 'Move Email to Trash?',
      description: 'Are you sure you want to move this Gmail message to your Trash folder?',
      details: [
        { label: 'Subject', value: msg.subject },
        { label: 'From', value: msg.from || msg.fromName },
      ],
      confirmLabel: 'Move to Trash',
      destructive: true,
      execute: async (token) => {
        await trashGmailMessage(token, msg.id);
        setStatusBanner(`Moved "${msg.subject}" to Trash.`);
        await loadMailbox(token);
      },
    });
  };

  const requestToggleRead = (msg: ParsedGmailMessage) => {
    const markingRead = msg.isUnread;
    setPendingConfirmation({
      title: markingRead ? 'Mark Email as Read?' : 'Mark Email as Unread?',
      description: `Update Gmail read status for "${msg.subject}"?`,
      details: [
        { label: 'From', value: msg.fromName },
        { label: 'Action', value: markingRead ? 'Remove UNREAD label' : 'Apply UNREAD label' },
      ],
      confirmLabel: markingRead ? 'Mark Read' : 'Mark Unread',
      execute: async (token) => {
        const updated = await modifyGmailMessageLabels(token, msg.id, {
          addLabelIds: markingRead ? [] : ['UNREAD'],
          removeLabelIds: markingRead ? ['UNREAD'] : [],
        });
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setSelectedMessage(updated);
        setStatusBanner(markingRead ? 'Marked email as read.' : 'Marked email as unread.');
      },
    });
  };

  const requestToggleStar = (msg: ParsedGmailMessage) => {
    const addingStar = !msg.isStarred;
    setPendingConfirmation({
      title: addingStar ? 'Star Email?' : 'Remove Star?',
      description: `${addingStar ? 'Add' : 'Remove'} Gmail STARRED label on "${msg.subject}"?`,
      details: [{ label: 'Subject', value: msg.subject }],
      confirmLabel: addingStar ? 'Add Star' : 'Remove Star',
      execute: async (token) => {
        const updated = await modifyGmailMessageLabels(token, msg.id, {
          addLabelIds: addingStar ? ['STARRED'] : [],
          removeLabelIds: addingStar ? [] : ['STARRED'],
        });
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        setSelectedMessage(updated);
        setStatusBanner(addingStar ? 'Email starred.' : 'Star removed.');
      },
    });
  };

  const requestArchiveMessage = (msg: ParsedGmailMessage) => {
    setPendingConfirmation({
      title: 'Archive Email?',
      description: 'Remove this message from Inbox while keeping it in All Mail?',
      details: [
        { label: 'Subject', value: msg.subject },
        { label: 'From', value: msg.fromName },
      ],
      confirmLabel: 'Archive Email',
      execute: async (token) => {
        await modifyGmailMessageLabels(token, msg.id, {
          removeLabelIds: ['INBOX'],
        });
        setStatusBanner(`Archived "${msg.subject}".`);
        await loadMailbox(token);
      },
    });
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingConfirmation) return;
    const token = await getAccessToken();
    if (!token) {
      setPendingConfirmation(null);
      setNeedsAuth(true);
      setErrorBanner('Please sign in with Google again to authorize this Gmail action.');
      return;
    }

    setActionBusy(true);
    setErrorBanner(null);
    try {
      await pendingConfirmation.execute(token);
      setPendingConfirmation(null);
    } catch (err) {
      setPendingConfirmation(null);
      handleAuthError(err);
    } finally {
      setActionBusy(false);
    }
  };

  const userLabels = labels.filter((l) => l.type === 'user').slice(0, 8);

  return (
    <div
      data-testid="gmail-workspace-panel"
      className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            Gmail 連携 · Study Desk, Progress Reports &amp; Direct Mailbox
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#141413] dark:text-white mt-1">
            Gmail{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Study Workspace.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-300 mt-1 max-w-2xl">
            Read Japanese newsletters and replies, email your JLPT &amp; Reading Speed (CPM) progress report, organize labels, or compose questions directly via your Gmail account.
          </p>
        </div>

        {!needsAuth && connectedEmail && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={prefillProgressReport}
              data-testid="gmail-prefill-report-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              Email Progress Report
            </button>
            <button
              type="button"
              onClick={prefillSenseiQuestion}
              data-testid="gmail-ask-sensei-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#16181F] text-xs font-semibold text-[#141413] dark:text-white hover:border-[#D92525] cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#D92525]" aria-hidden="true" />
              Ask Sensei
            </button>
            <button
              type="button"
              onClick={() => {
                setComposeForm({ to: '', cc: '', subject: '', body: '' });
                setComposeOpen(true);
              }}
              data-testid="gmail-compose-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
              Compose
            </button>
          </div>
        )}
      </div>

      {statusBanner && (
        <div
          role="status"
          data-testid="gmail-status-banner"
          className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{statusBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorBanner && (
        <div
          role="alert"
          data-testid="gmail-error-banner"
          className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-800 px-4 py-3 text-xs font-medium text-[#D92525] dark:text-rose-300"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            aria-label="Dismiss error"
            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unauthenticated / Token Unavailable Gate */}
      {needsAuth ? (
        <section
          data-testid="gmail-auth-gate"
          className="rounded-3xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-7 sm:p-10 text-center max-w-2xl mx-auto space-y-5 shadow-xs"
        >
          <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 flex items-center justify-center">
            <Mail className="w-7 h-7 text-[#D92525]" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#141413] dark:text-white">
              Connect Your Gmail Account
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-zinc-300 leading-relaxed max-w-lg mx-auto">
              Sign in with Google to authorize temporary, memory-only Gmail access for this session. You can read messages, save drafts, archive or organize labels, and email your JLPT &amp; Reading Speed report—with explicit confirmation before every email send or deletion.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-1">
            <GoogleSignInButton
              onClick={handleConnectGoogle}
              disabled={connecting}
              label={connecting ? 'Connecting Google Account…' : 'Sign in with Google'}
              testId="gmail-google-signin-btn"
            />
            <p className="text-[11px] text-stone-500 dark:text-zinc-400">
              Access tokens stay strictly in browser memory and clear automatically when you reload or sign out.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-stone-200/80 dark:border-zinc-800 text-left text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800">
              <p className="font-semibold text-[#141413] dark:text-white">Read &amp; Search</p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                Browse Inbox, Starred, Sent, Drafts, or search Japanese study notes.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800">
              <p className="font-semibold text-[#141413] dark:text-white">Send Reports</p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                One-click template for your JLPT level, XP, Kanji SRS &amp; Reading CPM.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/70 dark:border-zinc-800">
              <p className="font-semibold text-[#141413] dark:text-white">Safe Confirmations</p>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400 mt-0.5">
                Every send, draft, label update, or trash action confirms with you first.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-5">
          {/* Connected Status Bar + Search */}
          <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold">
                <Inbox className="w-3.5 h-3.5" aria-hidden="true" />
                {connectedEmail}
              </span>
              {mailboxStats && (
                <span className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                  {mailboxStats.messagesTotal.toLocaleString()} total messages ·{' '}
                  {mailboxStats.threadsTotal.toLocaleString()} threads
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedQuery(searchQuery);
                }}
                className="flex items-center gap-1.5 flex-1 sm:flex-initial"
              >
                <div className="relative flex-1 sm:w-64">
                  <Search
                    className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Gmail (e.g. JLPT, AkuJin)..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#141413] dark:bg-white text-white dark:text-[#141413] text-xs font-semibold cursor-pointer"
                >
                  Search
                </button>
              </form>

              <button
                type="button"
                onClick={() => void loadMailbox()}
                disabled={loadingInbox}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-200 hover:border-[#D92525] cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingInbox ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Mailbox Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Sidebar: Folders & Labels (3 cols) */}
            <aside className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 px-2">
                  Folders
                </p>
                {MAILBOX_TABS.map((tab) => {
                  const active = !customLabelId && activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setCustomLabelId(null);
                        setActiveFilter(tab.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#D92525] text-white'
                          : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#1E2029]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {userLabels.length > 0 && (
                <div className="space-y-1 pt-3 border-t border-stone-200/80 dark:border-zinc-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400 px-2 inline-flex items-center gap-1">
                    <Tag className="w-3 h-3" aria-hidden="true" />
                    Labels
                  </p>
                  {userLabels.map((lbl) => {
                    const active = customLabelId === lbl.id;
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => setCustomLabelId(lbl.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#141413] dark:bg-white text-white dark:text-[#141413] font-semibold'
                            : 'text-stone-600 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-[#1E2029]'
                        }`}
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* Middle: Message List (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-bold text-[#141413] dark:text-white">
                  {customLabelId ? 'Label View' : activeFilter} ({messages.length})
                </span>
                {appliedQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setAppliedQuery('');
                    }}
                    className="text-[11px] text-[#D92525] font-semibold hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>

              {loadingInbox ? (
                <div className="p-8 text-center text-xs text-stone-500 dark:text-zinc-400">
                  Loading messages from Gmail…
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 dark:text-zinc-400 space-y-2">
                  <MailOpen className="w-6 h-6 mx-auto text-stone-400" aria-hidden="true" />
                  <p>No messages found in this view.</p>
                </div>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-zinc-800 max-h-[540px] overflow-y-auto">
                  {messages.map((msg) => {
                    const selected = selectedMessage?.id === msg.id;
                    return (
                      <li key={msg.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(msg)}
                          className={`w-full text-left p-3.5 transition-colors cursor-pointer space-y-1 ${
                            selected
                              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-l-2 border-[#D92525]'
                              : 'hover:bg-stone-50 dark:hover:bg-[#1B1E28]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span
                              className={`truncate ${
                                msg.isUnread
                                  ? 'font-bold text-[#141413] dark:text-white'
                                  : 'font-medium text-stone-600 dark:text-zinc-300'
                              }`}
                            >
                              {msg.fromName}
                            </span>
                            {msg.isStarred && (
                              <Star
                                className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0"
                                aria-label="Starred"
                              />
                            )}
                          </div>
                          <p
                            className={`text-xs truncate ${
                              msg.isUnread
                                ? 'font-bold text-[#141413] dark:text-white'
                                : 'font-medium text-stone-700 dark:text-zinc-200'
                            }`}
                          >
                            {msg.subject}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2">
                            {msg.snippet || msg.textBody}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Right: Message Reader (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-5 space-y-4 min-h-[380px]">
              {selectedMessage ? (
                <>
                  <div className="space-y-2 pb-3 border-b border-stone-200 dark:border-zinc-800">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="text-base font-bold text-[#141413] dark:text-white leading-snug">
                        {selectedMessage.subject}
                      </h2>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReplyToSelected(selectedMessage)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D92525] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          <Reply className="w-3 h-3" aria-hidden="true" />
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => requestToggleStar(selectedMessage)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-amber-400 cursor-pointer"
                          title={selectedMessage.isStarred ? 'Remove Star' : 'Star Message'}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              selectedMessage.isStarred ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestToggleRead(selectedMessage)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-[#D92525] cursor-pointer"
                          title={selectedMessage.isUnread ? 'Mark Read' : 'Mark Unread'}
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestArchiveMessage(selectedMessage)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-[#D92525] cursor-pointer"
                          title="Archive Message"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestTrashMessage(selectedMessage)}
                          className="p-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 text-[#D92525] hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-stone-600 dark:text-zinc-300 space-y-0.5">
                      <p>
                        <strong className="text-[#141413] dark:text-white">From:</strong>{' '}
                        {selectedMessage.from}
                      </p>
                      {selectedMessage.to && (
                        <p>
                          <strong className="text-[#141413] dark:text-white">To:</strong>{' '}
                          {selectedMessage.to}
                        </p>
                      )}
                      {selectedMessage.date && (
                        <p className="text-[11px] font-mono-nums text-stone-500 dark:text-zinc-400">
                          {selectedMessage.date}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap break-words text-xs sm:text-sm text-stone-700 dark:text-zinc-200 leading-relaxed max-h-[380px] overflow-y-auto font-jp">
                    {selectedMessage.textBody || '(Empty message body)'}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 text-xs text-stone-500 dark:text-zinc-400 space-y-2">
                  <Mail className="w-7 h-7 text-stone-300 dark:text-zinc-600" aria-hidden="true" />
                  <p>Select an email on the left to read it or compose a new message.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {composeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gmail-compose-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 space-y-4 shadow-xl relative">
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              aria-label="Close compose dialog"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-[#141413] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2
              id="gmail-compose-title"
              className="text-lg font-bold text-[#141413] dark:text-white"
            >
              Compose Gmail Message
            </h2>

            <form onSubmit={requestSendEmail} className="space-y-3">
              <div>
                <label
                  htmlFor="gmail-to"
                  className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1"
                >
                  To
                </label>
                <input
                  id="gmail-to"
                  type="email"
                  required
                  value={composeForm.to}
                  onChange={(e) =>
                    setComposeForm((prev) => ({ ...prev, to: e.target.value }))
                  }
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="gmail-subject"
                  className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1"
                >
                  Subject
                </label>
                <input
                  id="gmail-subject"
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) =>
                    setComposeForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="Subject"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs text-[#141413] dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="gmail-body"
                  className="text-xs font-semibold text-stone-700 dark:text-zinc-300 block mb-1"
                >
                  Message
                </label>
                <textarea
                  id="gmail-body"
                  rows={7}
                  required
                  value={composeForm.body}
                  onChange={(e) =>
                    setComposeForm((prev) => ({ ...prev, body: e.target.value }))
                  }
                  placeholder="Write your Japanese study note or email..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-xs font-jp text-[#141413] dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={requestSaveDraft}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-[#141413] dark:text-white hover:bg-stone-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Save Draft
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    Review &amp; Send
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY Explicit Confirmation Dialog before any Gmail Mutation / Deletion */}
      {pendingConfirmation && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="gmail-confirm-title"
          data-testid="gmail-confirm-dialog"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingConfirmation.destructive
                    ? 'bg-rose-100 dark:bg-rose-950/50 text-[#D92525]'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3
                  id="gmail-confirm-title"
                  className="text-base font-bold text-[#141413] dark:text-white"
                >
                  {pendingConfirmation.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {pendingConfirmation.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 dark:bg-[#101218] border border-stone-200/80 dark:border-zinc-800 p-3 space-y-1.5 text-xs">
              {pendingConfirmation.details.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-stone-500 dark:text-zinc-400 shrink-0">
                    {row.label}:
                  </span>
                  <span className="text-right text-[#141413] dark:text-white break-all font-medium">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setPendingConfirmation(null)}
                data-testid="gmail-confirm-cancel-btn"
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-zinc-700 text-xs font-semibold text-stone-700 dark:text-zinc-200 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={handleConfirmPendingAction}
                data-testid="gmail-confirm-proceed-btn"
                className="px-4 py-2 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {actionBusy ? 'Executing…' : pendingConfirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
