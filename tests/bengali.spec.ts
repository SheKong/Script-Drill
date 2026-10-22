import { expect, test, type Page } from '@playwright/test';
import { courses, itemMap } from '../src/data';
import { createSession, makeExercise, makeMatch, trained } from '../src/lib/engine';
import { initialState } from '../src/lib/storage';
import type { AppState } from '../src/types';

const course = courses.bengali;
async function stored(page: Page): Promise<AppState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('script-drill:v1')!));
}
async function seed(page: Page, state: AppState) {
  await page.addInitScript(state => localStorage.setItem('script-drill:v1', JSON.stringify(state)), state);
  await page.goto('/');
}
async function switchCourse(page: Page, title: string) {
  await page.locator('.course-current').click();
  await page.getByRole('menuitem', { name: new RegExp(title) }).click();
}
async function answer(page: Page) {
  const state = await stored(page);
  const question = state.session!.queue[state.session!.index];
  if (question.kind === 'intro') {
    await page.getByRole('button', { name: '开始练习', exact: true }).click();
  } else if (question.kind === 'match') {
    for (const pair of question.pairs!) {
      await page.locator('.matching-grid > div').first().getByRole('button', { name: pair.left, exact: true }).click();
      await page.locator('.matching-grid > div').last().getByRole('button', { name: pair.right, exact: true }).click();
    }
    await page.getByRole('button', { name: '继续', exact: true }).click();
  } else {
    if (question.kind === 'type') {
      await page.getByRole('textbox', { name: '转写', exact: true }).fill(question.answer.replaceAll('ô', 'aw'));
    } else {
      await page.locator('.answer-options > button').nth(question.options.findIndex(option => option.id === question.answer)).click();
    }
    await page.getByRole('button', { name: '检查答案', exact: true }).click();
    await expect(page.locator('.feedback-copy')).toBeVisible();
    await page.getByRole('button', { name: '继续', exact: true }).click();
  }
  await expect.poll(async () => (await stored(page)).session?.index ?? -1).not.toBe(state.session!.index);
}
async function finish(page: Page) {
  for (let step = 0; step < 70 && (await stored(page)).session; step++) await answer(page);
  expect((await stored(page)).session).toBeUndefined();
  await expect(page.locator('.complete-screen')).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
}

test('Bengali is an independent usable course and teaches its first lessons through real answers', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await switchCourse(page, '孟加拉语文字');
  await expect(page.getByRole('heading', { name: /^孟加拉语文字/ })).toBeVisible();
  await expect(page.locator('.course-description')).not.toContainText('泰语');
  await expect(page.locator('.script-style-control')).toHaveCount(0);
  await page.screenshot({ path: `.local/screenshots/bengali-home-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await expect(page.locator('.explanation')).toContainText('固有元音');
  expect((await stored(page)).session!.queue.filter(question => question.itemId === 'bn-inherent' && question.kind !== 'intro')).toHaveLength(1);
  await finish(page);
  expect(trained('bn-inherent', (await stored(page)).progress)).toBe(true);
  for (let lesson = 0; lesson < 2; lesson++) {
    await page.getByRole('button', { name: '继续下一小课', exact: true }).click();
    await finish(page);
  }
  const state = await stored(page);
  expect(trained('bn-k', state.progress)).toBe(true);
  expect(trained('bn-n', state.progress)).toBe(true);
  expect(state.history).toHaveLength(3);
  expect(errors).toEqual([]);
});

test('early city access warns once, can be cancelled, persists, and never unlocks mainline prerequisites', async ({ page }, testInfo) => {
  await page.goto('/');
  await switchCourse(page, '孟加拉语文字');
  await expect(page.locator('.extra-lesson-row').first()).toBeDisabled();
  await page.getByRole('button', { name: '提前解锁', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('推荐先学完孟加拉语文字主线');
  await page.getByRole('button', { name: '先学主线', exact: true }).click();
  expect((await stored(page)).earlyExtraUnlocks?.bengali).toBeUndefined();
  await expect(page.locator('.extra-lesson-row').first()).toBeDisabled();
  await page.getByRole('button', { name: '提前解锁', exact: true }).click();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/bengali-unlock-${testInfo.project.name}-${width}.png` });
  }
  await page.getByRole('button', { name: '仍然解锁', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: '提前解锁', exact: true })).toHaveCount(0);
  await expect(page.locator('.extra-lesson-row').first()).toBeEnabled();
  await switchCourse(page, '泰语文字');
  await expect(page.locator('.extra-lesson-row').first()).toBeDisabled();
  await switchCourse(page, '孟加拉语文字');
  await page.locator('.extra-lesson-row').first().click();
  const first = await stored(page);
  expect(first.session!.mode).toBe('extra');
  expect(first.session!.queue[0].itemId).toBe('bn-word-dhaka');
  await expect(page.locator('.question-display')).toContainText('ঢাকা');
  await expect(page.getByText('达卡', { exact: true })).toHaveCount(0);
  await finish(page);
  const state = await stored(page);
  expect(trained('bn-word-dhaka', state.progress)).toBe(true);
  expect(state.progress['bn-retro-dh']).toBeUndefined();
  expect(state.completedUnitReviews?.[course.units[0].id]).toBeUndefined();
  expect(state.earlyExtraUnlocks).toEqual({ bengali: true });
  await page.getByRole('button', { name: '回到学习路径', exact: true }).click();
  await expect(page.getByRole('button', { name: '开始学习', exact: true })).toBeVisible();
});

