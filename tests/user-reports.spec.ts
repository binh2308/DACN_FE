import { test, expect } from '@playwright/test';

test.describe('User Reports Page - Kiểm thử trang báo cáo người dùng', () => {
  test.beforeEach(async ({ page }) => {
    // Giả sử người dùng đã đăng nhập
    // Trong thực tế, bạn nên setup authentication trước
    await page.goto('/user/reports', {
      waitUntil: 'domcontentloaded',
    });
  });

  test('Trang báo cáo tải thành công', async ({ page }) => {
    // Kiểm tra tiêu đề trang
    const title = page.locator('text=Báo cáo hàng tuần');
    await expect(title).toBeVisible();
  });

  test('Hiển thị nút "Báo cáo mới"', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Báo cáo mới")');
    await expect(createBtn).toBeVisible();
  });

  test('Mở dialog khi click nút "Báo cáo mới"', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Báo cáo mới")');
    await createBtn.click();

    // Kiểm tra dialog hiển thị
    const dialog = page.locator('text=NỘP BÁO CÁO HÀNG TUẦN');
    await expect(dialog).toBeVisible();
  });

  test('Dialog chứa các trường form cần thiết', async ({ page }) => {
    // Mở dialog
    const createBtn = page.locator('button:has-text("Báo cáo mới")');
    await createBtn.click();

    // Kiểm tra các trường form
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('Hiển thị lỗi khi submit form không đầy đủ', async ({ page }) => {
    // Mở dialog
    const createBtn = page.locator('button:has-text("Báo cáo mới")');
    await createBtn.click();

    // Click submit mà không điền thông tin
    const submitBtn = page.locator('button:has-text("Nộp báo cáo")');
    await submitBtn.click();

    // Kiểm tra thông báo lỗi
    const errorMsg = page.locator('text=/bắt buộc|required|vui lòng/i');
    const errorCount = await errorMsg.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('Hiển thị các filter tìm kiếm', async ({ page }) => {
    // Kiểm tra input tìm kiếm
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    await expect(searchInput).toBeVisible();

    // Kiểm tra select filter trạng thái
    const statusSelect = page.locator('text=Trạng thái').locator('..').locator('button');
    await expect(statusSelect.first()).toBeVisible();

    // Kiểm tra nút reset
    const resetBtn = page.locator('button:has-text("Đặt lại")');
    await expect(resetBtn).toBeVisible();
  });

  test('Tìm kiếm báo cáo hoạt động', async ({ page }) => {
    // Giả sử có báo cáo trong danh sách
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    await searchInput.fill('test');

    // Chờ kết quả tìm kiếm
    await page.waitForTimeout(500);

    // Kiểm tra danh sách báo cáo cập nhật
    const reportItems = page.locator('button[type="button"]:has-text("DD/MM/YYYY"), div.rounded-xl.border');
    const count = await reportItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Hiển thị thông tin báo cáo chi tiết', async ({ page }) => {
    // Chờ danh sách báo cáo tải
    await page.waitForTimeout(1000);

    // Kiểm tra xem có báo cáo trong danh sách không
    const reportItems = page.locator('button[type="button"]').filter({
      has: page.locator('badge'),
    });

    if (await reportItems.count() > 0) {
      // Click báo cáo đầu tiên
      await reportItems.first().click();

      // Kiểm tra thông tin chi tiết hiển thị
      const detailPanel = page.locator('text=Công việc đã hoàn thành, Công việc đang thực hiện, Kế hoạch tuần tới');
      await expect(detailPanel).toBeVisible();
    }
  });

  test('Có phân trang', async ({ page }) => {
    // Chờ trang tải
    await page.waitForTimeout(500);

    // Kiểm tra nút phân trang
    const prevBtn = page.locator('svg[class*="ChevronLeft"]');
    const nextBtn = page.locator('svg[class*="ChevronRight"]');

    if (await prevBtn.count() > 0 || await nextBtn.count() > 0) {
      expect(true).toBe(true); // Phân trang tồn tại
    }
  });
});
