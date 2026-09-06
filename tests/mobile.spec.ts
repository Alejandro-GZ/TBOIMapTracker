import { devices, expect, test, type Page } from '@playwright/test';

const iphone13 = devices['iPhone 13'];
test.use({
  browserName: 'chromium',
  userAgent: iphone13.userAgent,
  viewport: iphone13.viewport,
  screen: iphone13.screen,
  deviceScaleFactor: iphone13.deviceScaleFactor,
  isMobile: iphone13.isMobile,
  hasTouch: iphone13.hasTouch,
});

async function tapCell(page: Page, x: number, y: number) {
  const box = await page.getByTestId(`map-cell-${x}-${y}`).boundingBox();
  if (!box) throw new Error(`Map cell ${x},${y} is not visible`);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function addContent(page: Page, id: string) {
  await page.getByTestId('add-content-button').click();
  await expect(page.getByTestId('content-picker-modal')).toBeVisible();
  const option = page.getByTestId(`marker-option-${id}`);
  if (!(await option.isVisible())) {
    await page.getByRole('button', { name: 'Structs', exact: true }).click();
  }
  await page.getByTestId(`marker-option-${id}`).click();
  await page.getByRole('button', { name: 'Close contents picker' }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await expect(page.getByTestId('mobile-bottom-bar')).toBeVisible();
  await expect(page.getByTestId('map-viewport')).toBeVisible();
});

test('phone UI is map-first and keeps portrait room/pickup sprites inside their cell', async ({ page }, testInfo) => {
  await expect(page.locator('.workspace > .palette-panel')).toHaveCount(0);
  await expect(page.locator('.workspace > .inspector-panel')).toHaveCount(0);
  await expect(page.locator('.map-stage-header')).toBeHidden();

  const viewport = await page.getByTestId('map-viewport').boundingBox();
  if (!viewport) throw new Error('Map viewport is missing');
  const innerHeight = await page.evaluate(() => window.innerHeight);
  expect(viewport.width).toBeGreaterThan(360);
  expect(viewport.height).toBeGreaterThan(innerHeight * 0.6);

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

  const normalTool = page.getByTestId('room-tool-normal');
  const iconSlot = normalTool.locator('.room-tool-icon');
  const iconSprite = iconSlot.locator('.minimap-icon-sprite');
  const slotBox = await iconSlot.boundingBox();
  const spriteBox = await iconSprite.boundingBox();
  if (!slotBox || !spriteBox) throw new Error('Mobile room icon is missing');
  expect(slotBox.width).toBeGreaterThanOrEqual(36);
  expect(spriteBox.width).toBeLessThan(slotBox.width);
  expect(spriteBox.x - slotBox.x).toBeGreaterThanOrEqual(2);
  expect(slotBox.x + slotBox.width - (spriteBox.x + spriteBox.width)).toBeGreaterThanOrEqual(2);

  await page.getByTestId('room-tool-treasure').click();
  await expect(page.getByRole('dialog', { name: 'Rooms' })).toHaveCount(0);
  await expect(page.getByTestId('mobile-tool-paint')).toHaveClass(/active/);

  await tapCell(page, 4, 4);
  const treasure = page.locator('.map-room-visual[data-room-type="treasure"]');
  await expect(treasure).toHaveCount(1);
  await expect(treasure).toHaveAttribute('data-map-sprite-profile', 'portrait-phone');

  const cellBox = await page.getByTestId('map-cell-4-4').boundingBox();
  const iconPixels = await treasure.locator('.map-room-type-icon .minimap-icon-crop').boundingBox();
  if (!cellBox || !iconPixels) throw new Error('Portrait treasure icon is missing');
  expect(iconPixels.width).toBeLessThan(cellBox.width * 0.8);
  expect(iconPixels.height).toBeLessThan(cellBox.height * 0.8);
  expect(iconPixels.x).toBeGreaterThan(cellBox.x + 1);
  expect(iconPixels.x + iconPixels.width).toBeLessThan(cellBox.x + cellBox.width - 1);
  expect(iconPixels.y).toBeGreaterThan(cellBox.y + 1);
  expect(iconPixels.y + iconPixels.height).toBeLessThan(cellBox.y + cellBox.height - 1);

  await page.getByTestId('mobile-tool-move').click();
  await tapCell(page, 4, 4);
  await expect(page.getByRole('dialog', { name: 'Room' })).toBeVisible();
  await expect(page.getByTestId('room-inspector')).toBeVisible();

  await addContent(page, 'P_FULLHEART');
  await expect(treasure.locator('.map-room-content-row')).toHaveClass(/split-content/);
  const pickupLayer = treasure.getByTestId('room-pickup-layer');
  await expect(pickupLayer).toHaveAttribute('data-pickup-fit-size', '10');

  const pickupPixels = await pickupLayer.locator('.minimap-icon-crop').boundingBox();
  const splitIconPixels = await treasure.locator('.map-room-type-icon .minimap-icon-crop').boundingBox();
  if (!pickupPixels || !splitIconPixels) throw new Error('Portrait split room sprites are missing');

  for (const pixels of [splitIconPixels, pickupPixels]) {
    expect(pixels.width).toBeLessThan(cellBox.width * 0.8);
    expect(pixels.height).toBeLessThan(cellBox.height * 0.8);
    expect(pixels.x).toBeGreaterThan(cellBox.x + 1);
    expect(pixels.x + pixels.width).toBeLessThan(cellBox.x + cellBox.width - 1);
    expect(pixels.y).toBeGreaterThan(cellBox.y + 1);
    expect(pixels.y + pixels.height).toBeLessThan(cellBox.y + cellBox.height - 1);
  }

  await page.getByRole('button', { name: 'Close Room' }).click();
  await page.screenshot({ path: testInfo.outputPath('mobile-portrait-map-sprites.png'), fullPage: true });

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

test('landscape phone uses a side tool rail and contextual drawer', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.reload();
  const toolRail = page.getByTestId('mobile-bottom-bar');
  await expect(toolRail).toBeVisible();
  await expect(page.getByTestId('map-viewport')).toBeVisible();
  await expect(page.locator('.map-room-visual').first()).toHaveAttribute('data-map-sprite-profile', 'default');

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.innerHeight + 1);

  const railBox = await toolRail.boundingBox();
  if (!railBox) throw new Error('Landscape tool rail is missing');
  expect(railBox.x).toBeGreaterThan(dimensions.innerWidth - 130);
  expect(railBox.width).toBeGreaterThanOrEqual(58);
  expect(railBox.height).toBeGreaterThan(280);
  expect(railBox.height).toBeGreaterThan(railBox.width * 3);

  const railButtons = toolRail.locator('button');
  const railButtonBoxes = await railButtons.evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  for (const box of railButtonBoxes) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByTestId('mobile-rooms-button').click();
  const roomsDialog = page.getByRole('dialog', { name: 'Rooms' });
  await expect(roomsDialog).toBeVisible();

  const drawerBox = await roomsDialog.boundingBox();
  if (!drawerBox) throw new Error('Landscape rooms drawer is missing');
  expect(drawerBox.x).toBeGreaterThan(dimensions.innerWidth * 0.35);
  expect(drawerBox.width).toBeLessThan(dimensions.innerWidth * 0.65);
  expect(drawerBox.height).toBeGreaterThanOrEqual(dimensions.innerHeight - 2);

  const columns = await page.locator('.mobile-sheet .room-palette-grid').first().evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  expect(columns).toBe(4);

  await page.screenshot({ path: testInfo.outputPath('mobile-landscape.png'), fullPage: true });
});
