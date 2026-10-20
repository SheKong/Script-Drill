import { expect, test, type Page } from '@playwright/test';
import recordings from '../src/data/recordings.json' with { type: 'json' };

async function library(page: Page, ipa = false) {
  await page.goto('/');
  if (ipa) {
    await page.locator('.course-current').click();
    await page.getByRole('menuitem', { name: /国际音标基础/ }).click();
  }
  await page.getByRole('button', { name: /^(文字图鉴|音标图鉴|图鉴)$/ }).click();
}
async function inspect(page: Page, query: string) {
  await page.getByRole('textbox', { name: '搜索知识' }).fill(query);
  const exact = page.locator('.knowledge-tile').filter({ has: page.getByText(query, { exact: true }) });
  await (await exact.count() ? exact : page.locator('.knowledge-tile')).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) {
    expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  }
}

test('local IPA font renders ties, marks and tone letters on small and large screens', async ({ page }, testInfo) => {
  await library(page, true);
  await inspect(page, '塞擦音与连音弧');
  const glyph = page.locator('.detail-symbol > span');
  await expect(glyph).toHaveText('t͡s');
  const pixels = await page.evaluate(async () => {
    await document.fonts.load('48px "Script Drill IPA"');
    await document.fonts.ready;
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 110;
    const context = canvas.getContext('2d')!;
    const samples = ['t͡s', 't͜s', 'k̚', '◌̚', '˥˧˩', 'ts'];
    return samples.map(sample => {
      context.clearRect(0, 0, 300, 110);
      context.font = '48px "Script Drill IPA"';
      context.fillText(sample, 20, 70);
      const data = context.getImageData(0, 0, 300, 110).data;
      let ink = 0, hash = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i]) { ink++; hash = (hash + i * data[i]) % 2147483647; }
      }
      return { sample, ink, hash };
    });
  });
  expect(pixels.every(sample => sample.ink > 50)).toBe(true);
  expect(new Set(pixels.map(sample => sample.hash)).size).toBe(pixels.length);
  await expect(glyph).toHaveCSS('font-family', /Script Drill IPA/);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/ipa-tie-${testInfo.project.name}-${width}.png` });
  }
  await page.keyboard.press('Escape');
  await inspect(page, '尾塞音不释放');
  await expect(page.locator('.detail-symbol')).toHaveText('◌̚');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.local/screenshots/ipa-diacritic-${testInfo.project.name}.png` });
});

