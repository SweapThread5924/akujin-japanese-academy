async (page) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.setViewportSize({ width: 1280, height: 720 });

  const dismissOnboardingIfOpen = async (waitTimeout = 8000) => {
    const modal = page.locator('[data-testid="onboarding-modal"]');
    const isVisible = await modal
      .waitFor({ state: 'visible', timeout: waitTimeout })
      .then(() => true)
      .catch(() => false);
    if (!isVisible) return false;
    for (const q of [1, 2, 3, 4, 6, 7]) {
      await page.locator(`[data-testid="onboarding-q${q}-opt-0"]`).click();
    }
    await page.locator('[data-testid="onboarding-track-zero"]').click();
    await page.click('[data-testid="onboarding-submit-btn"]');
    const sakuraBtn = page.locator('[data-testid="sakura-welcome-lets-go-btn"]');
    if (await sakuraBtn.waitFor({ state: 'visible', timeout: 6000 }).then(() => true).catch(() => false)) {
      await sakuraBtn.click();
    }
    await modal.waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {});
    return true;
  };

  await dismissOnboardingIfOpen(8000);
  await page.waitForSelector('[data-testid="overview-jlpt-visibility-bar"]', { state: 'visible' });

  // Verify sticky behavior on scroll
  await page.evaluate(() => window.scrollTo(0, 750));
  await page.waitForTimeout(450);
  const stickyMetrics = await page.evaluate(() => {
    const bar = document.querySelector('[data-testid="overview-jlpt-visibility-bar"]');
    const header = document.querySelector('header');
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const headerRect = header ? header.getBoundingClientRect() : null;
    return {
      barTop: barRect ? Math.round(barRect.top) : -1,
      headerHeight: headerRect ? Math.round(headerRect.height) : -1,
      stickyComputedPosition: bar ? getComputedStyle(bar).position : null,
      desktopOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  // Scroll back up and toggle off N1 and N2
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.click('[data-testid="jlpt-visibility-toggle-N1"]');
  await page.click('[data-testid="jlpt-visibility-toggle-N2"]');
  await page.waitForTimeout(200);

  const statusAfterToggle = await page.locator('[data-testid="jlpt-visibility-status"]').innerText();
  const playbookTabsAfterToggle = await page.locator('[data-testid="overview-playbook-tablist"] [role="tab"]').allInnerTexts();

  // Reload to confirm persistence across reloads
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="overview-jlpt-visibility-bar"]', { state: 'visible' });
  await page.waitForTimeout(800);
  if (await page.locator('[data-testid="onboarding-skip-btn"]').isVisible().catch(() => false)) {
    await page.click('[data-testid="onboarding-skip-btn"]');
  }
  const statusAfterReload = await page.locator('[data-testid="jlpt-visibility-status"]').innerText();

  // Navigate to Roadmap tab
  await page.locator('nav[aria-label="Main navigation"] button:has-text("Roadmap")').click();
  await page.waitForSelector('[data-testid="roadmap-section"]', { state: 'visible' });
  const roadmapLevels = await page.locator('[data-testid^="roadmap-milestone-"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-testid'))
  );
  const roadmapUnlockedText = await page.locator('[data-testid="roadmap-unlocked-count"]').innerText();

  // Navigate to JLPT N5-N1 (Lessons) tab
  await page.locator('nav[aria-label="Main navigation"] button:has-text("JLPT N5")').click();
  await page.waitForSelector('[data-testid="lessons-jlpt-tablist"]', { state: 'visible' });
  const lessonsTabs = await page.locator('[data-testid="lessons-jlpt-tablist"] [role="tab"]').allInnerTexts();
  const lessonsCards = await page.locator('[data-testid^="lesson-unit-card-"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-testid'))
  );

  // Navigate to Kanji SRS tab
  await page.locator('nav[aria-label="Main navigation"] button:has-text("Kanji SRS")').click();
  await page.waitForSelector('[data-testid="kanji-jlpt-tablist"]', { state: 'visible' });
  const kanjiTabs = await page.locator('[data-testid="kanji-jlpt-tablist"] [role="tab"]').allInnerTexts();
  const kanjiBreakdownRows = await page.locator('[data-testid^="jlpt-breakdown-row-"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-testid'))
  );

  // Navigate to Resources tab
  await page.locator('nav[aria-label="Main navigation"] button:has-text("Resources")').click();
  await page.waitForSelector('[data-testid="quick-vocab-pdfs"]', { state: 'visible' });
  const quickVocabText = await page.locator('[data-testid="quick-vocab-pdfs"]').innerText();
  const resourcesResetVisible = await page.locator('[data-testid="resources-filter-notice"]').isVisible();

  // Navigate back to Overview and test Only Target + Show All
  await page.locator('nav[aria-label="Main navigation"] button:has-text("Overview")').click();
  await page.waitForSelector('[data-testid="overview-jlpt-visibility-bar"]', { state: 'visible' });
  await page.click('[data-testid="jlpt-visibility-target-only"]');
  const statusTargetOnly = await page.locator('[data-testid="jlpt-visibility-status"]').innerText();
  await page.click('[data-testid="jlpt-visibility-all"]');
  const statusRestored = await page.locator('[data-testid="jlpt-visibility-status"]').innerText();
  const playbookTabsRestored = await page.locator('[data-testid="overview-playbook-tablist"] [role="tab"]').allInnerTexts();

  // Check mobile viewport responsiveness
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  // Restore desktop viewport scrolled past hero to verify sticky filter bar visually
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(() => window.scrollTo(0, 550));
  await page.waitForTimeout(300);

  return {
    consoleErrors,
    pageErrors,
    stickyMetrics,
    statusAfterToggle,
    playbookTabsAfterToggle,
    statusAfterReload,
    roadmapLevels,
    roadmapUnlockedText,
    lessonsTabs,
    lessonsCards,
    kanjiTabs,
    kanjiBreakdownRows,
    quickVocabText,
    resourcesResetVisible,
    statusTargetOnly,
    statusRestored,
    playbookTabsRestored,
    mobileOverflow,
  };
}
