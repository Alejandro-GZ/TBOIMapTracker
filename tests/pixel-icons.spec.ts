import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await expect(page.getByTestId('map-viewport')).toBeVisible();
});

test('room palette icons use exact source frames and integer scaling', async ({ page }, testInfo) => {
  const icons = page.locator('.room-palette-grid [data-icon-id]');
  expect(await icons.count()).toBeGreaterThan(15);

  const metrics = await icons.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    const crop = element.querySelector('.minimap-icon-crop')?.getBoundingClientRect();
    const atlas = element.querySelector('.minimap-icon-atlas-image') as HTMLImageElement | null;
    return {
      id: element.getAttribute('data-icon-id'),
      sourceWidth: Number(element.getAttribute('data-source-width')),
      sourceHeight: Number(element.getAttribute('data-source-height')),
      pixelScale: Number(element.getAttribute('data-pixel-scale')),
      renderWidth: Number(element.getAttribute('data-render-width')),
      renderHeight: Number(element.getAttribute('data-render-height')),
      boxWidth: box.width,
      boxHeight: box.height,
      cropWidth: crop?.width ?? 0,
      cropHeight: crop?.height ?? 0,
      atlasLoaded: Boolean(atlas?.complete && atlas.naturalWidth > 0),
    };
  }));

  for (const icon of metrics) {
    expect(icon.sourceWidth, icon.id ?? '').toBeGreaterThan(0);
    expect(icon.sourceHeight, icon.id ?? '').toBeGreaterThan(0);
    expect(Number.isInteger(icon.pixelScale), icon.id ?? '').toBeTruthy();
    expect(icon.pixelScale, icon.id ?? '').toBeGreaterThanOrEqual(2);
    expect(icon.boxWidth, icon.id ?? '').toBe(24);
    expect(icon.boxHeight, icon.id ?? '').toBe(24);
    expect(icon.cropWidth, icon.id ?? '').toBe(icon.renderWidth);
    expect(icon.cropHeight, icon.id ?? '').toBe(icon.renderHeight);
    expect(icon.renderWidth, icon.id ?? '').toBe(icon.sourceWidth * icon.pixelScale);
    expect(icon.renderHeight, icon.id ?? '').toBe(icon.sourceHeight * icon.pixelScale);
    expect(Math.max(icon.renderWidth, icon.renderHeight), icon.id ?? '').toBeLessThanOrEqual(24);
    expect(Math.max(icon.renderWidth, icon.renderHeight), icon.id ?? '').toBeGreaterThanOrEqual(16);
    expect(icon.atlasLoaded, icon.id ?? '').toBeTruthy();
  }

  await page.locator('.palette-panel').screenshot({
    path: testInfo.outputPath('room-icon-palette.png'),
    animations: 'disabled',
  });
});

test('small pickups and tall structures fill their target boxes without distortion', async ({ page }, testInfo) => {
  await page.getByTestId('room-tool-treasure').click();
  await page.getByTestId('map-cell-4-4').click();

  for (const id of ['P_CHEST', 'P_GOLDENPILL', 'S_CONFESIONARY', 'S_BLOODDONATION']) {
    await page.getByTestId('marker-select').selectOption(id);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }

  const rows = page.locator('.pickup-list [data-icon-id]');
  await expect(rows).toHaveCount(4);

  const metrics = await rows.evaluateAll((elements) => elements.map((element) => ({
    id: element.getAttribute('data-icon-id'),
    sourceWidth: Number(element.getAttribute('data-source-width')),
    sourceHeight: Number(element.getAttribute('data-source-height')),
    pixelScale: Number(element.getAttribute('data-pixel-scale')),
    renderWidth: Number(element.getAttribute('data-render-width')),
    renderHeight: Number(element.getAttribute('data-render-height')),
  })));

  for (const icon of metrics) {
    expect(Number.isInteger(icon.pixelScale), icon.id ?? '').toBeTruthy();
    expect(icon.pixelScale, icon.id ?? '').toBeGreaterThanOrEqual(2);
    expect(icon.renderWidth, icon.id ?? '').toBe(icon.sourceWidth * icon.pixelScale);
    expect(icon.renderHeight, icon.id ?? '').toBe(icon.sourceHeight * icon.pixelScale);
    expect(Math.max(icon.renderWidth, icon.renderHeight), icon.id ?? '').toBeLessThanOrEqual(24);
    expect(Math.max(icon.renderWidth, icon.renderHeight), icon.id ?? '').toBeGreaterThanOrEqual(18);
  }

  const mapRoom = page.locator('.map-room-visual[data-room-type="treasure"]');
  await expect(mapRoom.locator('[data-icon-id="P_CHESTALT"]')).toHaveCount(1);
  await expect(mapRoom.locator('[data-icon-id="P_GOLDENPILL"]')).toHaveCount(1);
  await expect(mapRoom.locator('[data-icon-id="S_CONFESIONARY"]')).toHaveCount(1);

  await page.locator('.inspector-panel').screenshot({
    path: testInfo.outputPath('pickup-structure-icons.png'),
    animations: 'disabled',
  });
});
