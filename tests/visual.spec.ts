import { expect, test, type Page } from '@playwright/test';

const DOCS_REVISION = '646e1761addcc236081ad291fee20f3d04bbbf52';

async function waitForArt(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        });
      }),
    );
  });
}

async function dragCells(page: Page, from: [number, number], to: [number, number]) {
  const start = page.getByTestId(`map-cell-${from[0]}-${from[1]}`);
  const end = page.getByTestId(`map-cell-${to[0]}-${to[1]}`);
  const startBox = await start.boundingBox();
  const endBox = await end.boundingBox();
  if (!startBox || !endBox) throw new Error('Map cell is not visible');

  await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, { steps: 8 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await expect(page.getByTestId('map-viewport')).toBeVisible();
});

test('builds a representative floor through the real UI and captures it', async ({ page }, testInfo) => {
  await page.getByTestId('room-tool-treasure').click();
  await page.getByTestId('map-cell-5-6').click();
  await page.getByTestId('quick-pickup-heart').click();
  await page.getByTestId('quick-pickup-coin').click();

  await page.getByTestId('room-tool-boss').click();
  await page.getByTestId('map-cell-7-6').click();

  await page.getByTestId('room-tool-shop').click();
  await page.getByTestId('map-cell-6-5').click();

  await page.getByTestId('room-tool-curse').click();
  await page.getByTestId('map-cell-6-7').click();

  await page.getByTestId('room-tool-normal').click();
  await dragCells(page, [2, 2], [3, 2]);
  await dragCells(page, [9, 2], [9, 3]);
  await dragCells(page, [1, 9], [2, 10]);

  await waitForArt(page);

  const canonicalShapes = page.locator('img[data-isaac-shape]');
  await expect(canonicalShapes.first()).toBeVisible();
  const shapeSources = await canonicalShapes.evaluateAll((images) =>
    images.map((image) => (image as HTMLImageElement).src),
  );
  expect(shapeSources.every((src) => src.includes(`wofsauge/IsaacDocs/${DOCS_REVISION}`))).toBeTruthy();

  const treasureIcon = page.locator('img[data-isaac-room-type="treasure"]').first();
  await expect(treasureIcon).toBeVisible();
  expect(await treasureIcon.getAttribute('src')).toContain('/roomtypes/4.png');

  await expect(page.getByTestId('room-pickup-layer')).toBeVisible();
  await expect(page.getByTestId('map-door-layer')).toBeVisible();

  const viewportContract = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    htmlHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
  }));
  expect(viewportContract.htmlHeight).toBeLessThanOrEqual(viewportContract.innerHeight + 1);
  expect(viewportContract.bodyHeight).toBeLessThanOrEqual(viewportContract.innerHeight + 1);

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('.zoom-value')).toContainText('115%');

  await page.getByTestId('map-viewport').screenshot({
    path: testInfo.outputPath('canonical-floor.png'),
    animations: 'disabled',
  });
  await page.locator('.map-stage').screenshot({
    path: testInfo.outputPath('map-stage.png'),
    animations: 'disabled',
  });
  await page.screenshot({
    path: testInfo.outputPath('full-workspace.png'),
    fullPage: false,
    animations: 'disabled',
  });
});

test('dragging cells creates the requested rectangular Isaac footprints', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();

  await dragCells(page, [1, 1], [2, 1]);
  await expect(page.locator('[data-room-shape="2x1"]')).toHaveCount(1);

  await dragCells(page, [10, 1], [10, 2]);
  await expect(page.locator('[data-room-shape="1x2"]')).toHaveCount(1);

  await dragCells(page, [1, 10], [2, 11]);
  await expect(page.locator('[data-room-shape="2x2"]')).toHaveCount(1);
});

test('corridor and L shapes use the canonical preview selected through the inspector', async ({ page }) => {
  await page.getByTestId('map-cell-6-6').click();
  await page.getByTestId('shape-option-LTL').click();
  await waitForArt(page);

  const room = page.locator('[data-room-shape="LTL"]').first();
  await expect(room).toBeVisible();
  const image = room.locator('img[data-isaac-shape="LTL"]');
  await expect(image).toBeVisible();
  expect(await image.getAttribute('src')).toContain('/roomshapes/9.png');
});