test('local Bengali fonts shape whole words and offline maps show the country and city points without clipping', async ({ page }, testInfo) => {
  await page.route(/^https:\/\//, route => route.abort());
  await seed(page, { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const [glyph, selector] of [['বাংলাদেশ', '[data-map-region]'], ['ময়মনসিংহ', '[data-map-city]']]) {
    await page.getByRole('textbox', { name: '搜索知识' }).fill(glyph);
    await page.locator('.knowledge-tile').filter({ has: page.getByText(glyph, { exact: true }) }).click();
    const symbol = page.locator('.detail-symbol > span');
    await expect(symbol).toHaveText(glyph);
    await expect(symbol).toHaveCSS('font-family', /Noto Sans Bengali/);
    expect(await symbol.evaluate(node => node.childElementCount)).toBe(0);
    const svg = page.locator('.knowledge-detail .place-map svg');
    await expect(svg.locator(selector)).toBeVisible();
    const pixels = await svg.evaluate(async svg => {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 260;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0, 180, 260);
      const data = context.getImageData(0, 0, 180, 260).data;
      let red = 0, ink = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 40) ink++;
        if (data[i] > 150 && data[i + 1] < 120 && data[i + 2] < 120 && data[i + 3] > 40) red++;
      }
      const bounds = (svg.querySelector('path') as SVGGraphicsElement).getBBox();
      return { red, ink, bounds: { x: bounds.x, y: bounds.y, right: bounds.x + bounds.width, bottom: bounds.y + bounds.height } };
    });
    expect(pixels.red).toBeGreaterThan(8);
    expect(pixels.ink).toBeGreaterThan(400);
    expect(pixels.bounds.x).toBeGreaterThan(0);
    expect(pixels.bounds.y).toBeGreaterThan(0);
    expect(pixels.bounds.right).toBeLessThan(180);
    expect(pixels.bounds.bottom).toBeLessThan(260);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow(page);
      await page.screenshot({ path: `.local/screenshots/bengali-${selector.includes('city') ? 'city' : 'country'}-${testInfo.project.name}-${width}.png` });
    }
    await page.keyboard.press('Escape');
  }
  const ink = await page.evaluate(async () => {
    await document.fonts.load('48px "Noto Sans Bengali"');
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width = 360; canvas.height = 130;
    const context = canvas.getContext('2d')!;
    return ['কি', 'কু', 'কূ', 'ক্র', 'জ্ঞ', 'ক্ষ', 'ঢাকা', 'ময়মনসিংহ'].map(text => {
      context.clearRect(0, 0, 360, 130); context.font = '48px "Noto Sans Bengali"'; context.fillText(text, 10, 80);
      const pixels = context.getImageData(0, 0, 360, 130).data;
      let count = 0, hash = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) {
        count++; hash = (hash + i * pixels[i]) % 2147483647;
      }
      return { count, hash };
    });
  });
  expect(ink.every(sample => sample.count > 100)).toBe(true);
  expect(new Set(ink.map(sample => sample.hash)).size).toBe(ink.length);
});

test('Bengali word reading, reverse, accessible typing and meaning are usable at all widths', async ({ page }, testInfo) => {
  const state: AppState = { ...initialState(), courseId: course.id };
  const word = itemMap['bn-word-college'];
  state.progress[word.id] = { introduced: true, correct: 3, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString() };
  state.session = createSession(state, 'custom', undefined, [word.id])!;
  state.session.queue = ['read', 'reverse', 'type', 'meaning'].map(kind =>
    makeExercise(word, kind as 'read' | 'reverse' | 'type' | 'meaning', course, state.progress));
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  for (const kind of ['read', 'reverse', 'type', 'meaning']) {
    expect((await stored(page)).session!.queue[(await stored(page)).session!.index].kind).toBe(kind);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow(page);
      const wrapped = await page.locator('.answer-option .bengali').evaluateAll(nodes => nodes.filter(node =>
        node.getBoundingClientRect().height > parseFloat(getComputedStyle(node).lineHeight) + 1,
      ).map(node => node.textContent));
      expect(wrapped).toEqual([]);
      await page.screenshot({ path: `.local/screenshots/bengali-${kind}-${testInfo.project.name}-${width}.png` });
    }
    await answer(page);
  }
  await expect(page.locator('.complete-screen')).toBeVisible();
  expect((await stored(page)).history.at(-1)?.correct).toBe(4);
});

