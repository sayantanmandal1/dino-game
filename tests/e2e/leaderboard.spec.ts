import { test, expect, request as pwRequest } from '@playwright/test';

test('Leaderboard submit + list end-to-end', async ({ page, baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  const name = `PW-${Date.now()}`;
  const res = await ctx.post('/api/leaderboard', {
    data: { player_name: name, score: 777, mode: 'human' },
  });
  expect(res.ok()).toBeTruthy();

  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});
