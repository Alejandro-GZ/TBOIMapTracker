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

  const treasureRoom = page.locator('.map-room-visual[data-room-type="treasure"]').first();
  const treasureShape = treasureRoom.locator('.isaac-room-shape');
  const treasureIcon = treasureRoom.locator('img[data-isaac-room-type="treasure"]');
  await expect(treasureShape).toHaveCSS('opacity', '1');
  await expect(treasureIcon).toHaveCSS('opacity', '1');
  expect(Number(await treasureRoom.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--room-art-scale').trim(),
  ))).toBeCloseTo(1.88, 2);

  const treasureIconBox = await treasureIcon.boundingBox();
  expect(treasureIconBox?.width ?? 0).toBeGreaterThanOrEqual(30);

  const horizontalRoom = page.locator('[data-room-shape="2x1"]').first();
  await expect(horizontalRoom.locator('.isaac-room-shape')).toHaveCSS('object-fit', 'contain');
  expect(Number(await horizontalRoom.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--room-art-scale').trim(),
  ))).toBeCloseTo(1.875, 3);
  await expect(page.locator('[data-room-shape="2x2"]')).toHaveCount(1);
  await expect(page.locator('[data-room-shape="LBL"]')).toHaveCount(1);

  for (const selector of ['.top-paper-frame', '.palette-panel', '.inspector-panel']) {
    const backgroundImage = await page.locator(selector).evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(backgroundImage).not.toBe('none');
  }

  await expect(page.getByTestId('room-pickup-layer')).toBeVisible();
  await expect(page.getByTestId('map-door-layer')).toHaveCount(0);
  await expect(page.locator('.map-status')).toHaveCount(0);
  await expect(page.locator('.room-drag-help')).toHaveCount(0);
  await expect(page.locator('.dimension-bar')).toHaveCount(0);

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

test('uses iconless normal/colour rooms and fills the left paper menu', async ({ page }) => {
  const paletteNormalIcon = page.getByTestId('room-tool-normal').locator('img[data-isaac-room-type="normal"]');
  await expect(paletteNormalIcon).toBeVisible();

  await page.getByTestId('room-tool-normal').click();
  await page.getByTestId('map-cell-1-1').click();
  const normalRoom = page.locator('.map-room-visual[data-room-type="normal"]');
  await expect(normalRoom).toHaveCount(1);
  await expect(normalRoom.locator('[data-isaac-room-type="normal"]')).toHaveCount(0);

  await page.getByTestId('room-tool-blue').click();
  await page.getByTestId('map-cell-4-1').click();
  const blueRoom = page.locator('.map-room-visual[data-room-type="blue"]');
  await expect(blueRoom).toHaveCount(1);
  await expect(blueRoom.locator('[data-isaac-room-type="blue"]')).toHaveCount(0);
  const blueFilter = await blueRoom.locator('.isaac-room-shape').evaluate((element) => getComputedStyle(element).filter);
  expect(blueFilter).not.toBe('none');

  await page.getByTestId('room-tool-red').click();
  await page.getByTestId('map-cell-6-1').click();
  const redRoom = page.locator('.map-room-visual[data-room-type="red"]');
  await expect(redRoom).toHaveCount(1);
  await expect(redRoom.locator('[data-isaac-room-type="red"]')).toHaveCount(0);
  const redFilter = await redRoom.locator('.isaac-room-shape').evaluate((element) => getComputedStyle(element).filter);
  expect(redFilter).not.toBe('none');
  expect(redFilter).not.toBe(blueFilter);

  await expect(page.getByTestId('room-tool-red')).toBeVisible();
  const paletteLayout = await page.locator('.palette-panel').evaluate((panel) => {
    const rect = panel.getBoundingClientRect();
    const groups = Array.from(panel.querySelectorAll('.palette-group')).map((group) => group.getBoundingClientRect());
    const lastTool = panel.querySelector('.palette-group-hidden .room-tool:last-child')?.getBoundingClientRect();
    return {
      display: getComputedStyle(panel).display,
      clientHeight: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
      panelTop: rect.top,
      panelBottom: rect.bottom,
      groupTop: groups[0]?.top ?? 0,
      groupBottom: groups.at(-1)?.bottom ?? 0,
      lastToolBottom: lastTool?.bottom ?? 0,
    };
  });
  expect(paletteLayout.display).toBe('grid');
  expect(paletteLayout.scrollHeight).toBeLessThanOrEqual(paletteLayout.clientHeight + 1);
  expect(paletteLayout.groupTop).toBeGreaterThanOrEqual(paletteLayout.panelTop);
  expect(paletteLayout.groupBottom).toBeLessThanOrEqual(paletteLayout.panelBottom + 1);
  expect(paletteLayout.lastToolBottom).toBeLessThanOrEqual(paletteLayout.panelBottom + 1);
});

