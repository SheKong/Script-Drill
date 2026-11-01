import { expect, test, type Page } from '@playwright/test';
import { courses, itemMap } from '../src/data';
import { createSession, makeExercise, makeMatch, trained } from '../src/lib/engine';
import { contrastLanguageLabel } from '../src/lib/languages';
import { initialState } from '../src/lib/storage';
import type { AppState } from '../src/types';

const course = courses.hebrew;
const stored = (page: Page): Promise<AppState> => page.evaluate(() => JSON.parse(localStorage.getItem('script-drill:v1')!));
async function seed(page: Page, state: AppState) {
  await page.addInitScript(state => localStorage.setItem('script-drill:v1', JSON.stringify(state)), state);
  await page.goto('/');
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.matching-grid button > span, .answer-option > span:last-child').evaluateAll(nodes =>
    nodes.filter(node => {
      const child = node.getBoundingClientRect(), parent = node.parentElement!.getBoundingClientRect();
      return child.left < parent.left || child.right > parent.right || child.top < parent.top || child.bottom > parent.bottom;
    }).map(node => node.textContent))).toEqual([]);
}
async function answer(page: Page) {
  const state = await stored(page);
  const question = state.session!.queue[state.session!.index];
  if (question.kind === 'intro') await page.getByRole('button', { name: '开始练习', exact: true }).click();
  else {
    if (question.kind === 'type') await page.getByRole('textbox', { name: '转写', exact: true }).fill(question.answer);
    else if (question.kind === 'match') {
      for (const pair of question.pairs!) {
        await page.locator('.matching-grid > div').last().locator(`[data-entry-id="${pair.id}"]`).click();
        await page.locator('.matching-grid > div').first().locator(`[data-entry-id="${pair.id}"]`).click();
      }
    } else await page.locator('.answer-options > button').nth(question.options.findIndex(option => option.id === question.answer)).click();
    if (question.kind !== 'match') await page.getByRole('button', { name: '检查答案', exact: true }).click();
    await page.getByRole('button', { name: '继续', exact: true }).click();
  }
  await expect.poll(async () => (await stored(page)).session?.index ?? -1).not.toBe(state.session!.index);
}

