import React, { useEffect, useState } from 'react';
import { Mail, Phone, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { validateContactInput } from '../utils/authAndForms';

interface ContactSectionProps {
  defaultEmail?: string;
  defaultName?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  defaultEmail = '',
  defaultName = '',
}) => {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Hidden anti-spam honeypot field
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultName) {
      setName((prev) => (!prev || prev === 'Guest Learner' ? defaultName : prev));
    }
  }, [defaultName]);

  useEffect(() => {
    if (defaultEmail) {
      setEmail((prev) => (!prev ? defaultEmail : prev));
    }
  }, [defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedId(null);

    const validation = validateContactInput({ name, email, mobile, message });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          message: message.trim(),
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'We could not send your message right now. Please try again shortly.');
        return;
      }
      setSubmittedId(data.id || 'received');
      setMessage('');
    } catch {
      setError('We could not reach the server to send your message. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact-us"
      aria-label="Contact Us"
      className="mx-auto max-w-[1280px] px-4 sm:px-6"
    >
      <div className="rounded-2xl bg-white dark:bg-[#16181F] border border-stone-200 dark:border-zinc-800 p-6 sm:p-10 grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs font-medium text-[#D92525] dark:text-rose-400">
            お問い合わせ · Contact &amp; Student Support
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-white">
            Still have queries or doubts?{' '}
            <span className="font-display-italic text-[#D92525] dark:text-rose-400 font-semibold">
              Contact Us.
            </span>
          </h2>
          <p className="text-sm text-stone-600 dark:text-zinc-300 leading-relaxed">
            Whether you need guidance on choosing between JLPT N5 and N4, university scholarships in Japan, or feedback on our study modules, send us a direct note.
          </p>

          <div className="space-y-2.5 pt-2 text-xs text-stone-600 dark:text-zinc-300">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
              <a
                href="mailto:kumaranshul6467@gmail.com"
                data-testid="contact-support-email"
                className="hover:text-[#D92525] dark:hover:text-rose-400 underline-offset-2 hover:underline transition-colors"
              >
                kumaranshul6467@gmail.com · Direct Study Desk
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
              <span>Mon–Sat · JLPT N5–N1 Academic Counseling</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#D92525] shrink-0" aria-hidden="true" />
              <span>Response within 24 business hours</span>
            </div>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="contact-name" className="text-xs font-semibold text-[#141413] dark:text-zinc-200 block">
                Full Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contact-email" className="text-xs font-semibold text-[#141413] dark:text-zinc-200 block">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-mobile" className="text-xs font-semibold text-[#141413] dark:text-zinc-200 block">
              Mobile Number
            </label>
            <input
              id="contact-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98765 43210 / +81 90-1234-5678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contact-message" className="text-xs font-semibold text-[#141413] dark:text-zinc-200 block">
              Your Query or Doubt
            </label>
            <textarea
              id="contact-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about JLPT N5–N1 syllabus, study plan, or any Japanese grammar doubt..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-[#101218] text-sm text-[#141413] dark:text-white"
            />
          </div>

          {/* Hidden honeypot input for automated spam protection */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && (
            <div
              role="alert"
              data-testid="contact-error"
              className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-800 px-3.5 py-2.5 text-xs font-medium text-[#D92525] dark:text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {submittedId && (
            <div
              role="status"
              data-testid="contact-success"
              className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-700 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Email sent successfully (Ref: {submittedId})! Our Sensei team at kumaranshul6467@gmail.com will reply to{' '}
                {email || 'your email'} within 24 business hours.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            data-testid="contact-submit-btn"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D92525] hover:bg-[#B91C1C] text-white text-sm font-semibold cursor-pointer disabled:opacity-60 transition-colors"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            {submitting ? 'Sending Message…' : 'Send Query'}
          </button>
        </form>
      </div>
    </section>
  );
};
