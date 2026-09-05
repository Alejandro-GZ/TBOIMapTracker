import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('./');
});

test('uses the Blue Map icon as unboxed tracker branding and favicon', async ({ page }) => {
  const brandMark = page.locator('.brand-mark');
  const brandIcon = brandMark.locator('img');
  const title = page.locator('.brand strong');

  await expect(brandIcon).toBeVisible();
  await expect(brandIcon).toHaveAttribute('src', /app-icon\.png$/);

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(faviconHref).toContain('/TBOIMapTracker/app-icon.png');

  const iconRendering = await brandIcon.evaluate((element) => getComputedStyle(element).imageRendering);
  expect(['pixelated', 'crisp-edges']).toContain(iconRendering);

  const markStyle = await brandMark.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      borderTopWidth: computed.borderTopWidth,
      boxShadow: computed.boxShadow,
      backgroundColor: computed.backgroundColor,
    };
  });
  expect(markStyle.borderTopWidth).toBe('0px');
  expect(markStyle.boxShadow).toBe('none');
  expect(markStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');

  const titleSize = await title.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(titleSize).toBeGreaterThanOrEqual(19);
});

test('re-supplied structure sprites render from their exact individual PNGs', async ({ page }) => {
  await page.getByTestId('room-tool-normal').click();
  await page.getByTestId('map-cell-6-6').click();
  await page.getByTestId('add-content-button').click();
  await page.getByRole('button', { name: 'Structs', exact: true }).click();

  const sprite = page.locator('.content-picker-option [data-icon-id="S_BEGGAR"]').first();
  await expect(sprite).toBeVisible();
  await expect(sprite).toHaveAttribute('data-render-source', 'direct');

  const directImage = sprite.locator('.minimap-icon-direct-image');
  await expect(directImage).toBeVisible();
  await expect(directImage).toHaveAttribute('src', /S_BEGGAR-[^/]*\.png$|S_BEGGAR\.png$/);

  const metrics = await directImage.evaluate((element: HTMLImageElement) => {
    const computed = getComputedStyle(element);
    return {
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      filter: computed.filter,
      opacity: computed.opacity,
      mixBlendMode: computed.mixBlendMode,
    };
  });

  expect(metrics.naturalWidth).toBe(7);
  expect(metrics.naturalHeight).toBe(7);
  expect(metrics.filter).toBe('none');
  expect(metrics.opacity).toBe('1');
  expect(metrics.mixBlendMode).toBe('normal');
});