test('Hebrew starts through the course menu and saves real first-lesson answers', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.course-current').click();
  await page.getByRole('menuitem', { name: /希伯来语文字/ }).click();
  await expect(page.getByRole('heading', { name: /^希伯来语文字/ })).toBeVisible();
  await expect(page.locator('h1 .hebrew')).toHaveAttribute('dir', 'rtl');
  await page.screenshot({ path: `.local/screenshots/hebrew-home-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await expect(page.locator('.detail-symbol > span')).toHaveAttribute('lang', 'he');
  await expect(page.locator('.detail-symbol > span')).toHaveAttribute('dir', 'rtl');
  for (let step = 0; (await stored(page)).session && step < 65; step++) await answer(page);
  await expect(page.locator('.complete-screen')).toBeVisible();
  expect(trained('he-rtl', (await stored(page)).progress)).toBe(true);
  expect((await stored(page)).progress['th-k']).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Hebrew fonts, points, RTL words and city maps work offline at desktop and phone widths', async ({ page }, testInfo) => {
  await page.route(/^https:\/\//, route => route.abort());
  await seed(page, { ...initialState(), courseId: course.id, earlyExtraUnlocks: { hebrew: true } });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const id of ['he-vet', 'he-shuruq', 'he-word-jerusalem']) {
    await page.locator(`[data-knowledge-id="${id}"]`).click();
    const symbol = page.locator('.detail-symbol > span');
    await expect(symbol).toHaveCSS('font-family', /Noto Sans Hebrew/);
    await expect(symbol).toHaveAttribute('dir', 'rtl');
    await expect(symbol).toHaveText(itemMap[id].glyph);
    expect(await symbol.evaluate(node => node.childElementCount)).toBe(0);
    if (id === 'he-word-jerusalem') {
      await expect(page.locator('.conventional-names')).toContainText('Jerusalem');
      const pixels = await page.locator('.knowledge-detail .place-map svg').evaluate(async svg => {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
        await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 260;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0, 180, 260);
        const data = context.getImageData(0, 0, 180, 260).data;
        let red = 0, ink = 0;
        for (let index = 0; index < data.length; index += 4) {
          if (data[index + 3] > 40) ink++;
          if (data[index] > 150 && data[index + 1] < 120 && data[index + 2] < 120 && data[index + 3] > 40) red++;
        }
        return { red, ink };
      });
      expect(pixels.red).toBeGreaterThan(8);
      expect(pixels.ink).toBeGreaterThan(400);
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow(page);
      expect(await page.getByRole('dialog').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: `.local/screenshots/${id}-${testInfo.project.name}-${width}.png` });
    }
    await page.keyboard.press('Escape');
  }
  const samples = await page.evaluate(async () => {
    await document.fonts.load('48px "Noto Sans Hebrew"', 'בּ בֿ שׁ שׂ ך ם ן ף ץ');
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 130;
    const context = canvas.getContext('2d')!;
    context.font = '48px "Noto Sans Hebrew"'; context.direction = 'rtl';
    return ['בּ', 'בֿ', 'שׁ', 'שׂ', 'ך', 'ם', 'ן', 'ף', 'ץ', '◌ַ', '◌ָ'].map(text => {
      context.clearRect(0, 0, 320, 130); context.fillText(text, 280, 80);
      const data = context.getImageData(0, 0, 320, 130).data;
      let ink = 0, hash = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i]) {
        ink++; hash = (hash + i * data[i]) % 2147483647;
      }
      return { ink, hash };
    });
  });
  expect(samples.every(sample => sample.ink > 60)).toBe(true);
  expect(new Set(samples.map(sample => sample.hash)).size).toBe(samples.length);
  await page.getByRole('button', { name: '课程与资料来源', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('link', { name: 'Noto Sans Hebrew', exact: true })).toHaveAttribute('href', '/licenses/NotoSansHebrew-OFL.txt');
  const license = await page.request.get('/licenses/NotoSansHebrew-OFL.txt');
  expect(license.ok()).toBe(true);
  expect(await license.text()).toContain('SIL OPEN FONT LICENSE Version 1.1');
});

test('Hebrew word reading, reverse, plain typing and meaning preserve writing directions', async ({ page }, testInfo) => {
  const state = { ...initialState(), courseId: course.id };
  const word = itemMap['he-word-street'];
  state.progress[word.id] = { introduced: true, correct: 3, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString() };
  state.session = createSession(state, 'custom', undefined, [word.id])!;
  state.session.queue = ['read', 'reverse', 'type', 'meaning'].map(kind =>
    makeExercise(word, kind as 'read' | 'reverse' | 'type' | 'meaning', course, state.progress));
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  for (const kind of ['read', 'reverse', 'type', 'meaning']) {
    await expect(page.locator('.question-display')).toHaveAttribute('dir', ['read', 'type'].includes(kind) ? 'rtl' : 'ltr');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow(page);
      await page.screenshot({ path: `.local/screenshots/hebrew-${kind}-${testInfo.project.name}-${width}.png` });
    }
    if (kind === 'type') {
      await page.getByRole('textbox', { name: '转写', exact: true }).fill('REHOV');
      await page.getByRole('button', { name: '检查答案', exact: true }).click();
      await expect(page.locator('.quiz-footer')).toHaveClass(/feedback-correct/);
      await page.getByRole('button', { name: '继续', exact: true }).click();
    } else await answer(page);
  }
  expect((await stored(page)).history.at(-1)?.correct).toBe(4);
});

test('shared matching entries have no language badge, while language-specific readings remain labeled', async ({ page }, testInfo) => {
  const state = { ...initialState(), courseId: 'bengali' };
  state.session = createSession(state, 'branch', 'assamese-u1')!;
  const ids = ['bn-k', 'bn-e', 'as-o', 'bn-r', 'as-r'];
  state.session.queue = [makeMatch(ids.map(id => itemMap[id]))!];
  state.session.newIds = [];
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  for (const id of ids) {
    const badge = page.locator('.matching-grid > div').first().locator(`[data-entry-id="${id}"] .entry-language`);
    const label = contrastLanguageLabel(courses.bengali, itemMap[id]);
    if (label) await expect(badge).toHaveText(label);
    else await expect(badge).toHaveCount(0);
  }
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/language-badges-${testInfo.project.name}-${width}.png` });
  }
  await answer(page);
  await expect(page.locator('.complete-screen')).toBeVisible();
});

