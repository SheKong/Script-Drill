import { expect, test, type Page } from '@playwright/test';
import { courses, itemMap } from '../src/data';
import { acceptedTypedAnswers, createSession, makeExercise, makeMatch, normalizeAnswer, trained } from '../src/lib/engine';
import { initialState } from '../src/lib/storage';
import type { AppState } from '../src/types';
import { matchesLanguages } from '../src/lib/languages';

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
      await page.locator('.matching-grid > div').first().locator(`[data-entry-id="${pair.id}"]`).click();
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

test('all Bengali diacritic transcriptions accept plain letters in real typing exercises', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  const targets = course.items.filter(item => item.kind !== 'rule' && /[^ -~]/.test(item.roman));
  expect(targets.length).toBeGreaterThanOrEqual(58);
  const state = { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } };
  state.session = createSession(state, 'extra', course.extraUnits![0].id);
  state.session!.queue = targets.map(item => makeExercise(item, 'type', course, {}));
  state.session!.newIds = [];
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  for (const [index, item] of targets.entries()) {
    const plain = normalizeAnswer(item.roman);
    await expect(page.locator('.question-display')).toContainText(item.glyph);
    await expect(page.locator('.accepted-answers')).toHaveCount(0);
    await expect(page.locator('#transcription-format')).toContainText('普通英文字母即可');
    await page.getByRole('textbox', { name: '转写', exact: true }).fill(plain.toUpperCase());
    await page.getByRole('button', { name: '检查答案', exact: true }).click();
    await expect(page.locator('.quiz-footer')).toHaveClass(/feedback-correct/);
    const shown = await page.locator('.accepted-answers bdi').allTextContents();
    expect(shown).toEqual(acceptedTypedAnswers(item));
    expect(shown).toContain(plain);
    await noOverflow(page);
    if (item.id === 'bn-anusvara' || item.id === 'bn-word-coxs-bazar') {
      await page.screenshot({ path: `.local/screenshots/typing-${item.id}-${testInfo.project.name}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: '继续', exact: true }).click();
    if (index < targets.length - 1) {
      await expect.poll(async () => (await stored(page)).session?.index).toBe(index + 1);
    }
  }
  const saved = await stored(page);
  expect(saved.session).toBeUndefined();
  expect(saved.history.at(-1)?.correct).toBe(targets.length);
  expect(saved.progress['bn-anusvara'].modes).toContain('type');
  expect(saved.progress['bn-anusvara'].wrong).toBe(0);
});

test('accepted inputs appear in details and hints, and hints still count as assisted answers', async ({ page }, testInfo) => {
  const state = { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } };
  state.session = createSession(state, 'extra', course.extraUnits![0].id);
  state.session!.queue = [makeExercise(itemMap['bn-anusvara'], 'type', course, {})];
  state.session!.newIds = [];
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  await expect(page.locator('.accepted-answers')).toHaveCount(0);
  await page.getByRole('button', { name: '想一想', exact: true }).click();
  await expect(page.locator('.hint-content .accepted-answers')).toBeVisible();
  expect(await page.locator('.hint-content .accepted-answers bdi').allTextContents()).toEqual(['ṁ', 'm', 'ng']);
  await page.getByRole('textbox', { name: '转写', exact: true }).fill('m');
  await page.getByRole('button', { name: '检查答案', exact: true }).click();
  await expect(page.locator('.quiz-footer')).toHaveClass(/feedback-correct/);
  await page.getByRole('button', { name: '继续', exact: true }).click();
  const saved = await stored(page);
  expect(saved.progress['bn-anusvara'].modes).not.toContain('type');
  await page.getByRole('button', { name: '回到学习路径', exact: true }).click();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索知识' }).fill('ং');
  await page.locator('.knowledge-tile').filter({ has: page.getByText('ং', { exact: true }) }).click();
  expect(await page.locator('.accepted-answers bdi').allTextContents()).toEqual(['ṁ', 'm', 'ng']);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/typing-details-${testInfo.project.name}-${width}.png` });
  }
});

