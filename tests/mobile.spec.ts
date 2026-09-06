import { devices, expect, test, type Page } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

async function tapCell(page: Page, x: number, y: number) {
  const box = await page.getByTestId(`map-cell-${x}-${y}`).boundingBox();
  if (!box) throw new Error(`Map cell ${x},${y} is not visible`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await expect(page.getByTestId('mobile-bottom-bar')).toBeVisible();
  await expect(page.getByTestId('map-viewport')).toBeVisible();
});

test('phone UI is map-first and supports the core touch editing flow', async ({ page }) => {
  await expect(page.locator('.workspace > .palette-panel')).toHaveCount(0);
  await expect(page.locator('.workspace > .inspector-panel')).toHaveCount(0);
  await expect(page.locator('.map-stage-header')).toBeHidden();

  const viewport = await page.getByTestId('map-viewport').boundingBox();
  if (!viewport) throw new Error('Map viewport is missing');
  expect(viewport.width).toBeGreaterThan(360);
  expect(viewport.height).toBeGreaterThan(600);

  const bottomButtons = page.getByTestId('mobile-bottom-bar').locator('button');
  await expect(bottomButtons).toHaveCount(4);
  const buttonBoxes = await bottomButtons.evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  for (const box of buttonBoxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByTestId('mobile-rooms-button').click();
  await expect(page.getByRole('dialog', { name: 'Rooms' })).toBeVisible();
  await page.getByTestId('room-tool-treasure').click();
  await expect(page.getByRole('dialog', { name: 'Rooms' })).toHaveCount(0);
  await expect(page.getByTestId('mobile-tool-paint')).toHaveClass(/active/);

  await tapCell(page, 4, 4);
  await expect(page.locator('.map-room-visual[data-room-type="treasure"]')).toHaveCount(1);

  await page.getByTestId('mobile-tool-move').click();
  await tapCell(page, 4, 4);
  await expect(page.getByRole('dialog', { name: 'Room' })).toBeVisible();
  await expect(page.getByTestId('room-inspector')).toBeVisible();
  await page.getByRole('button', { name: 'Close Room' }).click();

  await page.getByTestId('mobile-tool-erase').click();
  await tapCell(page, 4, 4);
  await expect(page.locator('.map-room-visual[data-room-type="treasure"]')).toHaveCount(0);
});

test('mobile menu moves secondary actions off the permanent toolbar', async ({ page }) => {
  await page.getByTestId('mobile-menu-button').click();
  const menu = page.getByRole('dialog', { name: 'Map menu' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Fit map' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Show grid' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Edit run' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Import map' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Export map' })).toBeVisible();
  await expect(menu.getByRole('button', { name: 'New map' })).toBeVisible();

  await menu.getByRole('button', { name: 'Edit run' }).click();
  await expect(page.getByRole('dialog', { name: 'Run details' })).toBeVisible();
  const inputs = page.getByRole('dialog', { name: 'Run details' }).locator('input');
  await expect(inputs).toHaveCount(3);
});

test('landscape phone keeps mobile controls and avoids document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.reload();
  await expect(page.getByTestId('mobile-bottom-bar')).toBeVisible();
  await expect(page.getByTestId('map-viewport')).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.innerHeight + 1);

  await page.getByTestId('mobile-rooms-button').click();
  const columns = await page.locator('.mobile-sheet .room-palette-grid').first().evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(5);
});
