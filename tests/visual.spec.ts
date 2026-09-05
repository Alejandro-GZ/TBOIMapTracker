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
    await page.waitForTimeout(25);
  }
  await page.mouse.up();
  await page.waitForTimeout(25);
}

async function dragCells(page: Page, from: [number, number], to: [number, number]) {
  await dragPath(page, [from, to]);
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
  await expect(page.getByTestId('map-viewport')).toBeVisible();
});

test('builds a representative floor through the real UI and captures it', async ({ page }, testInfo) => {
  await page.getByTestId('room-tool-treasure').click();
  await page.getByTestId('map-cell-5-6').click();
  await addContent(page, 'P_FULLHEART');
  await addContent(page, 'P_PENNY');

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

  const treasureRoom = page.locator('.map-room-visual[data-room-type="treasure"]').first();
  await expect(treasureRoom.locator('[data-isaac-room-type="treasure"]')).toHaveAttribute('data-icon-id', 'R_TREASURE');
  await expect(treasureRoom.getByTestId('room-pickup-layer')).toBeVisible();
  await expect(treasureRoom.getByTestId('room-pickup-layer').locator('.room-pickup-token')).toHaveCount(1);
  await expect(treasureRoom.locator('.room-pickup-overflow')).toHaveText('+1');

  const horizontalRoom = page.locator('[data-room-shape="2x1"]').first();
  await expect(horizontalRoom.locator('.isaac-room-shape')).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('[data-room-shape="2x2"]')).toHaveCount(1);
  await expect(page.locator('[data-room-shape="LBL"]')).toHaveCount(1);

  const viewportContract = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    htmlHeight: document.documentElement.scrollHeight,
    bodyHeight: document.body.scrollHeight,
  }));
  expect(viewportContract.htmlHeight).toBeLessThanOrEqual(viewportContract.innerHeight + 1);
  expect(viewportContract.bodyHeight).toBeLessThanOrEqual(viewportContract.innerHeight + 1);

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('.zoom-value')).toContainText('115%');

  await page.getByTestId('map-viewport').screenshot({ path: testInfo.outputPath('canonical-floor.png'), animations: 'disabled' });
  await page.locator('.map-stage').screenshot({ path: testInfo.outputPath('map-stage.png'), animations: 'disabled' });
  await page.screenshot({ path: testInfo.outputPath('full-workspace.png'), fullPage: false, animations: 'disabled' });
});

test('uses the requested map icon semantics', async ({ page }) => {
  await expect(page.getByTestId('room-tool-normal').locator('[data-icon-id="R_NORMAL"]')).toHaveCount(1);

  await page.getByTestId('room-tool-normal').click();
  await page.getByTestId('map-cell-1-1').click();
  await expect(page.locator('.map-room-visual[data-room-type="normal"] [data-isaac-room-type]')).toHaveCount(0);

  await page.getByTestId('room-tool-blue').click();
  await page.getByTestId('map-cell-3-1').click();
  await expect(page.locator('.map-room-visual[data-room-type="blue"] [data-isaac-room-type]')).toHaveCount(0);

  await page.getByTestId('room-tool-red').click();
  await page.getByTestId('map-cell-5-1').click();
  const redRoom = page.locator('.map-room-visual[data-room-type="red"]');
  await expect(redRoom.locator('[data-isaac-room-type]')).toHaveCount(0);
  const redFilter = await redRoom.locator('.isaac-room-shape').evaluate((element) => getComputedStyle(element).filter);
  expect(redFilter).toContain('saturate(8.5)');

  await page.getByTestId('room-tool-secret-exit').click();
  await page.getByTestId('map-cell-7-1').click();
  await expect(page.locator('.map-room-visual[data-room-type="secret-exit"] [data-icon-id="R_CRAWLSPACE"]')).toHaveCount(1);

  await page.getByTestId('room-tool-other').click();
  await page.getByTestId('map-cell-9-1').click();
  await expect(page.locator('.map-room-visual[data-room-type="other"] [data-icon-id="R_UNKNOWN"]')).toHaveCount(1);
});

