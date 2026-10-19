import { expect, test, type Page } from '@playwright/test';
import type { AppState, Exercise } from '../src/types';
import { courses } from '../src/data';
import { createSession } from '../src/lib/engine';
import { initialState } from '../src/lib/storage';

async function stored(page: Page): Promise<AppState> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('script-drill:v1')!));
}
async function currentQuestion(page: Page): Promise<Exercise> {
  const state = await stored(page);
  return state.session!.queue[state.session!.index];
}
async function finishCurrent(page: Page, makeOneMistake = false) {
  let mistaken = false;
  for (let step = 0; step < 100; step++) {
    const state = await stored(page);
    if (!state.session) break;
    const q = state.session.queue[state.session.index];
    if (q.kind === 'intro') {
      await page.getByRole('button', { name: '开始练习', exact: true }).click();
    } else if (q.kind === 'match') {
      const left = page.locator('.matching-grid > div').nth(0);
      const right = page.locator('.matching-grid > div').nth(1);
      for (const pair of q.pairs!) {
        await left.getByRole('button', { name: pair.left, exact: true }).click();
        await right.getByRole('button', { name: pair.right, exact: true }).click();
      }
      await page.getByRole('button', { name: '继续', exact: true }).click();
    } else {
      if (q.kind === 'type') {
        await page.getByRole('textbox', { name: '转写', exact: true }).fill(q.answer);
      } else {
        const index = q.options.findIndex(o => o.id === q.answer);
        const choice = makeOneMistake && !mistaken ? (index + 1) % 4 : index;
        if (makeOneMistake && !mistaken) mistaken = true;
        await page.locator('.answer-options > button').nth(choice).click();
      }
      await page.getByRole('button', { name: '检查答案', exact: true }).click();
      await expect(page.getByRole('status')).toBeVisible();
      await page.getByRole('button', { name: '继续', exact: true }).click();
    }
    await expect.poll(async () => (await stored(page)).session?.index ?? -1).not.toBe(state.session.index);
  }
  await expect(page.getByText('又多认出了世界的一小部分')).toBeVisible();
}