test('long Bengali names fit stable five-pair boards and vocabulary Rush remains playable', async ({ page }, testInfo) => {
  const state: AppState = { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } };
  const words = course.items.filter(item => item.extra).sort((a, b) => b.glyph.length - a.glyph.length).slice(0, 5);
  for (const word of words) state.progress[word.id] = {
    introduced: true, correct: 3, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString(),
  };
  state.session = createSession(state, 'custom', undefined, [words[0].id])!;
  state.session.queue = [makeMatch(words)!];
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    const clipped = await page.locator('.matching-grid button > span').evaluateAll(nodes => nodes.filter(node => {
      const child = node.getBoundingClientRect(), parent = node.parentElement!.getBoundingClientRect();
      return child.x < parent.x + 2 || child.right > parent.right - 2 || child.y < parent.y + 2 || child.bottom > parent.bottom - 2;
    }).map(node => node.textContent));
    expect(clipped).toEqual([]);
    await page.screenshot({ path: `.local/screenshots/bengali-match-${testInfo.project.name}-${width}.png` });
  }
  await finish(page);
  await page.getByRole('button', { name: '回到学习路径', exact: true }).click();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('button', { name: /词汇 Rush/ }).click();
  const left = page.locator('.rush-grid > div').first().locator('button');
  const right = page.locator('.rush-grid > div').last().locator('button');
  for (let step = 0; step < 6; step++) {
    await expect(left).toHaveCount(5);
    await expect(right).toHaveCount(5);
    const id = await left.first().getAttribute('data-entry-id');
    await left.first().click();
    await page.locator('.rush-grid > div').last().locator(`[data-entry-id="${id}"]`).click();
    await page.waitForTimeout(350);
  }
  await expect(page.locator('.rush-score > span').first()).toHaveText('6');
  await page.screenshot({ path: `.local/screenshots/bengali-rush-${testInfo.project.name}.png` });
  await page.getByRole('button', { name: '退出 Rush', exact: true }).click();
  await page.getByRole('button', { name: '退出挑战', exact: true }).click();
});

test('Bengali audio uses explicit whole words and matching bn voices, never an English substitute or a vowel placeholder', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true,
      value: class {
        text: string;
        constructor(text: string) { this.text = text; }
      },
    });
    let voices = [{ lang: 'en-US', localService: true }];
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => voices,
      cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => {
        if (!utterance.voice?.lang.startsWith('bn')) throw new Error('Wrong language voice');
        Object.assign(window, { spoken: { text: utterance.text, lang: utterance.lang, voice: utterance.voice.lang } });
        setTimeout(() => utterance.onend?.({} as SpeechSynthesisEvent), 0);
      },
    });
    Object.assign(window, { addBengaliVoice: () => {
      voices = [...voices, { lang: 'bn-BD', localService: true }];
      speech.dispatchEvent(new Event('voiceschanged'));
    } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await seed(page, { ...initialState(), courseId: course.id });
  await expect(page.locator('.voice-help')).toHaveCount(0);
  await expect(page.locator('.voice-environment')).toContainText('可在词条中在线收听');
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索知识' }).fill('ঢাকা');
  await page.locator('.knowledge-tile').filter({ has: page.getByText('ঢাকা', { exact: true }) }).click();
  await expect(page.getByRole('button', { name: '合成语音', exact: true })).toHaveCount(0);
  const online = page.getByRole('link', { name: '在线听孟加拉语', exact: true });
  const url = new URL((await online.getAttribute('href'))!);
  expect(url.searchParams.get('text')).toBe('ঢাকা');
  expect(url.searchParams.get('sl')).toBe('bn');
  await page.evaluate(() => (window as unknown as { addBengaliVoice: () => void }).addBengaliVoice());
  await page.getByRole('button', { name: '合成语音', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { spoken: object }).spoken)).toEqual({
    text: 'ঢাকা', lang: 'bn', voice: 'bn-BD',
  });
  await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: '搜索知识' }).fill('◌ি');
  await page.locator('.knowledge-tile').filter({ has: page.getByText('◌ি', { exact: true }) }).click();
  await expect(page.locator('.knowledge-detail .pronunciation-control')).toHaveCount(0);
});
