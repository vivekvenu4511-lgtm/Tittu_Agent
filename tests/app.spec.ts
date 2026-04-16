import { test, expect } from "@playwright/test";

test.describe("Tittu Agent", () => {
  test("should load the main page", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Check for the app title
    await expect(page.locator("text=Tittu Agent")).toBeVisible();
  });

  test("should show welcome message", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Check for welcome message
    await expect(page.locator("text=Welcome to Tittu Agent")).toBeVisible();
  });

  test("should have model selector", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Check for model selector
    await expect(
      page.locator("select, [class*='select'], [id*='model']"),
    ).toBeVisible();
  });

  test("should have chat input", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Check for chat input
    await expect(page.locator("textarea, input[type='text']")).toBeVisible();
  });
});

test.describe("Settings Modal", () => {
  test("should open settings", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Click settings button
    await page.click('[class*="settings"], button:has-text("Settings")');

    // Check settings modal
    await expect(page.locator("text=Settings")).toBeVisible();
  });
});
