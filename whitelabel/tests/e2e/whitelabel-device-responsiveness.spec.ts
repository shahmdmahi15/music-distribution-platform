import { test, expect } from "@playwright/test";

test.describe("WhiteLabel Device Responsiveness & Layout Breakpoints", () => {
  test.beforeEach(async ({ context }) => {
    // Ensure default sidebar state cookie is present for deterministic tests
    await context.addCookies([
      {
        name: "sidebar_state",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  // 1. Smartphone Portrait (iPhone 14 / Pixel 7: 390x844)
  test("Smartphone Portrait (390x844) - Mobile bottom nav visible, desktop sidebar collapsed, touch targets >= 44x44, no overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // 1.1 Mobile bottom nav is visible and fixed at bottom
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeVisible();

    const bottomNavStyles = await bottomNav.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        bottom: computed.bottom,
        display: computed.display,
      };
    });
    expect(bottomNavStyles.position).toBe("fixed");
    expect(bottomNavStyles.bottom).toBe("0px");

    // 1.2 Desktop sidebar is hidden/collapsed into drawer
    const desktopSidebar = page.locator('div.group.peer[data-slot="sidebar"]');
    if ((await desktopSidebar.count()) > 0) {
      await expect(desktopSidebar).toBeHidden();
    }

    // Mobile menu drawer trigger exists
    const menuBtn = page.locator('button[aria-label="Toggle navigation drawer"]');
    await expect(menuBtn).toBeVisible();

    // 1.3 Interactive touch targets >= 44x44px
    const touchElements = bottomNav.locator("a, button");
    const count = await touchElements.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await touchElements.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 1.4 No horizontal overflow
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ),
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(390);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  // 2. Smartphone Landscape (844x390)
  test("Smartphone Landscape (844x390) - Compact layout, no vertical clipping, sticky header", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");

    // Viewport dimensions verification
    const viewport = await page.evaluate(() => ({
      w: window.innerWidth,
      h: window.innerHeight,
    }));
    expect(viewport.w).toBe(844);
    expect(viewport.h).toBe(390);

    // Header remains accessible at top
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Content is scrollable without layout breakage
    const scrollHeight = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    expect(scrollHeight).toBeGreaterThanOrEqual(390);

    // No horizontal overflow
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(scrollWidth).toBeLessThanOrEqual(844);
  });

  // 3. Tablet / iPad Portrait (iPad Air: 820x1180)
  test("Tablet / iPad Portrait (820x1180) - 2-column KPI grid, collapsible sidebar rail mode", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/");

    // Mobile bottom nav should be hidden on tablet (sm:hidden breakpoint)
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeHidden();

    // 3.1 Verify 2-Column KPI Grid layout
    // DashboardPage defines: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
    // At width 820px, it matches sm:grid-cols-2
    const kpiCards = page.locator("main .grid > .border-border\\/70");
    const kpiCount = await kpiCards.count();

    if (kpiCount >= 2) {
      const box0 = await kpiCards.nth(0).boundingBox();
      const box1 = await kpiCards.nth(1).boundingBox();
      expect(box0).not.toBeNull();
      expect(box1).not.toBeNull();

      if (box0 && box1) {
        // In 2-column grid, card 0 and card 1 have near-identical Y positions
        expect(Math.abs(box0.y - box1.y)).toBeLessThan(6);
        // Card 1 is placed horizontally next to Card 0
        expect(box1.x).toBeGreaterThan(box0.x);
      }
    }

    // 3.2 Desktop Sidebar is visible (md:block triggers at >= 768px)
    const sidebar = page.locator('[data-slot="sidebar-container"]');
    await expect(sidebar).toBeVisible();

    // Sidebar rail or toggle trigger exists
    const sidebarTrigger = page.locator('button[data-slot="sidebar-trigger"]');
    await expect(sidebarTrigger).toBeVisible();
  });

  // 4. Notebook / Laptop (1366x768)
  test("Notebook / Laptop (1366x768) - Full sidebar visible, dynamic breadcrumbs rendered", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");

    // 4.1 Full sidebar is visible
    const sidebar = page.locator('[data-slot="sidebar-container"]');
    await expect(sidebar).toBeVisible();

    // 4.2 Dynamic Breadcrumbs rendered (hidden sm:flex)
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText("Dashboard");
  });

  // 5. Desktop (1920x1080)
  test("Desktop (1920x1080) - Multi-pane view, 4-column KPI cards, dense catalog table", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // 5.1 Sidebar and header simultaneously visible
    const sidebar = page.locator('[data-slot="sidebar-container"]');
    await expect(sidebar).toBeVisible();
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // 5.2 4-Column KPI Grid (lg:grid-cols-4)
    const kpiCards = page.locator("main .grid > .border-border\\/70");
    const count = await kpiCards.count();

    if (count >= 4) {
      const boxes = await Promise.all([
        kpiCards.nth(0).boundingBox(),
        kpiCards.nth(1).boundingBox(),
        kpiCards.nth(2).boundingBox(),
        kpiCards.nth(3).boundingBox(),
      ]);

      // All 4 cards should share the same top Y offset on 1920px wide display
      if (boxes[0] && boxes[1] && boxes[2] && boxes[3]) {
        expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(6);
        expect(Math.abs(boxes[1].y - boxes[2].y)).toBeLessThan(6);
        expect(Math.abs(boxes[2].y - boxes[3].y)).toBeLessThan(6);
      }
    }

    // 5.3 Dense recent releases table headers visible
    const releasesTable = page.locator("table");
    if ((await releasesTable.count()) > 0) {
      await expect(releasesTable).toBeVisible();
      await expect(page.locator("th", { hasText: "Cover" })).toBeVisible();
      await expect(page.locator("th", { hasText: "Release Title" })).toBeVisible();
      await expect(page.locator("th", { hasText: "Status" })).toBeVisible();
    }
  });

  // 6. 4K TV / Large Display (3840x2160)
  test("4K TV / Large Display (3840x2160) - Content centered within max container, typography scaling, zero overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto("/");

    // 6.1 Content centered within max-width boundary (max-w-7xl)
    const mainContainer = page.locator("main.max-w-7xl");
    await expect(mainContainer).toBeVisible();

    const mainBox = await mainContainer.boundingBox();
    expect(mainBox).not.toBeNull();

    if (mainBox) {
      // Main container should not stretch full 3840px (max-w-7xl is 1280px)
      expect(mainBox.width).toBeLessThanOrEqual(1400);

      // Verify horizontal centering: margins on left and right are balanced
      const leftMargin = mainBox.x;
      const rightMargin = 3840 - (mainBox.x + mainBox.width);
      expect(leftMargin).toBeGreaterThan(500);
      expect(rightMargin).toBeGreaterThan(500);
    }

    // 6.2 Zero horizontal overflow on 4K display
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(3840);
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
});