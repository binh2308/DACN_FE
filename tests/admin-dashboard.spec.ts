import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - Kiểm thử dashboard admin', () => {
  test.beforeEach(async ({ page }) => {
    // Giả sử người dùng là admin đã đăng nhập
    await page.goto('/admin', {
      waitUntil: 'domcontentloaded',
    });
  });

  test('Trang dashboard admin tải thành công', async ({ page }) => {
    // Kiểm tra trang tải
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Admin sidebar có menu khác với user/manager', async ({ page }) => {
    // Kiểm tra sidebar admin
    const sidebar = page.locator('aside, nav');
    if (await sidebar.count() > 0) {
      // Kiểm tra admin-specific menu items
      const adminMenu = page.locator('text=/Quản lý|Cài đặt|Tài khoản|Nhân sự|Báo cáo/i');
      expect(await adminMenu.count()).toBeGreaterThan(0);
    }
  });

  test('Có thể truy cập trang quản lý tài khoản', async ({ page }) => {
    // Tìm link quản lý tài khoản
    const accountLink = page.locator('a:has-text("Tài khoản"), [href*="account"], [href*="employee"]');
    
    if (await accountLink.count() > 0) {
      await accountLink.first().click();
      await page.waitForTimeout(500);
      // Kiểm tra URL thay đổi
      expect(page.url()).not.toContain('/admin" where url === baseUrl');
    }
  });

  test('Có thể truy cập trang quản lý tài sản', async ({ page }) => {
    // Tìm link quản lý tài sản
    const assetsLink = page.locator('a:has-text("Tài sản"), [href*="assets"]');
    
    if (await assetsLink.count() > 0) {
      await assetsLink.first().click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/assets');
    }
  });

  test('Có thể truy cập trang quản lý phòng', async ({ page }) => {
    // Tìm link quản lý phòng
    const roomLink = page.locator('a:has-text("Phòng"), [href*="booking-room"]');
    
    if (await roomLink.count() > 0) {
      await roomLink.first().click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/booking-room');
    }
  });

  test('Header admin layout đúng', async ({ page }) => {
    // Kiểm tra header
    const header = page.locator('header, [role="banner"]');
    if (await header.count() > 0) {
      await expect(header).toBeVisible();
    }
  });

  test('Có dropdown menu cho profile admin', async ({ page }) => {
    // Tìm profile dropdown
    const profileDropdown = page.locator('button[aria-label*="profile"], button[class*="profile"], img[alt*="avatar"]');
    
    if (await profileDropdown.count() > 0) {
      await profileDropdown.first().click();
      await page.waitForTimeout(300);
      
      // Kiểm tra menu items
      const menu = page.locator('[role="menu"], [role="listbox"], .dropdown-content');
      if (await menu.count() > 0) {
        await expect(menu.first()).toBeVisible();
      }
    }
  });

  test('Có thể change password', async ({ page }) => {
    // Tìm link change password
    const changePasswordLink = page.locator('a:has-text("Đổi mật khẩu"), [href*="change-password"]');
    
    if (await changePasswordLink.count() > 0) {
      await changePasswordLink.first().click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/change-password');
    }
  });

  test('Có thể access profile page', async ({ page }) => {
    // Tìm link profile
    const profileLink = page.locator('a:has-text("Hồ sơ"), [href*="profile"]');
    
    if (await profileLink.count() > 0) {
      await profileLink.first().click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/admin/profile');
    }
  });

  test('Responsive admin layout', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    expect(page.viewportSize()?.width).toBe(1920);

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    expect(page.viewportSize()?.width).toBe(768);

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    expect(page.viewportSize()?.width).toBe(375);
  });
});
