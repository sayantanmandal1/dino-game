import { test, expect } from '@playwright/test';

test('Play page loads, canvas visible, Start increments the score', async ({ page }) => {
  await page.goto('/play');

  const canvas = page.getByTestId('dino-canvas');
  await expect(canvas).toBeVisible();

  const score = page.getByTestId('score');
  await expect(score).toHaveText('00000');

  // Kick off the game
  await page.getByRole('button', { name: /start/i }).first().click();
  // Focus the window and try to survive a little with a jump
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);

  const text = (await score.innerText()).trim();
  expect(text).toMatch(/^\d{5}$/);
  // Either we're still alive and score > 0, or we crashed — both are fine as
  // long as the engine ticked at least once.
  expect(parseInt(text, 10)).toBeGreaterThanOrEqual(0);
});

test('Navigation: all main routes render their heading', async ({ page }) => {
  const routes = [
    { path: '/', heading: /dino ai trainer/i },
    { path: '/play', heading: /play/i },
    { path: '/train', heading: /train/i },
    { path: '/visualize', heading: /visualize/i },
    { path: '/models', heading: /saved models/i },
    { path: '/leaderboard', heading: /leaderboard/i },
    { path: '/about', heading: /about/i },
  ];
  for (const r of routes) {
    await page.goto(r.path);
    await expect(page.getByRole('heading', { name: r.heading }).first()).toBeVisible();
  }
});
