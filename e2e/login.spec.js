import { expect, test } from "@playwright/test";

test.describe("Login & Demo Mode Flow", () => {
	test("should successfully enter demo mode from login page", async ({
		page,
	}) => {
		await page.goto("/", { waitUntil: "domcontentloaded" });

		// Verify we are on login page
		await expect(page.locator(".login-box")).toBeVisible();

		// Click on Demo Mode
		const demoModeBtn = page.locator("#demoModeBtn");
		await demoModeBtn.click();

		// Wait for the redirect to dashboard
		await page.waitForURL("**/dashboard.html**", { timeout: 10000 });

		// Expecting some dashboard elements
		await expect(page.locator(".sidebar")).toBeVisible();
		await expect(page.locator(".main-content")).toBeVisible();
	});
});
