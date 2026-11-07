import { expect, test, type Page } from '@playwright/test';
import { itemMap } from '../src/data';
import { initialState } from '../src/lib/storage';
import type { AppState } from '../src/types';

async function seed(page: Page, courseId = 'devanagari') {
  await page.addInitScript(state => localStorage.setItem('script-drill:v1', JSON.stringify(state)), {
    ...initialState(), courseId, earlyExtraUnlocks: { devanagari: true },
  });
  await page.goto('/');
}
const stored = (page: Page): Promise<AppState> => page.evaluate(() => JSON.parse(localStorage.getItem('script-drill:v1')!));
async function answer(page: Page) {
  const state = await stored(page), exercise = state.session!.queue[state.session!.index];
  if (exercise.kind === 'intro') await page.getByRole('button', { name: '开始练习', exact: true }).click();
  else {
    if (exercise.kind === 'match') {
      for (const pair of exercise.pairs!) {
        await page.locator('.matching-grid > div').last().locator(`[data-entry-id="${pair.id}"]`).click();
        await page.locator('.matching-grid > div').first().locator(`[data-entry-id="${pair.id}"]`).click();
      }
    } else {
      if (exercise.kind === 'type') await page.getByRole('textbox', { name: '转写', exact: true }).fill(exercise.answer);
      else await page.locator('.answer-options > button').nth(exercise.options.findIndex(option => option.id === exercise.answer)).click();
      await page.getByRole('button', { name: '检查答案', exact: true }).click();
    }
    await page.getByRole('button', { name: '继续', exact: true }).click();
  }
}

