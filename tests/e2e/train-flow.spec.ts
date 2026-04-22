import { test, expect, request as pwRequest } from '@playwright/test';

test('Training can be started via API and page receives live updates via WS', async ({ page, baseURL }) => {
  await page.goto('/train');
  await expect(page.getByRole('heading', { name: /train/i })).toBeVisible();

  // Start a very small training run directly via the REST API so the test
  // completes deterministically. The React page is subscribed to the same WS
  // and must reflect progress.
  const ctx = await pwRequest.newContext({ baseURL });
  const res = await ctx.post('/api/training/start', {
    data: {
      population_size: 8,
      max_generations: 2,
      survival_threshold: 0.2,
      compatibility_threshold: 3.0,
      mutation_rate: 0.8,
    },
  });
  // 409 means another run is already active — still OK for the subsequent assertions.
  expect([200, 409]).toContain(res.status());

  // Running chip should flip to Training at least briefly
  await expect(page.getByText(/^Training$/)).toBeVisible({ timeout: 20_000 });

  // At least one generation recorded (chip text: "X gens recorded")
  await expect(page.getByText(/[1-9]\d* gens recorded/)).toBeVisible({ timeout: 180_000 });
});