test('special rooms can use flexible shapes while fixed types stay constrained', async ({ page }) => {
  await page.getByTestId('room-tool-curse').click();
  await dragCells(page, [1, 2], [2, 2]);
  await expect(page.locator('.map-room-visual[data-room-type="curse"]')).toHaveAttribute('data-room-shape', '2x1');

  await page.getByTestId('room-tool-planetarium').click();
  await dragPath(page, [[8, 8], [9, 8], [9, 9]]);
  await expect(page.locator('.map-room-visual[data-room-type="planetarium"]')).toHaveAttribute('data-room-shape', 'LBL');

  await page.getByTestId('room-tool-shop').click();
  await dragCells(page, [3, 3], [4, 3]);
  await expect(page.locator('.map-room-visual[data-room-type="shop"]')).toHaveCount(0);

  await page.getByTestId('room-tool-boss').click();
  await page.getByTestId('map-cell-5-3').click();
  await page.getByTestId('room-shape-button').click();
  await expect(page.getByTestId('shape-option-2x2')).toBeVisible();
  await expect(page.getByTestId('shape-option-LTL')).toHaveCount(0);
});

test('inspector v2 edits type, shape, mark and grouped contents', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();
  await page.getByTestId('map-cell-3-4').click();

  await expect(page.getByTestId('room-type-select')).toBeVisible();
  await expect(page.getByText('Move', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Visited / revealed', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete room' })).toBeVisible();

  await page.getByTestId('room-type-select').selectOption('curse');
  await expect(page.locator('.map-room-visual[data-room-type="curse"]')).toHaveCount(1);

  await page.getByTestId('room-shape-button').click();
  await page.getByTestId('shape-option-2x1').click();
  await expect(page.locator('.map-room-visual[data-room-type="curse"]')).toHaveAttribute('data-room-shape', '2x1');

  await page.getByTestId('room-mark-checkbox').check();
  const markedRoom = page.locator('.map-room-visual[data-room-type="curse"]');
  await expect(markedRoom).toHaveAttribute('data-room-marked', 'true');
  const markFilter = await markedRoom.locator('.isaac-room-shape').evaluate((element) => getComputedStyle(element).filter);
  expect(markFilter).toContain('drop-shadow');

  await addContent(page, 'P_PENNY');
  await addContent(page, 'P_PENNY');
  const token = page.getByTestId('content-token-list').locator('.content-token').first();
  await expect(token).toContainText('×2');
  await token.click();
  await expect(page.getByTestId('content-token-list').locator('.content-token').first()).not.toContainText('×2');

  await page.getByTestId('add-content-button').click();
  await page.getByRole('button', { name: 'Structs', exact: true }).click();
  await page.getByTestId('marker-option-S_DONATION').click();
  await page.getByRole('button', { name: 'Close contents picker' }).click();
  await expect(page.getByTestId('content-token-list').locator('[data-icon-id="S_DONATION"]')).toHaveCount(1);
});

test('pixel icons keep valid intrinsic integer scaling', async ({ page }) => {
  const icons = page.locator('.palette-panel [data-icon-id]');
  await expect(icons.first()).toBeVisible();
  const metrics = await icons.evaluateAll((elements) => elements.map((element) => ({
    sourceWidth: Number(element.getAttribute('data-source-width')),
    sourceHeight: Number(element.getAttribute('data-source-height')),
    scale: Number(element.getAttribute('data-pixel-scale')),
    renderWidth: Number(element.getAttribute('data-render-width')),
    renderHeight: Number(element.getAttribute('data-render-height')),
  })));

  for (const metric of metrics) {
    expect(metric.sourceWidth).toBeGreaterThan(0);
    expect(metric.sourceHeight).toBeGreaterThan(0);
    expect(Number.isInteger(metric.scale)).toBeTruthy();
    expect(metric.scale).toBeGreaterThan(0);
    expect(metric.renderWidth).toBe(metric.sourceWidth * metric.scale);
    expect(metric.renderHeight).toBe(metric.sourceHeight * metric.scale);
  }
});

test('middle mouse drag pans the map without creating rooms', async ({ page }) => {
  const viewport = page.getByTestId('map-viewport');
  const surface = page.getByTestId('map-pan-surface');
  const viewportBox = await viewport.boundingBox();
  const before = await surface.boundingBox();
  if (!viewportBox || !before) throw new Error('Map viewport is not visible');

  const roomCountBefore = await page.locator('.map-room-visual').count();
  const startX = viewportBox.x + viewportBox.width / 2;
  const startY = viewportBox.y + viewportBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down({ button: 'middle' });
  await expect(viewport).toHaveClass(/is-panning/);
  await page.mouse.move(startX + 90, startY + 55, { steps: 8 });
  await page.mouse.up({ button: 'middle' });
  await expect(viewport).not.toHaveClass(/is-panning/);

  const after = await surface.boundingBox();
  if (!after) throw new Error('Map surface disappeared after panning');
  expect(after.x - before.x).toBeGreaterThan(70);
  expect(after.y - before.y).toBeGreaterThan(40);
  await expect(page.locator('.map-room-visual')).toHaveCount(roomCountBefore);
});