test('Bengali details teach the same standard as quizzes and keep map names separate', async ({ page }, testInfo) => {
  await seed(page, { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('checkbox', { name: '阿萨姆语', exact: true }).uncheck();
  for (const [glyph, roman, ipa] of [['ঈ', 'ī', '/i/'], ['য', 'j̱', '/dʒ/'], ['ঢাকা', 'ḍhākā', '/ɖʱaka/']]) {
    await page.getByRole('textbox', { name: '搜索知识' }).fill(glyph);
    await page.locator('.knowledge-tile').filter({ has: page.getByText(glyph, { exact: true }) }).click();
    const readings = page.locator('.reading-grid');
    await expect(readings).toContainText('UNGEGN');
    await expect(readings.locator('strong').first()).toHaveText(roman);
    await expect(readings).toContainText(ipa);
    await expect(readings).not.toContainText('教学转写');
    await expect(readings).not.toContainText('读音转写');
    if (glyph === 'ঢাকা') {
      await expect(page.locator('.conventional-names')).toContainText('Dhaka / Dacca');
      await expect(page.locator('.segments')).toContainText('ḍhā');
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow(page);
      if (glyph === 'ঢাকা') await page.screenshot({ path: `.local/screenshots/bengali-ungegn-${testInfo.project.name}-${width}.png` });
    }
    await page.keyboard.press('Escape');
  }
});

test('Bengali word recordings show the matching text, speaker and per-file license', async ({ page }) => {
  const examples = [
    ['নাম', 'আফতাবুজ্জামান', 'CC BY-SA 4.0'],
    ['দোকান', 'Yahya', 'CC BY-SA 4.0'],
    ['বাংলা', 'Titodutta', 'CC0'],
    ['বাংলাদেশ', 'Titodutta', 'CC0'],
    ['ঢাকা', 'Yahya', 'CC BY-SA 4.0'],
    ['নগর', 'Yahya', 'CC BY-SA 4.0'],
    ['গ্রাম', 'Yahya', 'CC BY-SA 4.0'],
    ['রাস্তা', 'Yahya', 'CC BY-SA 4.0'],
  ];
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      Object.assign(window, { bengaliRecordingSrc: this.src });
      setTimeout(() => this.dispatchEvent(new Event('playing')), 0);
      return Promise.resolve();
    };
  });
  await seed(page, { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const [glyph, speaker, license] of examples) {
    await page.getByRole('textbox', { name: '搜索知识' }).fill(glyph);
    await page.locator('.knowledge-tile').filter({ has: page.getByText(glyph, { exact: true }) }).click();
    await expect(page.getByRole('button', { name: '真人发音', exact: true })).toBeVisible();
    await expect(page.locator('.audio-credit')).toContainText(speaker);
    await expect(page.locator('.audio-credit')).toContainText(license);
    await expect(page.locator('.detail-sources')).toContainText('Wikimedia Commons');
    if (glyph === 'নাম') {
      await page.getByRole('button', { name: '真人发音', exact: true }).click();
      await expect(page.getByRole('button', { name: '停止发音', exact: true })).toBeVisible();
      expect(await page.evaluate(() => (window as unknown as { bengaliRecordingSrc: string }).bengaliRecordingSrc))
        .toContain('/audio/bengali/bn-word-naam.mp3');
    }
    await page.keyboard.press('Escape');
  }
});

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
    if (selector.includes('city')) {
      await expect.poll(() => page.locator('.knowledge-tile [data-map-city]').evaluate(node =>
        node.getBoundingClientRect().width * devicePixelRatio * (visualViewport?.scale || 1))).toBeCloseTo(5, 1);
      const redPixels = await page.locator('.knowledge-tile .place-map svg').evaluate(async svg => {
        const image = new Image();
        const clone = svg.cloneNode(true) as SVGElement;
        const bounds = svg.getBoundingClientRect();
        clone.setAttribute('width', String(bounds.width)); clone.setAttribute('height', String(bounds.height));
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bounds.width * devicePixelRatio);
        canvas.height = Math.round(bounds.height * devicePixelRatio);
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let red = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 150 && data[i + 1] < 120 && data[i + 2] < 120 && data[i + 3] > 100) red++;
        }
        return red;
      });
      // A 5-screen-pixel dot has a small red core inside its white stroke.
      expect(redPixels).toBeGreaterThan(4);
    }
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
  await expect(page.locator('.voice-environment')).toContainText('已有录音仍可播放，也可在线收听');
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索知识' }).fill('চা');
  await page.locator('.knowledge-tile').filter({ has: page.getByText('চা', { exact: true }) }).click();
  await expect(page.getByRole('button', { name: '合成语音', exact: true })).toHaveCount(0);
  const online = page.getByRole('link', { name: '在线听孟加拉语', exact: true });
  const url = new URL((await online.getAttribute('href'))!);
  expect(url.searchParams.get('text')).toBe('চা');
  expect(url.searchParams.get('sl')).toBe('bn');
  await page.evaluate(() => (window as unknown as { addBengaliVoice: () => void }).addBengaliVoice());
  await page.getByRole('button', { name: '合成语音', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { spoken: object }).spoken)).toEqual({
    text: 'চা', lang: 'bn', voice: 'bn-BD',
  });
  await page.keyboard.press('Escape');
  await page.getByRole('textbox', { name: '搜索知识' }).fill('◌ি');
  await page.locator('.knowledge-tile').filter({ has: page.getByText('◌ি', { exact: true }) }).click();
  await expect(page.locator('.knowledge-detail .pronunciation-control')).toHaveCount(0);
});

