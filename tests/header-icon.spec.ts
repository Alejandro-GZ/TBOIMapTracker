import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
});

test('uses the Blue Map icon in the header and as the tracker favicon', async ({ page }) => {
  const brandIcon = page.locator('.brand-mark img');
  await expect(brandIcon).toBeVisible();
  await expect(brandIcon).toHaveAttribute('src', /app-icon\.png$/);

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(faviconHref).toContain('/TBOIMapTracker/app-icon.png');

  const iconRendering = await brandIcon.evaluate((element) => getComputedStyle(element).imageRendering);
  expect(['pixelated', 'crisp-edges']).toContain(iconRendering);
});

test('content picker atlas sprites cannot inherit room recolour filters', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();
  await page.getByTestId('map-cell-6-6').click();
  await page.getByTestId('add-content-button').click();
  await page.getByRole('button', { name: 'Structs', exact: true }).click();

  const atlasImage = page.locator('.content-picker-option .minimap-icon-atlas-image').first();
  await expect(atlasImage).toBeVisible();

  const style = await atlasImage.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      filter: computed.filter,
      opacity: computed.opacity,
      mixBlendMode: computed.mixBlendMode,
    };
  });

  expect(style.filter).toBe('none');
  expect(style.opacity).toBe('1');
  expect(style.mixBlendMode).toBe('normal');
});
