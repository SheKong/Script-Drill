import { expect, test, type Page } from '@playwright/test';
import { courses, itemMap } from '../src/data';
import { createSession, makeExercise, makeMatch, reading } from '../src/lib/engine';
import { initialState } from '../src/lib/storage';
import type { AppState } from '../src/types';

function completed(): AppState {
  const state = initialState();
  state.completedUnitReviews = {};
  for (const unit of courses.thai.units) {
    state.completedUnitReviews[unit.id] = true;
    for (const id of unit.items) state.progress[id] = {
      introduced: true, correct: 5, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString(),
    };
  }
  return state;
}
async function seed(page: Page, state: AppState) {
  await page.addInitScript(state => localStorage.setItem('script-drill:v1', JSON.stringify(state)), state);
  await page.goto('/');
}
async function stored(page: Page): Promise<AppState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('script-drill:v1')!));
}
async function chooseCorrect(page: Page) {
  const state = await stored(page);
  const question = state.session!.queue[state.session!.index];
  await page.locator('.answer-options > button').nth(question.options.findIndex(option => option.id === question.answer)).click();
  await page.getByRole('button', { name: '检查答案', exact: true }).click();
  await page.getByRole('button', { name: '继续', exact: true }).click();
}
async function overflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('foundations precede letter labels; unit reviews are explicit and contain five-pair and input exercises', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await expect(page.locator('.explanation')).toContainText('五个声调');
  await expect(page.locator('.explanation')).toContainText('本课不深入训练声调计算');
  const state = completed();
  delete state.completedUnitReviews![courses.thai.units[0].id];
  state.session = createSession(state, 'learn');
  expect(state.session!.queue.length).toBeGreaterThanOrEqual(30);
  expect(state.session!.stage).toBe('unit-review');
  expect(state.session!.queue.some(question => question.kind === 'type')).toBe(true);
  const matchIndex = state.session!.queue.findIndex(question => question.kind === 'match');
  state.session!.index = matchIndex;
  await page.evaluate(state => localStorage.setItem('script-drill:v1', JSON.stringify(state)), state);
  await page.reload();
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  await expect(page.locator('.matching-grid > div').first().locator('button')).toHaveCount(5);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await overflow(page);
    await page.screenshot({ path: `.local/screenshots/unit-review-${width}.png` });
  }
});

test('finishing the final explicit lesson shows congratulations and all three post-course destinations', async ({ page }) => {
  const state = completed();
  const final = courses.thai.units.at(-1)!;
  delete state.completedUnitReviews![final.id];
  state.session = createSession(state, 'learn')!;
  state.session.queue = [makeExercise(itemMap['th-word-ban'], 'read', courses.thai, state.progress)];
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  await chooseCorrect(page);
  await expect(page.getByRole('heading', { name: '恭喜，泰语文字主线已完成！' })).toBeVisible();
  for (const name of ['记忆复习', '挑战 Rush', '地名额外课']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  expect((await stored(page)).completedUnitReviews![final.id]).toBe(true);
  await page.screenshot({ path: '.local/screenshots/course-complete.png' });
  await page.getByRole('button', { name: '地名额外课', exact: true }).click();
  await expect(page.locator('.extra-lesson-row').first()).toBeEnabled();
  await expect(page.getByRole('button', { name: /简单 Rush/ })).toBeVisible();
});

test('Rush is always five pairs, prevents same-slot farming, expires at two minutes and persists mode-specific scores', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.clock.install();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('button', { name: /简单 Rush/ }).click();
  const left = page.locator('.rush-grid > div').first().locator('button');
  const right = page.locator('.rush-grid > div').last().locator('button');
  for (let step = 0; step < 6; step++) {
    await expect(left).toHaveCount(5);
    await expect(right).toHaveCount(5);
    const id = await left.first().getAttribute('data-entry-id');
    const rightIndex = await right.evaluateAll((nodes, id) => nodes.findIndex(node => node.getAttribute('data-entry-id') === id), id);
    await left.first().click();
    await right.nth(rightIndex).click();
    expect(await left.first().getAttribute('data-entry-id')).not.toBe(await right.nth(rightIndex).getAttribute('data-entry-id'));
    await page.clock.fastForward(350);
  }
  await expect(page.locator('.rush-score > span').first()).toHaveText('6');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await overflow(page);
    await page.screenshot({ path: `.local/screenshots/rush-simple-${width}.png` });
  }
  await page.clock.fastForward(120000);
  await expect(page.getByRole('heading', { name: '两分钟，挑战完成' })).toBeVisible();
  await expect.poll(async () => (await stored(page)).rushBest?.['thai:simple']).toBe(6);
  expect((await stored(page)).rushBest?.['thai:vocabulary']).toBeUndefined();
  await page.getByRole('button', { name: '回到课程', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await expect(page.getByRole('button', { name: /简单 Rush/ })).toContainText('6');
  expect(errors).toEqual([]);
});

test('word Rush shows meaning and a map when applicable; quitting an unfinished run does not record a score', async ({ page }) => {
  await seed(page, completed());
  await page.getByRole('button', { name: /词汇 Rush/ }).click();
  const left = page.locator('.rush-grid > div').first().locator('button');
  const id = (await left.first().getAttribute('data-entry-id'))!;
  await left.first().click();
  await page.locator('.rush-grid > div').last().locator(`[data-entry-id="${id}"]`).click();
  await expect(page.locator('.rush-meaning')).toContainText(itemMap[id].meaning!);
  if (itemMap[id].place) await expect(page.locator('.rush-meaning svg')).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await overflow(page);
    await page.screenshot({ path: `.local/screenshots/rush-vocabulary-${width}.png` });
  }
  await page.getByRole('button', { name: '退出 Rush', exact: true }).click();
  await page.getByRole('button', { name: '退出挑战', exact: true }).click();
  expect((await stored(page)).rushBest?.['thai:vocabulary']).toBeUndefined();
});

