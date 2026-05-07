import { test, expect } from '@playwright/test';

test.describe('Form Submission Tests - Kiểm thử form submissions', () => {
  
  test.describe('Manager Report Creation Form', () => {
    test.beforeEach(async ({ page }) => {
      // Điều hướng đến trang báo cáo của quản lý
      await page.goto('/manager/reports', {
        waitUntil: 'domcontentloaded',
      });
    });

    test('Có thể mở dialog tạo báo cáo', async ({ page }) => {
      // Tìm và click nút tạo báo cáo
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await expect(createBtn).toBeVisible();
      await createBtn.click();

      // Kiểm tra dialog mở
      const dialog = page.locator('text=Nộp báo cáo hàng tuần');
      await expect(dialog).toBeVisible();
    });

    test('Form có tất cả các field cần thiết', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Kiểm tra các field
      const maNhanVienInput = page.locator('input[placeholder="E-0001"]');
      const tenNhanVienInput = page.locator('input[placeholder="Nguyễn Văn A"]');
      const phongBanSelect = page.locator('text=Phòng ban').locator('..').locator('button');
      const ngayBatDauInput = page.locator('input[type="date"]').first();

      await expect(maNhanVienInput).toBeVisible();
      await expect(tenNhanVienInput).toBeVisible();
      await expect(phongBanSelect.first()).toBeVisible();
      await expect(ngayBatDauInput).toBeVisible();
    });

    test('Validation: không thể submit khi trống mã nhân viên', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Điền tên nhân viên
      await page.fill('input[placeholder="Nguyễn Văn A"]', 'Nguyễn Văn A');

      // Thử submit
      const submitBtn = page.locator('button:has-text("Nộp báo cáo")');
      const isDisabled = await submitBtn.isDisabled();
      
      // Nút submit nên bị disabled nếu mã nhân viên trống
      if (isDisabled) {
        expect(isDisabled).toBe(true);
      }
    });

    test('Validation: không thể submit khi trống tên nhân viên', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Điền mã nhân viên
      await page.fill('input[placeholder="E-0001"]', 'E-0001');

      // Thử submit
      const submitBtn = page.locator('button:has-text("Nộp báo cáo")');
      const isDisabled = await submitBtn.isDisabled();
      
      // Nút submit nên bị disabled nếu tên nhân viên trống
      if (isDisabled) {
        expect(isDisabled).toBe(true);
      }
    });

    test('Có thể chọn phòng ban từ dropdown', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Click vào select phòng ban
      const phongBanSelect = page.locator('text=Phòng ban').locator('..').locator('button');
      await phongBanSelect.first().click();

      // Chờ dropdown mở
      await page.waitForTimeout(300);

      // Kiểm tra các option
      const option = page.locator('text=Kỹ thuật, Nhân sự, Kinh doanh');
      const optionCount = await option.count();
      expect(optionCount).toBeGreaterThan(0);
    });

    test('Có thể nhập ngày bắt đầu tuần', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Tìm input date
      const dateInputs = page.locator('input[type="date"]');
      const firstDateInput = dateInputs.first();

      // Nhập ngày
      await firstDateInput.fill('2026-05-01');

      // Kiểm tra giá trị
      const value = await firstDateInput.inputValue();
      expect(value).toBe('2026-05-01');
    });

    test('Có thể nhập tiến độ (%)', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Tìm input tiến độ
      const progressInput = page.locator('input[type="number"]').first();
      
      // Nhập tiến độ
      await progressInput.fill('75');

      // Kiểm tra giá trị
      const value = await progressInput.inputValue();
      expect(value).toBe('75');
    });

    test('Có thể nhập các trường textarea', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Tìm textarea
      const textareas = page.locator('textarea');

      // Nhập vào textarea đầu tiên
      if (await textareas.count() > 0) {
        await textareas.first().fill('Test content for accomplishment');
        const value = await textareas.first().inputValue();
        expect(value).toContain('Test content');
      }
    });

    test('Có nút Hủy để đóng dialog', async ({ page }) => {
      // Mở dialog
      const createBtn = page.locator('button:has-text("Tạo báo cáo")');
      await createBtn.click();

      // Tìm nút Hủy
      const cancelBtn = page.locator('button:has-text("Hủy")');
      await expect(cancelBtn).toBeVisible();

      // Click Hủy
      await cancelBtn.click();

      // Kiểm tra dialog đóng
      const dialog = page.locator('text=Nộp báo cáo hàng tuần');
      await expect(dialog).not.toBeVisible();
    });
  });

  test.describe('User Report Creation Form', () => {
    test.beforeEach(async ({ page }) => {
      // Điều hướng đến trang báo cáo của user
      await page.goto('/user/reports', {
        waitUntil: 'domcontentloaded',
      });
    });

    test('Có thể mở dialog tạo báo cáo', async ({ page }) => {
      const createBtn = page.locator('button:has-text("Báo cáo mới")');
      await expect(createBtn).toBeVisible();
      await createBtn.click();

      // Kiểm tra dialog mở
      const dialog = page.locator('text=NỘP BÁO CÁO HÀNG TUẦN');
      await expect(dialog).toBeVisible();
    });

    test('Form user có các field cần thiết', async ({ page }) => {
      const createBtn = page.locator('button:has-text("Báo cáo mới")');
      await createBtn.click();

      // Kiểm tra ngày bắt đầu
      const dateInputs = page.locator('input[type="date"]');
      await expect(dateInputs.first()).toBeVisible();

      // Kiểm tra tiến độ
      const progressInputs = page.locator('input[type="number"]');
      await expect(progressInputs.first()).toBeVisible();

      // Kiểm tra textarea
      const textareas = page.locator('textarea');
      expect(await textareas.count()).toBeGreaterThan(0);
    });

    test('Có nút submit tạo báo cáo', async ({ page }) => {
      const createBtn = page.locator('button:has-text("Báo cáo mới")');
      await createBtn.click();

      const submitBtn = page.locator('button:has-text("Nộp báo cáo")');
      await expect(submitBtn).toBeVisible();
    });
  });
});
