import { test, expect, request as pwRequest } from '@playwright/test';

test('Models list renders; empty state or rows visible', async ({ page }) => {
  await page.goto('/models');
  await expect(page.getByRole('heading', { name: /saved models/i })).toBeVisible();
  const empty = page.getByText(/No models yet/i);
  const table = page.getByRole('table');
  await expect(empty.or(table.first())).toBeVisible();
});

test('Bad pickle upload is rejected by the API', async ({ baseURL }) => {
  const ctx = await pwRequest.newContext({ baseURL });
  const res = await ctx.post('/api/models/upload', {
    multipart: {
      name: 'bogus',
      notes: '',
      file: {
        name: 'bogus.pkl',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from([0xde, 0xad, 0xbe, 0xef]),
      },
    },
  });
  expect(res.status()).toBe(400);
});
