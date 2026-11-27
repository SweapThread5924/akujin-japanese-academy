import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import {
  computeScrollProgressPct,
  computeStaggerDelayMs,
  isElementInitiallyInViewport,
} from '../utils/scrollReveal';

export type RevealVariant =
  | 'fade-up'
  | 'fade-left'
  | 'fade-right'
  | 'scale-in'
  | 'blur-up';

interface RevealOnScrollProps {
  children: React.ReactNode;
  variant?: RevealVariant;
  delayMs?: number;
  className?: string;
  as?: 'div' | 'section' | 'article';
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  variant = 'fade-up',
  delayMs = 0,
  className = '',
  as = 'div',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (isElementInitiallyInViewport(rect.top, rect.bottom, window.innerHeight)) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -32px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      data-reveal-component={variant}
      data-revealed={visible ? 'true' : 'false'}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`akujin-reveal akujin-reveal-${variant} ${
        visible ? 'is-revealed' : ''
      } ${className}`}
    >
      {children}
    </Tag>
  );
};

const AUTO_REVEAL_SELECTOR =
  'section, article, [data-reveal], .akujin-scroll-item, [data-reveal-stagger] > *';

/**
 * Global IntersectionObserver hook that automatically animates sections,
 * articles, [data-reveal] blocks, .akujin-scroll-item wrappers, and
 * [data-reveal-stagger] children as the user scrolls down across every tab.
 */
export function useAutoScrollReveal(
  containerRef: React.RefObject<HTMLElement | null>,
  depKey: string
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof window === 'undefined') return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR)
    ).filter((el) => !el.hasAttribute('data-reveal-component'));

    if (targets.length === 0) return;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => {
        el.classList.add('akujin-scroll-item', 'is-revealed');
        el.dataset.scrollBound = 'true';
      });
      return;
    }

    let initialVisibleCount = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        let batchIdx = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const customDelay = Number(target.dataset.revealDelay ?? '');
            const delay =
              Number.isFinite(customDelay) && target.dataset.revealDelay
                ? customDelay
                : computeStaggerDelayMs(batchIdx, 55, 330);
            batchIdx += 1;
            target.style.transitionDelay = `${delay}ms`;
            target.classList.add('is-revealed');
            observer.unobserve(target);
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -16px 0px' }
    );

    const applyVariantClass = (el: HTMLElement) => {
      const explicitVariant = el.dataset.revealVariant;
      if (explicitVariant && explicitVariant !== 'fade-up') {
        el.classList.add(`akujin-reveal-${explicitVariant}`);
        return;
      }
      // Automatically add subtle zoom-in variety for article cards
      if (el.tagName === 'ARTICLE') {
        el.classList.add('akujin-reveal-scale-in');
      }
    };

    const registerElement = (el: HTMLElement, _idxOffset: number) => {
      if (
        el.hasAttribute('data-reveal-component') ||
        el.dataset.scrollBound === 'true'
      ) {
        return;
      }
      el.dataset.scrollBound = 'true';
      el.classList.add('akujin-scroll-item');
      applyVariantClass(el);

      const rect = el.getBoundingClientRect();
      if (isElementInitiallyInViewport(rect.top, rect.bottom, window.innerHeight)) {
        el.style.transitionDelay = '0ms';
        el.classList.add('is-revealed');
      } else {
        el.classList.remove('is-revealed');
        observer.observe(el);
      }
    };

    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const idx = isElementInitiallyInViewport(
        rect.top,
        rect.bottom,
        window.innerHeight
      )
        ? initialVisibleCount++
        : 0;
      registerElement(el, idx);
    });

    const revealCurrentlyVisible = () => {
      const vh = window.innerHeight;
      root
        .querySelectorAll<HTMLElement>('.akujin-scroll-item:not(.is-revealed)')
        .forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (isElementInitiallyInViewport(rect.top, rect.bottom, vh)) {
            el.style.transitionDelay = '0ms';
            el.classList.add('is-revealed');
            observer.unobserve(el);
          }
        });
    };

    let scrollCheckRaf: number | null = null;
    const scheduleVisibleCheck = () => {
      if (scrollCheckRaf !== null) return;
      scrollCheckRaf = requestAnimationFrame(() => {
        scrollCheckRaf = null;
        revealCurrentlyVisible();
      });
    };

    // Re-check after tab-switch scrollTo(0, 0) settles and on any user/programmatic scroll or resize
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(revealCurrentlyVisible);
    });
    const timerId = window.setTimeout(revealCurrentlyVisible, 180);
    window.addEventListener('scroll', scheduleVisibleCheck, { passive: true });
    window.addEventListener('resize', scheduleVisibleCheck, { passive: true });

    const mutationObserver = new MutationObserver((mutations) => {
      let dynamicIdx = 0;
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(AUTO_REVEAL_SELECTOR)) {
            registerElement(node, dynamicIdx++);
          }
          node
            .querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR)
            .forEach((child) => registerElement(child, dynamicIdx++));
        });
      }
    });

    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      if (scrollCheckRaf !== null) {
        cancelAnimationFrame(scrollCheckRaf);
      }
      window.clearTimeout(timerId);
      window.removeEventListener('scroll', scheduleVisibleCheck);
      window.removeEventListener('resize', scheduleVisibleCheck);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef, depKey]);
}

/**
 * Sleek top-of-page reading/scroll progress bar.
 */
export const ScrollProgressBar: React.FC = () => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const update = () => {
      setPct(
        computeScrollProgressPct(
          window.scrollY,
          document.documentElement.scrollHeight,
          window.innerHeight
        )
      );
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="scroll-progress-bar"
      data-progress={pct}
      className="fixed top-0 left-0 right-0 z-50 h-[2.5px] pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-[#D92525] via-rose-500 to-amber-500 transition-[transform] duration-100 ease-out origin-left"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
};

/**
 * Floating Back-to-Top micro-interaction button with circular scroll progress ring.
 */
export const BackToTopButton: React.FC = () => {
  const [pct, setPct] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => {
      const nextPct = computeScrollProgressPct(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      setPct(nextPct);
      setShow(window.scrollY > 420);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <button
      type="button"
      data-testid="back-to-top-btn"
      aria-label="Scroll back to top"
      onClick={() => {
        const prefersReduced =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({
          top: 0,
          behavior: prefersReduced ? 'auto' : 'smooth',
        });
      }}
      className={`fixed bottom-5 left-5 z-40 h-11 w-11 rounded-full bg-white/95 dark:bg-[#16181F]/95 border border-stone-200 dark:border-zinc-700 shadow-lg flex items-center justify-center text-[#141413] dark:text-white hover:border-[#D92525] hover:text-[#D92525] dark:hover:text-rose-400 cursor-pointer akujin-btn-press transition-all duration-300 ${
        show
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        className="absolute inset-0 -rotate-90 pointer-events-none"
        aria-hidden="true"
      >
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          className="stroke-stone-200/70 dark:stroke-zinc-800"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-[#D92525] dark:stroke-rose-400 transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      <ArrowUp className="w-4 h-4 relative z-10" aria-hidden="true" />
    </button>
  );
};
