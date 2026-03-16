import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appUrl = pathToFileURL(path.resolve('e2e/mock-app.html')).href;

test('register/login', async ({ page }) => {
  await page.goto(appUrl);
  await page.fill('#email', 'u1@example.com');
  await page.fill('#password', 'pw');
  await page.click('#register');
  await page.click('#login');
  await expect(page.locator('#auth-status')).toHaveText('logged-in');
});

test('buy/sell', async ({ page }) => {
  await page.goto(appUrl);
  await page.fill('#qty', '3');
  await page.click('#buy');
  await page.click('#sell');
  await expect(page.locator('#position')).toHaveText('0');
});

test('build + lock lineup', async ({ page }) => {
  await page.goto(appUrl);
  await page.fill('#lineup', 'a1,a2,a3,a4,a5');
  await page.click('#lock');
  await expect(page.locator('#lineup-status')).toHaveText('locked');
});

test('leaderboard view', async ({ page }) => {
  await page.goto(appUrl);
  await page.click('#show-leaderboard');
  await expect(page.locator('#leaderboard li')).toHaveCount(2);
});

test('admin metric import + run weekly scoring', async ({ page }) => {
  await page.goto(appUrl);
  await page.fill('#metric', '2026-W01');
  await page.click('#import-metric');
  await page.click('#run-scoring');
  await expect(page.locator('#admin-status')).toHaveText('scored');
});