test('matching accepts either starting column, replaces same-side choices, and records the left target on a right-first error', async ({ page }) => {
  const state: AppState = { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } };
  state.session = createSession(state, 'extra', course.extraUnits![0].id)!;
  const question = makeMatch(['dhaka', 'chattogram', 'cumilla', 'sylhet', 'khulna'].map(id => itemMap[`bn-word-${id}`]))!;
  state.session.queue = [question];
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  const left = page.locator('.matching-grid > div').first();
  const right = page.locator('.matching-grid > div').last();
  const [a, b, c, d] = question.pairs!;
  await right.locator(`[data-entry-id="${a.id}"]`).click();
  await right.locator(`[data-entry-id="${b.id}"]`).click();
  await expect(page.locator('.matching-grid [aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.matching-grid .matched')).toHaveCount(0);
  await right.locator(`[data-entry-id="${b.id}"]`).click();
  await expect(page.locator('.matching-grid [aria-pressed="true"]')).toHaveCount(0);
  await right.locator(`[data-entry-id="${b.id}"]`).click();
  await left.locator(`[data-entry-id="${b.id}"]`).click();
  await expect(page.locator('.matching-grid .matched')).toHaveCount(2);
  await left.locator(`[data-entry-id="${a.id}"]`).click();
  await left.locator(`[data-entry-id="${c.id}"]`).click();
  await expect(page.locator('.matching-grid [aria-pressed="true"]')).toHaveCount(1);
  await right.locator(`[data-entry-id="${c.id}"]`).click();
  await right.locator(`[data-entry-id="${d.id}"]`).click();
  await left.locator(`[data-entry-id="${a.id}"]`).click();
  await expect(left.locator(`[data-entry-id="${a.id}"]`)).toHaveClass(/wrong/);
  for (const pair of question.pairs!.filter(pair => ![b.id, c.id].includes(pair.id))) {
    await right.locator(`[data-entry-id="${pair.id}"]`).click();
    await left.locator(`[data-entry-id="${pair.id}"]`).click();
  }
  await expect(page.locator('.feedback-title')).toContainText('易混项会再出现');
  await page.getByRole('button', { name: '继续', exact: true }).click();
  expect((await stored(page)).session!.outcomes[a.id].wrong).toBe(1);
  expect((await stored(page)).session!.outcomes[d.id].wrong).toBe(0);
});