test('Thai script styles switch, compare and stay selected through quiz steps', async ({ page }, testInfo) => {
  await library(page);
  const modern = page.getByRole('button', { name: '现代无圈体', exact: true });
  await modern.click();
  await expect(modern).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.tile-glyph').first()).toHaveCSS('font-family', /Noto Sans Thai"?,/);
  await inspect(page, 'ถนน');
  await expect(page.locator('.script-comparison > div')).toHaveCount(2);
  await expect(page.locator('.script-comparison .thai')).toHaveText('ถนน');
  await expect(page.locator('.script-comparison .thai-modern')).toHaveText('ถนน');
  await expect(page.locator('.reading-grid')).toContainText('RTGS');
  await expect(page.locator('.reading-grid')).not.toContainText('教学转写');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/thai-styles-${testInfo.project.name}-${width}.png` });
  }
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^(学习路径|学习)$/ }).click();
  await page.getByRole('button', { name: '开始学习', exact: true }).click();
  await page.getByRole('button', { name: '现代无圈体', exact: true }).click();
  await expect(page.locator('.detail-symbol > span')).toHaveCSS('font-family', /Noto Sans Thai"?,/);
  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  await expect(page.getByRole('button', { name: '现代无圈体', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.question-display')).toHaveCSS('font-family', /Noto Sans Thai"?,/);
  await noOverflow(page);
});

test('local recordings load without external requests and decoded audio is non-silent', async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.goto('/');
  const result = await page.evaluate(async clips => {
    const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const context = Context ? new Context() : null;
    const results = [];
    for (const clip of clips) {
      const response = await fetch(clip);
      if (!response.ok) throw new Error(`Missing recording: ${clip}`);
      if (context) {
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        const samples = buffer.getChannelData(0);
        let peak = 0;
        for (const value of samples) peak = Math.max(peak, Math.abs(value));
        results.push({ clip, duration: buffer.duration, peak });
      } else {
        // Windows WebKit lacks WebAudio; still verify every MP3's media metadata.
        const audio = new Audio(clip);
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error(`Metadata timed out: ${clip}`)), 5000);
          audio.onloadedmetadata = () => { clearTimeout(timeout); resolve(); };
          audio.onerror = () => { clearTimeout(timeout); reject(new Error(`Undecodable: ${clip}`)); };
          audio.load();
        });
        results.push({ clip, duration: audio.duration, peak: null });
        audio.removeAttribute('src');
        audio.load();
      }
    }
    await context?.close();
    return results;
  }, Object.values(recordings).map(recording => recording.src));
  expect(result.length).toBeGreaterThanOrEqual(30);
  expect(result.every(clip => clip.duration > 0.15 && clip.duration < 30 && (clip.peak === null || clip.peak > 0.01))).toBe(true);
});

test('real MP3 playback stops when its detail closes and credits remain available', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      Object.assign(window, { testAudio: this });
      return original.call(this);
    };
  });
  await library(page, true);
  await inspect(page, '清双唇塞音');
  await page.getByRole('button', { name: '真人发音', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { testAudio: HTMLAudioElement }).testAudio.currentTime)).toBeGreaterThan(0);
  await expect(page.locator('.audio-credit')).toContainText('Peter Isotalo');
  await expect(page.locator('.audio-credit')).toContainText('CC BY-SA');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => {
    const audio = (window as unknown as { testAudio: HTMLAudioElement }).testAudio;
    return audio.paused && !audio.getAttribute('src');
  })).toBe(true);
});

test('recording failures are visible and retryable', async ({ page }) => {
  await page.addInitScript(() => {
    // Windows WebKit's native media requests can bypass route interception.
    const NativeAudio = window.Audio;
    Object.defineProperty(window, 'Audio', { configurable: true, value: function () {
      return new NativeAudio('/audio/__missing_pronunciation__.mp3');
    } });
  });
  await library(page, true);
  await inspect(page, '清双唇塞音');
  await page.getByRole('button', { name: '真人发音', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('录音播放失败', { timeout: 20000 });
  await expect(page.getByRole('link', { name: '原始录音', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '真人发音', exact: true })).toBeEnabled();
});

test('missing Thai voices offer online listening and actionable OS help, never English', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => [{ lang: 'en-US', localService: true }],
      cancel: () => {},
      speak: () => { throw new Error('English voice must never be selected'); },
    });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await library(page);
  await inspect(page, 'ถนน');
  await expect(page.getByRole('button', { name: '合成语音 · 词语示范', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('当前浏览器也未提供泰语声音');
  const online = page.getByRole('link', { name: '在线听泰语', exact: true });
  await expect(online).toBeVisible();
  const url = new URL((await online.getAttribute('href'))!);
  expect(url.searchParams.get('text')).toBe('ถนน');
  expect(url.searchParams.get('sl')).toBe('th');
  await expect(page.getByRole('link', { name: 'Bing 备用', exact: true })).toHaveAttribute('href', /from=th/);
  await expect(page.getByRole('link', { name: '发音资料', exact: true })).toBeVisible();
  await page.getByText('语音安装与排查', { exact: true }).click();
  await page.getByRole('combobox', { name: '语音帮助的设备系统' }).selectOption('windows');
  await expect(page.locator('.voice-help')).toContainText('Pattara');
  await expect(page.locator('.voice-help')).toContainText('仅添加泰语键盘不等于安装语音');
  await page.getByRole('button', { name: '重新检测语音' }).click();
  await expect(page.locator('.voice-help [role=status]')).toContainText('仍未提供泰语声音');
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await noOverflow(page);
    await page.screenshot({ path: `.local/screenshots/thai-voice-help-${testInfo.project.name}-${width}.png` });
  }
  for (const platform of ['android', 'apple', 'other']) {
    await page.getByRole('combobox', { name: '语音帮助的设备系统' }).selectOption(platform);
    await noOverflow(page);
  }
});

test('late voice lists enable explicit Thai speech and synthesis errors are surfaced', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true,
      value: class {
        text: string;
        constructor(text: string) { this.text = text; }
      },
    });
    let voices: { lang: string; localService: boolean }[] = [];
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => voices,
      cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => {
        Object.assign(window, { spoken: { text: utterance.text, lang: utterance.lang, voice: utterance.voice?.lang } });
        setTimeout(() => utterance.onerror?.({ error: 'synthesis-failed' } as SpeechSynthesisErrorEvent), 0);
      },
    });
    Object.assign(window, { addThaiVoice: () => {
      voices = [{ lang: 'th-TH', localService: true }];
      speech.dispatchEvent(new Event('voiceschanged'));
    } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await library(page);
  await inspect(page, 'ถนน');
  const button = page.getByRole('button', { name: '合成语音 · 词语示范', exact: true });
  await expect(button).toBeDisabled();
  await page.evaluate(() => (window as unknown as { addThaiVoice: () => void }).addThaiVoice());
  await expect(button).toBeEnabled();
  await button.click();
  await expect(page.getByRole('status')).toContainText('设备语音播放失败');
  await expect(page.getByRole('link', { name: '在线听泰语', exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { spoken: object }).spoken)).toEqual({
    text: 'ถนน', lang: 'th-TH', voice: 'th-TH',
  });
});

test('Thai local recordings work without Web Speech or external network access', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      Object.assign(window, { testAudio: this });
      return original.call(this);
    };
  });
  await page.route(/^https:\/\//, route => route.abort());
  await library(page);
  await inspect(page, 'บ้าน');
  const button = page.getByRole('button', { name: '真人发音 · 词语示范', exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { testAudio: HTMLAudioElement }).testAudio.currentTime)).toBeGreaterThan(0);
  await expect(page.locator('.audio-credit')).toContainText('Patsagorn');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => (window as unknown as { testAudio: HTMLAudioElement }).testAudio.paused)).toBe(true);
});

test('failed Thai recording tries Thai synthesis once, even with both error and rejected play', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true,
      value: class { text: string; constructor(text: string) { this.text = text; } },
    });
    Object.defineProperty(window, 'Audio', { configurable: true, value: class {
      onerror?: () => void;
      pause() {}
      load() {}
      removeAttribute() {}
      play() { this.onerror?.(); return Promise.reject(new Error('Missing recording')); }
    } });
    let spoken = 0;
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => [{ lang: 'th-TH', localService: true }],
      cancel: () => {},
      speak: (utterance: SpeechSynthesisUtterance) => {
        Object.assign(window, { spoken: ++spoken, spokenText: utterance.text });
        setTimeout(() => utterance.onstart?.({} as SpeechSynthesisEvent), 0);
      },
    });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await library(page);
  await inspect(page, 'บ้าน');
  await page.getByRole('button', { name: '真人发音 · 词语示范', exact: true }).click();
  await expect(page.getByRole('button', { name: '停止发音', exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('切换为设备泰语语音');
  expect(await page.evaluate(() => (window as unknown as { spoken: number }).spoken)).toBe(1);
  expect(await page.evaluate(() => (window as unknown as { spokenText: string }).spokenText)).toBe('บ้าน');
  await page.getByRole('button', { name: '停止发音', exact: true }).click();
  await expect(page.getByRole('button', { name: '真人发音 · 词语示范', exact: true })).toBeEnabled();
});

test('Thai recording failure without a voice leaves working alternatives and retry', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
    const NativeAudio = window.Audio;
    Object.defineProperty(window, 'Audio', { configurable: true, value: function () {
      return new NativeAudio('/audio/__missing_pronunciation__.mp3');
    } });
  });
  await library(page);
  await inspect(page, 'บ้าน');
  await page.getByRole('button', { name: '真人发音 · 词语示范', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('录音播放失败', { timeout: 20000 });
  await expect(page.getByRole('button', { name: '真人发音 · 词语示范', exact: true })).toBeEnabled();
  await expect(page.getByRole('link', { name: '在线听泰语', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '原始录音', exact: true })).toBeVisible();
  await expect(page.locator('.voice-help')).toBeVisible();
});

test('speech startup timeout is recoverable and does not leave an endless spinner', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true,
      value: class { text: string; constructor(text: string) { this.text = text; } },
    });
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => [{ lang: 'th-TH', localService: true }], cancel: () => {}, speak: () => {},
    });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await library(page);
  await inspect(page, 'ถนน');
  await page.clock.install();
  await page.getByRole('button', { name: '合成语音 · 词语示范', exact: true }).click();
  await page.clock.fastForward(16000);
  await expect(page.getByRole('status')).toContainText('设备语音播放失败');
  await expect(page.getByRole('button', { name: '合成语音 · 词语示范', exact: true })).toBeEnabled();
  await expect(page.getByRole('link', { name: '在线听泰语', exact: true })).toBeVisible();
});

test('manual recheck discovers a newly installed voice without a voiceschanged event', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true,
      value: class { text: string; constructor(text: string) { this.text = text; } },
    });
    let voices: { lang: string; localService: boolean }[] = [];
    const speech = Object.assign(new EventTarget(), {
      getVoices: () => voices, cancel: () => {}, speak: () => {},
    });
    Object.assign(window, { installThaiVoice: () => { voices = [{ lang: 'th-TH', localService: true }]; } });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });
  });
  await library(page);
  await inspect(page, 'ถนน');
  const button = page.getByRole('button', { name: '合成语音 · 词语示范', exact: true });
  await expect(button).toBeDisabled();
  await page.getByText('语音安装与排查', { exact: true }).click();
  await page.evaluate(() => (window as unknown as { installThaiVoice: () => void }).installThaiVoice());
  await page.getByRole('button', { name: '重新检测语音' }).click();
  await expect(button).toBeEnabled();
  await expect(page.locator('.voice-help [role=status]')).toContainText('已检测到泰语声音');
});

test('unrecorded IPA keeps both independent reference sources accessible', async ({ page }, testInfo) => {
  await library(page, true);
  await inspect(page, '送气清软腭塞音');
  await expect(page.getByRole('link', { name: '真人发音资料', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Seeing Speech 发音示范', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '在线听泰语', exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  await noOverflow(page);
  await page.screenshot({ path: `.local/screenshots/ipa-missing-reference-${testInfo.project.name}.png` });
});
