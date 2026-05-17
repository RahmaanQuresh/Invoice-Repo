import { test, expect } from "@playwright/test";

/**
 * E2E tests for the DeathFear subscription flow.
 *
 * Prerequisites:
 * - Next.js dev server running on localhost:3000
 * - Database seeded with Free + Premium plans
 * - Test user exists with:
 *     email: process.env.TEST_USER_EMAIL || "test@example.com"
 *     password: process.env.TEST_USER_PASSWORD || "TestPass123!"
 *
 * Run:
 *   npm run dev              # Start dev server
 *   npx playwright test      # Run headless
 *   npx playwright test --ui # Run with UI mode
 */

test.describe("Subscription Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as a test user before each test
    const email = process.env.TEST_USER_EMAIL || "test@example.com";
    const password = process.env.TEST_USER_PASSWORD || "TestPass123!";

    await page.goto("/auth/signin");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/app/dashboard");
  });

  test("should display plan comparison page with Free and Premium plans", async ({ page }) => {
    await page.goto("/app/subscribe");

    // Wait for loading to complete
    await page.waitForSelector("text=Choose Your Plan");

    // Verify both plan cards are displayed
    await expect(page.locator("h3:has-text('Free')")).toBeVisible();
    await expect(page.locator("h3:has-text('Premium')")).toBeVisible();

    // Verify billing toggle exists
    await expect(page.locator("text=Monthly")).toBeVisible();
    await expect(page.locator("text=Annual")).toBeVisible();

    // Verify Free plan has a "Get Started Free" button
    await expect(page.locator('button:has-text("Get Started Free")')).toBeVisible();
  });

  test("should toggle between monthly and annual billing", async ({ page }) => {
    await page.goto("/app/subscribe");

    // Default is monthly — click Annual
    await page.click("text=Annual");

    // Verify annual savings badge appears (e.g., "Save X% with annual billing")
    await expect(page.locator("text=Save")).toBeVisible();
  });

  test("should show payment methods when Premium Subscribe button is clicked", async ({ page }) => {
    await page.goto("/app/subscribe");

    // Wait for plans to load
    await page.waitForSelector("text=Choose Your Plan");

    // Click the "Subscribe" button on the Premium plan card
    await page.locator('button:has-text("Subscribe")').click();

    // Payment section should appear below the plan cards
    await expect(page.locator("text=Complete Your Subscription")).toBeVisible();
    await expect(page.locator("text=Payment Method")).toBeVisible();
  });

  test("should show UPI input when Razorpay/UPI is selected", async ({ page }) => {
    await page.goto("/app/subscribe");
    await page.waitForSelector("text=Choose Your Plan");

    // Select Premium by clicking Subscribe button
    await page.locator('button:has-text("Subscribe")').click();
    await page.waitForSelector("text=Complete Your Subscription");

    // The PaymentMethodSelector renders options as buttons
    // Try clicking the Razorpay/UPI option
    const upiButton = page.locator('button:has-text("UPI"), button:has-text("Razorpay")').first();
    await expect(upiButton).toBeVisible();
    await upiButton.click();

    // UPI input should appear
    const upiInput = page.locator('input[type="text"]').and(page.locator('[placeholder*="upi"]')).first();
    await expect(upiInput).toBeVisible();
  });

  test("should show Free plan confirmation when Get Started Free is clicked", async ({ page }) => {
    await page.goto("/app/subscribe");
    await page.waitForSelector("text=Choose Your Plan");

    // Click the "Get Started Free" button on the Free plan
    await page.locator('button:has-text("Get Started Free")').click();

    // Confirmation card should appear
    await expect(page.locator("text=Free Plan Selected")).toBeVisible();
    await expect(page.locator('button:has-text("Go to Dashboard")')).toBeVisible();
  });

  test("should navigate back to dashboard from subscribe page", async ({ page }) => {
    await page.goto("/app/subscribe");
    await page.waitForSelector("text=Choose Your Plan");

    // Click "Back to Dashboard" link
    await page.click("text=Back to Dashboard");

    // Should navigate to dashboard
    await expect(page).toHaveURL(/.*app\/dashboard/);
  });

  test("should show Terms and Privacy links on the payment section", async ({ page }) => {
    await page.goto("/app/subscribe");
    await page.waitForSelector("text=Choose Your Plan");

    // Select Premium to show payment section
    await page.locator('button:has-text("Subscribe")').click();
    await page.waitForSelector("text=Complete Your Subscription");

    // Terms and Privacy links should be present
    await expect(page.locator('a:has-text("Terms of Service")')).toBeVisible();
    await expect(page.locator('a:has-text("Privacy Policy")')).toBeVisible();
  });

  test("should show subscription canceled toast when query param is present", async ({ page }) => {
    await page.goto("/app/subscribe?subscription=canceled");

    // Toast should appear indicating the subscription was canceled
    await expect(page.locator("text=Subscription process was canceled")).toBeVisible();
  });
});
