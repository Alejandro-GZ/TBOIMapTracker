import { expect, test } from '@playwright/test';

const NEW_ROOM_ICONS = [
  ['dirty-bedroom', 'R_BARREN'],
  ['chest-room', 'R_CHEST'],
  ['mirror', 'R_MIRROR'],
  ['rails', 'R_RAILS'],
  ['red-treasure', 'R_RTREASURE'],
  ['silver-treasure', 'R_STREASURE'],
  ['teleporter', 'R_TELEPORTER'],
] as const;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
  await expect(page.getByTestId('map-viewport')).toBeVisible();
});

test('room palette enters paint mode and occupied cells are a paint no-op', async ({ page }) => {
  await expect(page.getByTestId('map-tool-move')).toHaveClass(/active-button/);

  await page.getByTestId('room-tool-mirror').click();
  await expect(page.getByTestId('map-tool-paint')).toHaveClass(/active-button/);

  await page.getByTestId('map-cell-2-2').click();
  await expect(page.locator('.map-room-visual[data-room-type="mirror"]')).toHaveCount(1);

  await page.getByTestId('room-tool-boss').click();
  await page.getByTestId('map-cell-2-2').click();
  await expect(page.locator('.map-room-visual[data-room-type="mirror"]')).toHaveCount(1);
  await expect(page.locator('.map-room-visual[data-room-type="boss"]')).toHaveCount(0);
});

test('all seven newly exposed room icons render from the minimap atlas', async ({ page }) => {
  const positions = [[1, 1], [3, 1], [5, 1], [7, 1], [9, 1], [11, 1], [1, 3]] as const;

  for (let index = 0; index < NEW_ROOM_ICONS.length; index += 1) {
    const [type, icon] = NEW_ROOM_ICONS[index];
    const [x, y] = positions[index];
    await page.getByTestId(`room-tool-${type}`).click();
    await page.getByTestId(`map-cell-${x}-${y}`).click();
    await expect(page.locator(`.map-room-visual[data-room-type="${type}"] [data-icon-id="${icon}"]`)).toHaveCount(1);
  }
});

test('erase tool and inspector delete remove rooms without confirmation dialogs', async ({ page }) => {
  let dialogCount = 0;
  page.on('dialog', async (dialog) => {
    dialogCount += 1;
    await dialog.dismiss();
  });

  await page.getByTestId('room-tool-teleporter').click();
  await page.getByTestId('map-cell-2-2').click();
  await expect(page.locator('.map-room-visual[data-room-type="teleporter"]')).toHaveCount(1);

  await page.getByTestId('map-tool-erase').click();
  await page.getByTestId('map-cell-2-2').click();
  await expect(page.locator('.map-room-visual[data-room-type="teleporter"]')).toHaveCount(0);
  expect(dialogCount).toBe(0);

  await page.getByTestId('room-tool-chest-room').click();
  await page.getByTestId('map-cell-4-4').click();
  await page.getByTestId('map-tool-move').click();
  await page.getByTestId('map-cell-4-4').click();
  await page.getByRole('button', { name: 'Delete room' }).click();

  await expect(page.locator('.map-room-visual[data-room-type="chest-room"]')).toHaveCount(0);
  expect(dialogCount).toBe(0);
});
