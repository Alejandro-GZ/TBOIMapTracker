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

async function dragPath(page: Page, cells: Array<[number, number]>) {
  if (cells.length === 0) throw new Error('Drag path needs at least one cell');

  const boxes = [];
  for (const [x, y] of cells) {
    const box = await page.getByTestId(`map-cell-${x}-${y}`).boundingBox();
    if (!box) throw new Error(`Map cell ${x},${y} is not visible`);
    boxes.push(box);
  }

  const first = boxes[0];
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(25);

  for (const box of boxes.slice(1)) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    // Pointer-path creation depends on entering each intended hit cell. A short
    // dwell makes this deterministic when the viewport/layout changes size.
    await page.waitForTimeout(25);
  }

  await page.mouse.up();
  await page.waitForTimeout(25);
}

async function dragCells(page: Page, from: [number, number], to: [number, number]) {
  await dragPath(page, [from, to]);
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
  await dragPath(page, [[1, 9], [2, 9], [2, 10], [1, 10]]);
  await dragPath(page, [[9, 9], [10, 9], [10, 10]]);

  await waitForArt(page);

  const canonicalShapes = page.locator('img[data-isaac-shape]');
  await expect(canonicalShapes.first()).toBeVisible();
  const shapeSources = await canonicalShapes.evaluateAll((images) =>
    images.map((image) => (image as HTMLImageElement).src),
  );
  expect(shapeSources.every((src) => src.includes(`wofsauge/IsaacDocs/${DOCS_REVISION}`))).toBeTruthy();

  const treasureIcon = page.locator('.map-room-visual[data-room-type="treasure"] img[data-isaac-room-type="treasure"]');
  await expect(treasureIcon).toBeVisible();
  expect(await treasureIcon.getAttribute('src')).toContain('/roomtypes/4.png');
  const treasureIconBox = await treasureIcon.boundingBox();
  expect(treasureIconBox?.width ?? 0).toBeGreaterThanOrEqual(30);

  const horizontalShape = page.locator('[data-room-shape="2x1"] .isaac-room-shape').first();
  await expect(horizontalShape).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('[data-room-shape="LBL"]')).toHaveCount(1);

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

test('dragging cells creates rectangular and L Isaac footprints', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();

  await dragCells(page, [1, 1], [2, 1]);
  await expect(page.locator('[data-room-shape="2x1"]')).toHaveCount(1);

  await dragCells(page, [10, 1], [10, 2]);
  await expect(page.locator('[data-room-shape="1x2"]')).toHaveCount(1);

  // The representative-floor test above already exercises a four-cell 2x2
  // path. Here use the supported corner-to-corner gesture so this assertion
  // covers the alternate UX without duplicating a timing-sensitive loop.
  await dragCells(page, [1, 10], [2, 11]);
  await expect(page.locator('[data-room-shape="2x2"]')).toHaveCount(1);

  await dragPath(page, [[8, 9], [9, 9], [9, 10]]);
  await expect(page.locator('[data-room-shape="LBL"]')).toHaveCount(1);
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