test('Rush accepts right-first pairs and never treats two same-column clicks as a match', async ({ page }) => {
  await seed(page, { ...initialState(), courseId: course.id });
  await page.clock.install();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('button', { name: /简单 Rush/ }).click();
  const left = page.locator('.rush-grid > div').first();
  const right = page.locator('.rush-grid > div').last();
  await right.locator('button').nth(0).click();
  await right.locator('button').nth(1).click();
  await expect(page.locator('.rush-grid [aria-pressed="true"]')).toHaveCount(1);
  await expect(page.locator('.rush-score > span').first()).toHaveText('0');
  const id = await right.locator('button').nth(1).getAttribute('data-entry-id');
  await left.locator(`[data-entry-id="${id}"]`).click();
  await expect(page.locator('.rush-score > span').first()).toHaveText('1');
  await expect(page.locator('.rush-grid [aria-pressed="true"]')).toHaveCount(0);
  await page.clock.fastForward(350);
  await left.locator('button').nth(0).click();
  await left.locator('button').nth(1).click();
  await expect(page.locator('.rush-score > span').first()).toHaveText('1');
  const second = await left.locator('button').nth(1).getAttribute('data-entry-id');
  await right.locator(`[data-entry-id="${second}"]`).click();
  await expect(page.locator('.rush-score > span').first()).toHaveText('2');
  await page.clock.fastForward(350);
  const leftId = await left.locator('button').first().getAttribute('data-entry-id');
  const wrongId = await right.locator('button').evaluateAll((nodes, id) =>
    nodes.find(node => node.getAttribute('data-entry-id') !== id)!.getAttribute('data-entry-id'), leftId);
  await right.locator(`[data-entry-id="${wrongId}"]`).click();
  await left.locator(`[data-entry-id="${leftId}"]`).click();
  await expect(page.locator('.rush-score > span').first()).toHaveText('1');
  await expect(page.locator('.rush-grid .wrong')).toHaveCount(2);
  await page.clock.fastForward(500);
  await expect(page.locator('.rush-grid .wrong')).toHaveCount(0);
  await right.locator(`[data-entry-id="${leftId}"]`).click();
  await left.locator(`[data-entry-id="${leftId}"]`).click();
  await expect(page.locator('.rush-score > span').first()).toHaveText('2');
});