test('Devanagari menu, mainline first lesson and parallel branch entrances work', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.course-current').click();
  await page.getByRole('menuitem', { name: /天城文/ }).click();
  await expect(page.getByRole('heading', { name: /^天城文/ })).toBeVisible();
  await expect(page.getByRole('region', { name: '地图与和平声明' })).toContainText('愿世界和平');
  for (const language of ['尼泊尔语', '马拉地语']) {
    const branch = page.locator('.course-branch').filter({ hasText: `课程分支：${language}` });
    await expect(branch.locator('.branch-lesson-row').first()).toBeEnabled();
    await expect(branch.locator('.branch-notice')).toBeVisible();
  }
  await page.screenshot({ path: `.local/screenshots/devanagari-home-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  for (let count = 0; (await stored(page)).session && count < 90; count++) await answer(page);
  await expect(page.locator('.complete-screen')).toBeVisible();
  const state = await stored(page);
  expect(state.progress['dv-overview'].correct).toBeGreaterThan(0);
  expect(Object.keys(state.progress).every(id => itemMap[id].courseId === 'devanagari' && !itemMap[id].branchId)).toBe(true);
  expect(errors).toEqual([]);
});

for (const [id, label] of [['ne', '尼泊尔语'], ['mr', '马拉地语']]) {
  test(`${label} starts and completes a real branch lesson without writing mainline progress`, async ({ page }) => {
    await seed(page);
    await page.locator('.course-branch').filter({ hasText: `课程分支：${label}` }).locator('.branch-lesson-row').first().click();
    expect((await stored(page)).session?.mode).toBe('branch');
    for (let count = 0; (await stored(page)).session && count < 100; count++) await answer(page);
    await expect(page.locator('.complete-screen')).toBeVisible();
    const progress = Object.keys((await stored(page)).progress);
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.every(key => itemMap[key].branchId === id)).toBe(true);
  });
}

test('all three language fonts, complex shaping, maps and word audio remain correct offline', async ({ page }, testInfo) => {
  await page.route(/^https:\/\//, route => route.abort());
  await seed(page);
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const id of ['dv-word-school', 'dv-word-village', 'dv-ne-word-kathmandu', 'dv-mr-lla', 'dv-mr-ae', 'dv-mr-word-mumbai']) {
    await page.locator(`[data-knowledge-id="${id}"]`).click();
    const item = itemMap[id], symbol = page.locator('.detail-symbol > span');
    await expect(symbol).toHaveCSS('font-family', /Noto Sans Devanagari/);
    await expect(symbol).toHaveAttribute('lang', item.languageIds![0]);
    await expect(symbol).toHaveText(item.glyph);
    expect(await symbol.evaluate(node => node.childElementCount)).toBe(0);
    if (item.kind === 'word') {
      const language = item.languageIds![0];
      const link = page.getByRole('link', { name: `在线听${{ hi: '印地语', ne: '尼泊尔语', mr: '马拉地语' }[language]}`, exact: true });
      const url = new URL((await link.getAttribute('href'))!);
      expect(url.searchParams.get('sl')).toBe(language);
      expect(url.searchParams.get('text')).toBe(item.glyph);
    }
    if (item.place) await expect(page.locator('.knowledge-detail [data-map-city]')).toBeVisible();
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.getByRole('dialog').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: `.local/screenshots/${id}-${testInfo.project.name}-${width}.png` });
    }
    await page.keyboard.press('Escape');
  }
  const ink = await page.evaluate(async () => {
    await document.fonts.load('48px "Noto Sans Devanagari"', 'क कि की क्ष ज्ञ ॲ ळ र्‍य');
    const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 140;
    const context = canvas.getContext('2d')!;
    context.font = '48px "Noto Sans Devanagari"';
    return ['क', 'कि', 'की', 'क्ष', 'ज्ञ', 'ॲ', 'ळ', 'र्‍य'].map(text => {
      context.clearRect(0, 0, 400, 140); context.fillText(text, 15, 90);
      const data = context.getImageData(0, 0, 400, 140).data;
      let count = 0, hash = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i]) { count++; hash = (hash + i * data[i]) % 2147483647; }
      return { count, hash };
    });
  });
  expect(ink.every(sample => sample.count > 60)).toBe(true);
  expect(new Set(ink.map(sample => sample.hash)).size).toBe(ink.length);
  expect((await page.request.get('/licenses/NotoSansDevanagari-OFL.txt')).ok()).toBe(true);
});

for (const courseId of ['bengali', 'hebrew', 'devanagari']) {
  test(`${courseId} homepage includes the shared nonpolitical map declaration, not quiz content`, async ({ page }) => {
    await seed(page, courseId);
    const notice = page.getByRole('region', { name: '地图与和平声明' });
    await expect(notice).toHaveCount(1);
    await expect(notice.locator('p')).toHaveCount(1);
    await expect(notice.locator('p')).toHaveText('本课程所有地图均仅作语言学习与位置展示，不用于导航或判定领土归属。课程只教学语言文字与地理知识，不包含任何政治立场。边界与地名存在不同表述，图示不代表对任何争议主张的认可。愿世界和平，愿每一种语言都成为理解彼此的桥梁。');
    await page.getByRole('button', { name: '开始学习', exact: true }).click();
    await expect(page.getByRole('region', { name: '地图与和平声明' })).toHaveCount(0);
  });
}

for (const [courseId, title] of [['thai', '泰语文字'], ['ipa', '国际音标基础']]) {
  test(`${courseId} homepage does not show an unnecessary map declaration`, async ({ page }) => {
    await seed(page, courseId);
    await expect(page.getByRole('heading', { name: new RegExp(`^${title}`) })).toBeVisible();
    await expect(page.getByRole('region', { name: '地图与和平声明' })).toHaveCount(0);
  });
}

test('city centers stay geographically fixed while marker screen diameters survive responsive and CSS zoom', async ({ page }) => {
  await seed(page);
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.locator('[data-knowledge-id="dv-word-delhi"]').click();
  const dot = page.locator('.knowledge-detail [data-map-city]');
  const originalCenter = await dot.evaluate(node => [node.getAttribute('cx'), node.getAttribute('cy')]);
  const diameter = () => dot.evaluate(node => node.getBoundingClientRect().width * devicePixelRatio * (visualViewport?.scale || 1));
  await expect.poll(diameter).toBeCloseTo(8, 1);
  for (const width of [320, 1440]) {
    for (const zoom of [0.67, 1, 2, 3]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(zoom => { document.body.style.zoom = String(zoom); dispatchEvent(new Event('resize')); }, zoom);
      await expect.poll(diameter).toBeCloseTo(8, 1);
      expect(await dot.evaluate(node => [node.getAttribute('cx'), node.getAttribute('cy')])).toEqual(originalCenter);
    }
  }
  await page.evaluate(() => { document.body.style.zoom = ''; dispatchEvent(new Event('resize')); });
});

test('Chromium pinch zoom and display pixel ratios keep city dots at the same screen diameter', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP page-scale emulation is Chromium-specific.');
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({ deviceScaleFactor, viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await seed(page);
    await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
    await page.locator('[data-knowledge-id="dv-word-delhi"]').click();
    const session = await context.newCDPSession(page);
    for (const pageScaleFactor of [1, 1.5, 3]) {
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor });
      await expect.poll(() => page.locator('.knowledge-detail [data-map-city]').evaluate(node =>
        node.getBoundingClientRect().width * devicePixelRatio * (visualViewport?.scale || 1))).toBeCloseTo(8, 1);
    }
    await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
    for (const factor of [2, 3, 1, 2]) {
      // Model page zoom's CSS viewport change as well as DPR; CDP's DPR-only
      // override does not dispatch resolution/resize notifications.
      await session.send('Emulation.setDeviceMetricsOverride', {
        width: Math.round(1280 / factor), height: Math.round(900 / factor),
        deviceScaleFactor: factor, mobile: false,
      });
      await expect.poll(() => page.locator('.knowledge-detail [data-map-city]').evaluate(node =>
        node.getBoundingClientRect().width * devicePixelRatio)).toBeCloseTo(8, 1);
    }
    await context.close();
  }
});
