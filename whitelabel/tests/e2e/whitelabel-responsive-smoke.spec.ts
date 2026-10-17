import { test, expect } from "@playwright/test";

test.describe("WhiteLabel Responsive Smoke & Accessibility Test Suite", () => {
  test.describe("Desktop Viewport (1280x800)", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("expanded navigation is visible and navigation links work", async ({
      page,
    }) => {
      await page.goto("/");

      // 1. Navigation header is visible
      const header = page.locator("header");
      await expect(header).toBeVisible();

      // 2. Desktop navigation links are visible
      const desktopNav = header.locator("nav");
      await expect(desktopNav).toBeVisible();

      const releasesLink = header.locator('nav a[href="/releases"]');
      await expect(releasesLink).toBeVisible();
      await expect(releasesLink).toContainText("Releases");

      const reportsLink = header.locator('nav a[href="/reports"]');
      await expect(reportsLink).toBeVisible();
      await expect(reportsLink).toContainText("Reports");

      const sessionsLink = header.locator('nav a[href="/sessions"]');
      await expect(sessionsLink).toBeVisible();
      await expect(sessionsLink).toContainText("Sessions");

      // 3. Navigation interaction works
      await releasesLink.click();
      await expect(page).toHaveURL(/\/releases/);
    });

    test("theme toggle toggles .dark class on html element", async ({ page }) => {
      await page.goto("/");

      const html = page.locator("html");
      const themeToggle = page.locator('button[title="Toggle Theme"]');
      await expect(themeToggle).toBeVisible();

      const initialIsDark = await html.evaluate((el) =>
        el.classList.contains("dark")
      );

      // Click to toggle theme
      await themeToggle.click();

      // Verify the dark class changed state
      const toggledIsDark = await html.evaluate((el) =>
        el.classList.contains("dark")
      );
      expect(toggledIsDark).toBe(!initialIsDark);

      // Click again to toggle back
      await themeToggle.click();
      const revertedIsDark = await html.evaluate((el) =>
        el.classList.contains("dark")
      );
      expect(revertedIsDark).toBe(initialIsDark);
    });

    test("sidebar or navigation controls render correctly without horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/");

      // Verify no horizontal scroll on desktop
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      );
      expect(scrollWidth).toBeLessThanOrEqual(1280);
    });
  });

  test.describe("Tablet Viewport (768x1024)", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("sidebar/navbar collapses or adapts cleanly, 2-column card grid does not overflow horizontally", async ({
      page,
    }) => {
      await page.goto("/");

      // 1. Check body width and document scrollWidth
      const isOverflowing = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth > window.innerWidth ||
          document.body.scrollWidth > window.innerWidth
        );
      });
      expect(isOverflowing).toBe(false);

      // 2. Card grid on Dashboard does not overflow horizontally
      const cardGrid = page.locator(".grid");
      if ((await cardGrid.count()) > 0) {
        const firstGrid = cardGrid.first();
        const gridBox = await firstGrid.boundingBox();
        if (gridBox) {
          expect(gridBox.width).toBeLessThanOrEqual(768);
        }
      }

      // 3. Header maintains clean layout on tablet
      const header = page.locator("header");
      await expect(header).toBeVisible();
    });
  });

  test.describe("Mobile Viewport (375x667 - iPhone SE)", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("desktop sidebar is hidden, mobile drawer opens slide-over sheet", async ({
      page,
    }) => {
      await page.goto("/");

      // 1. Desktop navigation is hidden on mobile
      const desktopNav = page.locator("header nav.hidden.md\\:flex, header nav");
      if ((await desktopNav.count()) > 0) {
        await expect(desktopNav.first()).toBeHidden();
      }

      // 2. Mobile drawer trigger (menu button) is visible
      const mobileMenuBtn = page.locator('button[title="Toggle Menu"]');
      await expect(mobileMenuBtn).toBeVisible();

      // 3. Clicking trigger opens mobile drawer menu
      await mobileMenuBtn.click();

      // The mobile drawer is open and shows navigation links
      const mobileDrawer = page.locator("header div.md\\:hidden");
      await expect(mobileDrawer).toBeVisible();

      const drawerReleasesLink = mobileDrawer.locator('a[href="/releases"]');
      await expect(drawerReleasesLink).toBeVisible();

      const drawerReportsLink = mobileDrawer.locator('a[href="/reports"]');
      await expect(drawerReportsLink).toBeVisible();

      // 4. Clicking trigger again closes the drawer
      await mobileMenuBtn.click();
      await expect(mobileDrawer).toBeHidden();
    });

    test("tables permit horizontal scroll without body blowout (scrollWidth <= 375)", async ({
      page,
    }) => {
      // Navigate to reports page where data tables reside
      await page.goto("/reports");

      // Verify body does not blow out horizontally on mobile
      const bodyScrollWidth = await page.evaluate(
        () => document.body.scrollWidth
      );
      const windowWidth = await page.evaluate(() => window.innerWidth);

      expect(bodyScrollWidth).toBeLessThanOrEqual(375);
      expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth);

      // Verify table wrapper permits horizontal scroll
      const tableWrapper = page.locator(".overflow-x-auto");
      if ((await tableWrapper.count()) > 0) {
        await expect(tableWrapper.first()).toBeVisible();
        const hasOverflowAuto = await tableWrapper.first().evaluate((el) => {
          const style = window.getComputedStyle(el);
          return (
            style.overflowX === "auto" ||
            style.overflowX === "scroll" ||
            el.classList.contains("overflow-x-auto")
          );
        });
        expect(hasOverflowAuto).toBe(true);
      }
    });
  });
});