test('Hebrew Rush keeps five RTL/LTR pairs and supports right-first matches', async ({ page }, testInfo) => {
  await seed(page, { ...initialState(), courseId: course.id });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('button', { name: /词汇 Rush/ }).click();
  const left = page.locator('.rush-grid > div').first();
  const right = page.locator('.rush-grid > div').last();
  await expect(left.locator('button')).toHaveCount(5);
  await expect(page.locator('.entry-language')).toHaveCount(0);
  const id = await right.locator('button').first().getAttribute('data-entry-id');
  await right.locator('button').first().click();
  await left.locator(`[data-entry-id="${id}"]`).click();
  await expect(page.locator('.rush-score > span').first()).toHaveText('1');
  await expect(left.locator('button').first()).toHaveAttribute('dir', 'rtl');
  await expect(right.locator('button').first()).toHaveAttribute('dir', 'ltr');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/hebrew-rush-${testInfo.project.name}-${width}.png` });
  }
  await page.getByRole('button', { name: '退出 Rush', exact: true }).click();
  await page.getByRole('button', { name: '退出挑战', exact: true }).click();
});

test('Hebrew speech uses explicit pointed words and accepts legacy iw voices but no other language', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true,
      value: class { text: string; constructor(text: string) { this.text = text; } },
    });
    let voices = [{ lang: 'en-US', localService: true }, { lang: 'ar-IL', localService: true }];
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => voices,
      cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => {
        if (!utterance.voice?.lang.startsWith('iw')) throw new Error('Wrong language voice');
        Object.assign(window, { spokenHebrew: { text: utterance.text, language: utterance.lang, voice: utterance.voice.lang } });
        setTimeout(() => utterance.onend?.({} as SpeechSynthesisEvent), 0);
      },
    });
    Object.assign(window, { addHebrewVoice: () => {
      voices = [...voices, { lang: 'iw-IL', localService: true }];
      speech.dispatchEvent(new Event('voiceschanged'));
    } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await seed(page, { ...initialState(), courseId: course.id });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.locator('[data-knowledge-id="he-word-street"]').click();
  await expect(page.getByRole('button', { name: '合成语音', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '真人发音', exact: true })).toHaveCount(0);
  const online = new URL((await page.getByRole('link', { name: '在线听希伯来语', exact: true }).getAttribute('href'))!);
  expect(online.searchParams.get('sl')).toBe('he');
  expect(online.searchParams.get('text')).toBe(itemMap['he-word-street'].pronunciation!.speech!.text);
  await page.evaluate(() => (window as unknown as { addHebrewVoice: () => void }).addHebrewVoice());
  await page.getByRole('button', { name: '合成语音', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { spokenHebrew: object }).spokenHebrew)).toEqual({
    text: itemMap['he-word-street'].pronunciation!.speech!.text, language: 'he', voice: 'iw-IL',
  });
  await page.keyboard.press('Escape');
  await page.locator('[data-knowledge-id="he-vet"]').click();
  await expect(page.locator('.knowledge-detail .pronunciation-control')).toHaveCount(0);
});
