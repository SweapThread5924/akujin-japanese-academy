import React, { useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import type { JlptLevel } from '../utils/srsEngine';
import type { ReadingSpeedSummary } from '../utils/readingSpeed';
import { GmailWorkspacePanel } from './GmailWorkspacePanel';

interface FloatingGmailLauncherProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isConnected?: boolean;
  learnerName: string;
  learnerEmail?: string | null;
  targetLevel: JlptLevel;
  xp: number;
  streak: number;
  kanjiLearnedCount: number;
  masteredItemsCount: number;
  readingSummary: ReadingSpeedSummary;
  onGoogleConnected?: () => void | Promise<void>;
  showFloatingButton?: boolean;
}

export const FloatingGmailLauncher: React.FC<FloatingGmailLauncherProps> = ({
  isOpen,
  onOpen,
  onClose,
  isConnected = false,
  showFloatingButton = true,
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
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {showFloatingButton && (
        <button
          type="button"
          onClick={onOpen}
          data-testid="floating-gmail-btn"
          aria-label="Open Gmail Study Workspace"
          aria-expanded={isOpen}
          title="Open Gmail Study Workspace"
          className="akujin-btn-press akujin-card-lift fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 h-12 px-3.5 sm:px-4 rounded-full bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-700 text-[#141413] dark:text-white shadow-lg shadow-stone-900/12 dark:shadow-black/50 hover:border-[#D92525] dark:hover:border-rose-400 cursor-pointer transition-all"
        >
          <span className="relative inline-flex items-center justify-center h-7 w-7 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#D92525] dark:text-rose-400 shrink-0">
            <Mail className="w-4 h-4" aria-hidden="true" />
            {isConnected && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#16181F]"
              />
            )}
          </span>
          <span className="hidden sm:inline text-xs font-bold tracking-tight whitespace-nowrap">
            Gmail
          </span>
        </button>
      )}

      {/* Responsive Gmail Workspace Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gmail Study Workspace"
          data-testid="gmail-workspace-modal"
          className="fixed inset-0 z-[45] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <div className="relative w-full sm:max-w-5xl max-h-[92vh] sm:rounded-2xl rounded-t-2xl bg-[#FCFBF8] dark:bg-[#0D0E12] border border-stone-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-modal-fade">
            {/* Sticky Modal Header */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#14161D] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-[#D92525]/25 text-[#D92525] dark:text-rose-400 shrink-0">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#141413] dark:text-white truncate">
                    Gmail Study Workspace
                  </h2>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                    {learnerEmail
                      ? `Connected · ${learnerEmail}`
                      : 'Send JLPT progress reports, message Sensei, and view inbox notes'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                data-testid="gmail-modal-close-btn"
                aria-label="Close Gmail Workspace"
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#1B1E28] text-stone-600 dark:text-zinc-300 hover:text-[#D92525] hover:border-[#D92525] cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Workspace Content */}
            <div className="flex-1 overflow-y-auto">
              <GmailWorkspacePanel
                learnerName={learnerName}
                learnerEmail={learnerEmail ?? undefined}
                targetLevel={targetLevel}
                xp={xp}
                streak={streak}
                kanjiLearnedCount={kanjiLearnedCount}
                masteredItemsCount={masteredItemsCount}
                readingSummary={readingSummary}
                onGoogleConnected={onGoogleConnected}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