test('real full lesson with mistake, persistence, summary and records', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '泰语文字' })).toBeVisible();
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('认识一个新知识');
  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  const q = await currentQuestion(page);
  const correct = q.options.findIndex(o => o.id === q.answer);
  await page.locator('.answer-options > button').nth((correct + 1) % 4).click();
  await page.getByRole('button', { name: '检查答案', exact: true }).click();
  await expect(page.getByText('差一点，再记一次')).toBeVisible();
  await page.getByRole('button', { name: '继续', exact: true }).click();
  const index = (await stored(page)).session!.index;
  await page.getByRole('button', { name: '保存并退出', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  expect((await stored(page)).session!.index).toBe(index);
  await finishCurrent(page);
  const result = await stored(page);
  expect(result.history).toHaveLength(1);
  expect(result.progress[q.itemId].wrong).toBeGreaterThan(0);
  expect(result.progress[q.itemId].card?.reps).toBe(1);
  await page.getByRole('button', { name: '回到学习路径' }).click();
  await page.getByRole('button', { name: '学习记录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '每一步，都算数' })).toBeVisible();
  await expect(page.locator('.history-row')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('independent IPA course, library search, detail dialog and source page', async ({ page }) => {
  await page.goto('/');
  await page.locator('.course-current').click();
  await page.getByRole('menuitem', { name: /国际音标基础/ }).click();
  await expect(page.getByRole('heading', { name: /国际音标基础/ })).toBeVisible();
  await page.screenshot({ path: '.local/screenshots/ipa-desktop.png', fullPage: false });
  await expect(page.locator('.course-description')).not.toContainText('泰语');
  await page.getByRole('button', { name: '音标图鉴', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索知识' }).fill('小舌');
  await expect(page.locator('.knowledge-tile')).toHaveCount(2);
  await page.locator('.knowledge-tile').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '课程与资料来源', exact: true }).click();
  await expect(page.getByRole('heading', { name: '知识应当有出处' })).toBeVisible();
  await expect(page.locator('.source-list a')).toHaveCount(5);
  await page.getByRole('button', { name: '学习路径', exact: true }).click();
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await finishCurrent(page);
});

test('export download, validated import, and reset confirmation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '设置与数据', exact: true }).first().click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/^script-drill-.*\.json$/);
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}'),
  });
  await expect(page.getByRole('alert')).toContainText('备份格式不正确');
  const backup = await stored(page);
  backup.settings.dailyGoal = 50;
  await page.locator('input[type=file]').setInputFiles({
    name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByText('导入会替换当前进度。', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '确认替换' }).click();
  expect((await stored(page)).settings.dailyGoal).toBe(50);
  await page.getByRole('button', { name: '设置与数据', exact: true }).first().click();
  await page.getByRole('button', { name: '重置全部进度', exact: true }).click();
  await expect(page.getByRole('button', { name: '确认重置', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '保留进度', exact: true }).click();
  expect((await stored(page)).settings.dailyGoal).toBe(50);
  await page.getByRole('button', { name: '重置全部进度', exact: true }).click();
  await page.getByRole('button', { name: '确认重置', exact: true }).click();
  expect((await stored(page)).settings.dailyGoal).toBe(20);
});

test('malformed stored progress is preserved and does not get overwritten', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('script-drill:v1', '{"version":99,"irreplaceable":"record"}'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('已保留原始数据');
  expect(await page.evaluate(() => localStorage.getItem('script-drill:v1'))).toContain('irreplaceable');
  await page.getByRole('button', { name: '数据设置' }).click();
  await expect(page.getByRole('button', { name: '导出保留的原始数据' })).toBeVisible();
});

test('word introduction reveals meaning after answer, and review includes meaning and typing', async ({ page }) => {
  const state = initialState();
  for (const item of courses.thai.items.filter(i => i.kind !== 'word')) {
    state.progress[item.id] = {
      introduced: true, correct: 4, wrong: 0, modes: ['read', 'reverse'], lastSeen: new Date().toISOString(),
    };
  }
  state.session = createSession(state, 'learn');
  expect(state.session?.queue[0].kind).toBe('read');
  await page.addInitScript(s => localStorage.setItem('script-drill:v1', JSON.stringify(s)), state);
  await page.goto('/');
  await page.getByRole('button', { name: '继续练习', exact: true }).click();
  await expect(page.getByText('田地；常见地名成分', { exact: true })).toHaveCount(0);
  const q = await currentQuestion(page);
  await page.locator('.answer-options > button').nth(q.options.findIndex(o => o.id === q.answer)).click();
  await page.getByRole('button', { name: '检查答案', exact: true }).click();
  await expect(page.getByRole('heading', { name: '田地；常见地名成分' })).toBeVisible();
  await page.getByRole('button', { name: '继续', exact: true }).click();
  await finishCurrent(page);
  await page.getByRole('button', { name: '回到学习路径' }).click();
  await page.getByRole('button', { name: '文字图鉴', exact: true }).click();
  await page.getByRole('tab', { name: /词汇/ }).click();
  await page.getByRole('textbox', { name: '搜索知识' }).fill('田地');
  await page.locator('.knowledge-tile').click();
  await page.getByRole('button', { name: '练习这个知识' }).click();
  expect((await stored(page)).session!.queue.some(q => q.kind === 'meaning')).toBe(true);
  expect((await stored(page)).session!.queue.some(q => q.kind === 'type')).toBe(true);
  await finishCurrent(page);
});

test('desktop and mobile visual verification without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.field-image img')).toHaveJSProperty('complete', true);
  await expect(page.locator('.field-image img')).not.toHaveJSProperty('naturalWidth', 0);
  await page.screenshot({ path: '.local/screenshots/desktop.png', fullPage: true });
  const sizes = [{ width: 390, height: 844 }, { width: 320, height: 740 }, { width: 768, height: 1024 }];
  for (const size of sizes) {
    await page.setViewportSize(size);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.local/screenshots/learn-${size.width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '图鉴', exact: true }).click();
  await expect(page.getByRole('heading', { name: '文字图鉴' })).toBeVisible();
  await page.screenshot({ path: '.local/screenshots/library-mobile.png', fullPage: true });
  await page.screenshot({ path: '.local/screenshots/library-mobile-viewport.png', fullPage: false });
  await page.getByRole('button', { name: '学习', exact: true }).click();
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await page.screenshot({ path: '.local/screenshots/intro-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  await page.screenshot({ path: '.local/screenshots/quiz-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const q = await currentQuestion(page);
  await page.locator('.answer-options > button').nth(q.options.findIndex(o => o.id === q.answer)).click();
  await page.getByRole('button', { name: '检查答案', exact: true }).click();
  await page.screenshot({ path: '.local/screenshots/feedback-mobile.png', fullPage: true });
});

test('all mobile views at 320px, modal focus and keyboard course switch', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  for (const name of ['图鉴', '复习', '记录', '资料', '学习']) {
    await page.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: '设置与数据', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: '重置全部进度', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.locator('.course-current').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /泰语文字/ })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: /国际音标基础/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /国际音标基础/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