test('local place maps render a country outline with a red region or city point at all screen sizes', async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await seed(page, completed());
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  for (const [query, selector] of [['เชียงใหม่', '[data-map-region]'], ['พัทยา', '[data-map-city]']]) {
    await page.getByRole('textbox', { name: '搜索知识' }).fill(query);
    await page.locator('.knowledge-tile').first().click();
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
      for (let n = 0; n < data.length; n += 4) {
        if (data[n + 3] > 40) ink++;
        if (data[n] > 150 && data[n + 1] < 120 && data[n + 2] < 120 && data[n + 3] > 40) red++;
      }
      const bounds = (svg.querySelector('path') as SVGGraphicsElement).getBBox();
      return { red, ink, bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height } };
    });
    expect(pixels.red).toBeGreaterThan(8);
    expect(pixels.ink).toBeGreaterThan(400);
    expect(pixels.bounds.x).toBeGreaterThan(0);
    expect(pixels.bounds.y).toBeGreaterThan(0);
    expect(pixels.bounds.x + pixels.bounds.width).toBeLessThan(180);
    expect(pixels.bounds.y + pixels.bounds.height).toBeLessThan(260);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await overflow(page);
      await page.screenshot({ path: `.local/screenshots/place-${selector.includes('city') ? 'city' : 'region'}-${width}.png` });
    }
    await page.keyboard.press('Escape');
  }
});

test('tone recognition exercises persist and show only one tone mark among vowel and spelling distractors', async ({ page }) => {
  const state = completed();
  state.session = createSession(state, 'custom', undefined, ['th-word-ban'])!;
  state.session.index = state.session.queue.findIndex(question => question.kind === 'mark');
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  await expect(page.getByRole('heading', { name: '这个词里，哪个是声调符号？' })).toBeVisible();
  await chooseCorrect(page);
  await expect(page.locator('.quiz-shell, .complete-screen').first()).toBeVisible();
});

test('long province names and their IPA fit in five fixed matching rows at 320px', async ({ page }, testInfo) => {
  const state = completed();
  const longest = courses.thai.items.filter(item => item.place)
    .sort((a, b) => reading(b).length - reading(a).length).slice(0, 10);
  state.session = createSession(state, 'custom', undefined, ['th-word-na'])!;
  state.session.queue = [makeMatch(longest.slice(0, 5))!, makeMatch(longest.slice(5))!];
  await page.setViewportSize({ width: 320, height: 900 });
  await seed(page, state);
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  for (let index = 0; index < 2; index++) {
    const clipped = await page.locator('.matching-grid button > span').evaluateAll(nodes => nodes.filter(node => {
      const child = node.getBoundingClientRect(), parent = node.parentElement!.getBoundingClientRect();
      return child.x < parent.x + 2 || child.right > parent.right - 2 || child.y < parent.y + 2 || child.bottom > parent.bottom - 2;
    }).map(node => node.textContent));
    expect(clipped).toEqual([]);
    await page.screenshot({ path: `.local/screenshots/long-places-${testInfo.project.name}-${index}.png` });
    const question = (await stored(page)).session!.queue[index];
    for (const pair of question.pairs!) {
      await page.locator('.matching-grid > div').first().getByRole('button', { name: pair.left, exact: true }).click();
      await page.locator('.matching-grid > div').last().getByRole('button', { name: pair.right, exact: true }).click();
    }
    await page.getByRole('button', { name: '继续', exact: true }).click();
  }
});