test('Assamese is displayed after extras but opens as a parallel branch with a nonblocking prerequisite notice', async ({ page }, testInfo) => {
  await seed(page, { ...initialState(), courseId: course.id });
  const branch = page.locator('.course-branch');
  await expect(branch.getByRole('heading', { name: '课程分支：阿萨姆语' })).toBeVisible();
  await expect(branch.locator('.branch-notice')).toBeVisible();
  await expect(branch.locator('.branch-lesson-row').first()).toBeEnabled();
  await expect(page.locator('.extra-lesson-row').first()).toBeDisabled();
  expect(await branch.evaluate(node => !!(document.querySelector('.extra-lessons')!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await branch.scrollIntoViewIfNeeded();
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/assamese-branch-${testInfo.project.name}-${width}.png` });
  }
  await branch.locator('.branch-lesson-row').first().click();
  expect((await stored(page)).session!.mode).toBe('branch');
  await expect(page.locator('.detail-symbol > span')).toHaveAttribute('lang', 'as');
  await finish(page);
  expect((await stored(page)).progress['bn-maps']).toBeUndefined();
  expect((await stored(page)).earlyExtraUnlocks).toBeUndefined();
  await page.getByRole('button', { name: '继续下一小课', exact: true }).click();
  await expect(page.locator('.detail-symbol > span')).toHaveText('ৰ');
  await expect(page.locator('.detail-symbol > span')).toHaveAttribute('lang', 'as');
});

test('language multiselect persists, includes shared knowledge once, and scopes both Rush pools', async ({ page }, testInfo) => {
  await page.addInitScript(state => {
    if (localStorage.getItem('script-drill:v1') === null) {
      localStorage.setItem('script-drill:v1', JSON.stringify(state));
    }
  }, { ...initialState(), courseId: course.id, earlyExtraUnlocks: { bengali: true } });
  await page.goto('/');
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const selection of [['bn'], ['as'], ['bn', 'as'], []]) {
    await page.getByRole('checkbox', { name: '孟加拉语', exact: true }).setChecked(selection.includes('bn'));
    await page.getByRole('checkbox', { name: '阿萨姆语', exact: true }).setChecked(selection.includes('as'));
    const expected = course.items.filter(item => matchesLanguages(course, item, selection)).map(item => item.id);
    expect(await page.locator('.knowledge-tile').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-knowledge-id')))).toEqual(expected);
    if (!selection.length) {
      await expect(page.getByRole('button', { name: /简单 Rush/ })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /词汇 Rush/ })).toHaveCount(0);
      continue;
    }
    for (const label of ['简单 Rush', '词汇 Rush']) {
      await page.getByRole('button', { name: new RegExp(label) }).click();
      const ids = await page.locator('.rush-grid > div').first().locator('button').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-entry-id')!));
      expect(ids.every(id => expected.includes(id))).toBe(true);
      await page.getByRole('button', { name: '退出 Rush', exact: true }).click();
      await page.getByRole('button', { name: '退出挑战', exact: true }).click();
    }
  }
  await page.getByRole('checkbox', { name: '阿萨姆语', exact: true }).check();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/assamese-library-${testInfo.project.name}-${width}.png` });
  }
  await page.reload();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: '阿萨姆语', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '孟加拉语', exact: true })).not.toBeChecked();
});

test('Indian Bengali and Assamese words use India maps, whole shaped glyphs and language-correct listening', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: Object.assign(new EventTarget(), {
      getVoices: () => [{ lang: 'bn-BD', localService: true }], cancel: () => {},
    }) });
  });
  await seed(page, { ...initialState(), courseId: course.id });
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const id of ['bn-word-durgapur', 'as-word-guwahati']) {
    await page.locator(`[data-knowledge-id="${id}"]`).click();
    const symbol = page.locator('.detail-symbol > span');
    expect(await symbol.evaluate(node => node.childElementCount)).toBe(0);
    await expect(symbol).toHaveAttribute('lang', id.startsWith('as-') ? 'as' : 'bn');
    await expect(page.locator('.knowledge-detail .place-map figcaption')).toContainText('印度');
    const point = page.locator('.knowledge-detail [data-map-city]');
    expect(Number(await point.getAttribute('cx'))).toBeGreaterThan(0);
    expect(Number(await point.getAttribute('cx'))).toBeLessThan(180);
    const link = page.getByRole('link', { name: id.startsWith('as-') ? '在线听阿萨姆语' : '在线听孟加拉语', exact: true });
    expect(new URL((await link.getAttribute('href'))!).searchParams.get('sl')).toBe(id.startsWith('as-') ? 'as' : 'bn');
    if (id.startsWith('as-')) await expect(page.getByRole('button', { name: '合成语音', exact: true })).toHaveCount(0);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await noOverflow(page);
      await page.screenshot({ path: `.local/screenshots/india-${id}-${testInfo.project.name}-${width}.png` });
    }
    await page.keyboard.press('Escape');
  }
  expect(await page.evaluate(async () => {
    await document.fonts.load('48px "Noto Sans Bengali"');
    const canvas = document.createElement('canvas'); canvas.width = 500; canvas.height = 100;
    const context = canvas.getContext('2d')!;
    context.font = '48px "Noto Sans Bengali"';
    context.fillText('ৰ ৱ ব্ৰ গুৱাহাটী', 10, 65);
    return context.getImageData(0, 0, 500, 100).data.filter((value, index) => index % 4 === 3 && value > 0).length;
  })).toBeGreaterThan(500);
});