test('uses the requested main-only chrome, special icons and grid layering', async ({ page }) => {
  await expect(page.locator('.dimension-bar')).toHaveCount(0);

  const startIcon = page.locator('.map-room-visual[data-room-type="start"] [data-isaac-room-type="start"]');
  await expect(startIcon).toHaveText('S');

  await page.getByTestId('room-tool-error').click();
  await page.getByTestId('map-cell-3-1').click();
  await expect(page.locator('.map-room-visual[data-room-type="error"] [data-isaac-room-type="error"]')).toHaveText('ERR');

  await page.getByTestId('room-tool-black-market').click();
  await dragCells(page, [8, 1], [9, 1]);
  await waitForArt(page);
  const blackMarketIcon = page.locator('.map-room-visual[data-room-type="black-market"] img[data-isaac-room-type="black-market"]');
  await expect(blackMarketIcon).toHaveClass(/isaac-room-type-black-market/);
  expect(await blackMarketIcon.getAttribute('src')).toContain('/roomtypes/2.png');

  await page.getByRole('button', { name: 'Grid', exact: true }).click();
  await expect(page.getByTestId('map-cell-0-0')).toHaveCSS('border-top-style', 'dashed');
  await expect(page.getByTestId('map-cell-6-6')).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');

  const vignette = await page.locator('.app-shell').evaluate((element) => {
    const style = getComputedStyle(element, '::after');
    return { background: style.backgroundImage, zIndex: style.zIndex };
  });
  expect(vignette.background).toContain('radial-gradient');
  expect(vignette.zIndex).toBe('20');
  await expect(page.locator('.palette-panel')).toHaveCSS('z-index', '30');

  const gridButtonColor = await page.getByRole('button', { name: 'Grid', exact: true }).evaluate((element) => getComputedStyle(element).color);
  expect(gridButtonColor).not.toBe('rgb(169, 160, 149)');
});

test('dragging cells creates horizontal, vertical and L Isaac footprints for normal rooms', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();

  await dragCells(page, [1, 1], [2, 1]);
  await expect(page.locator('[data-room-shape="2x1"]')).toHaveCount(1);

  await dragCells(page, [10, 1], [10, 2]);
  await expect(page.locator('[data-room-shape="1x2"]')).toHaveCount(1);

  await dragPath(page, [[8, 9], [9, 9], [9, 10]]);
  await expect(page.locator('[data-room-shape="LBL"]')).toHaveCount(1);
});

test('room types expose and accept only their valid shapes', async ({ page }) => {
  await page.getByTestId('room-tool-shop').click();
  await dragCells(page, [1, 1], [2, 1]);
  await expect(page.locator('.map-room-visual[data-room-type="shop"]')).toHaveCount(0);

  await page.getByTestId('room-tool-boss').click();
  await page.getByTestId('map-cell-3-3').click();
  await expect(page.getByTestId('shape-option-2x2')).toBeVisible();
  await expect(page.getByTestId('shape-option-LTL')).toHaveCount(0);

  await page.getByTestId('room-tool-black-market').click();
  await dragCells(page, [8, 3], [9, 3]);
  const blackMarket = page.locator('.map-room-visual[data-room-type="black-market"]');
  await expect(blackMarket).toHaveCount(1);
  await expect(blackMarket).toHaveAttribute('data-room-shape', '2x1');

  await page.getByTestId('room-tool-red').click();
  await dragCells(page, [5, 9], [6, 9]);
  await expect(page.locator('.map-room-visual[data-room-type="red"]')).toHaveCount(0);
});

test('normal rooms can switch to canonical corridor and L previews', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();
  await page.getByTestId('map-cell-3-3').click();
  await page.getByTestId('shape-option-LTL').click();
  await waitForArt(page);

  const room = page.locator('[data-room-shape="LTL"]').first();
  await expect(room).toBeVisible();
  const image = room.locator('img[data-isaac-shape="LTL"]');
  await expect(image).toBeVisible();
  expect(await image.getAttribute('src')).toContain('/roomshapes/9.png');
});
