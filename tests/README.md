# Hướng dẫn Kiểm thử Playwright

## Giới thiệu

Dự án này sử dụng **Playwright** để thực hiện kiểm thử tích hợp (E2E - End-to-End Testing) cho hệ thống HR.

## Cài đặt

Playwright đã được cài đặt là devDependency. Nếu chưa, chạy:

```bash
pnpm install
```

## Cấu trúc Test Files

```
tests/
├── login.spec.ts              # Kiểm thử trang đăng nhập
├── user-reports.spec.ts       # Kiểm thử trang báo cáo người dùng
├── manager-dashboard.spec.ts  # Kiểm thử dashboard quản lý
├── admin-dashboard.spec.ts    # Kiểm thử dashboard admin
└── form-submission.spec.ts    # Kiểm thử form submissions
```

## Lệnh chạy kiểm thử

### 1. Chạy tất cả tests (Headless mode)
```bash
pnpm run test:e2e
```
Tests sẽ chạy ở chế độ headless (không hiển thị browser).

### 2. Chạy tests với UI Mode (Recommended)
```bash
pnpm run test:e2e:ui
```
Mở Playwright Inspector UI, cho phép xem từng step của test.

### 3. Chạy tests với hiển thị browser (Headed mode)
```bash
pnpm run test:e2e:headed
```
Hiển thị browser để xem tests chạy live.

### 4. Chạy tests ở chế độ Debug
```bash
pnpm run test:e2e:debug
```
Mở debugger, cho phép dừng tại breakpoint.

### 5. Xem báo cáo test
```bash
pnpm run test:e2e:report
```
Mở báo cáo HTML của lần chạy test gần đây nhất.

### 6. Chạy một test file cụ thể
```bash
pnpm run test:e2e tests/login.spec.ts
```

### 7. Chạy tests khớp một pattern
```bash
pnpm run test:e2e --grep "Login"
```

## Cấu hình Playwright

File `playwright.config.ts` chứa cấu hình:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile devices**: Pixel 5, iPhone 12
- **Reporter**: HTML report (`playwright-report/`)
- **Auto web server**: Tự động chạy `pnpm run dev` nếu chưa

## Viết Test mới

### Cấu trúc cơ bản

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup trước mỗi test
    await page.goto('/path-to-page');
  });

  test('Test description', async ({ page }) => {
    // Hành động
    await page.click('button:has-text("Click me")');
    
    // Kiểm tra
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Các selector phổ biến

```typescript
// By text
page.locator('text=Login')
page.locator('button:has-text("Đăng nhập")')

// By placeholder
page.locator('input[placeholder="Email"]')

// By type
page.locator('input[type="email"]')

// By label
page.locator('label:has-text("Email")')

// By test ID
page.locator('[data-testid="submit-button"]')

// By role
page.locator('[role="button"]')
```

### Các action phổ biến

```typescript
// Navigation
await page.goto('/login');
await page.goBack();
await page.reload();

// Input
await page.fill('input[type="email"]', 'user@example.com');
await page.type('input', 'text'); // Typed character by character
await page.selectOption('select', 'option-value');

// Click
await page.click('button');
await page.dblClick('element');
await page.rightClick('element');

// Wait
await page.waitForTimeout(1000);
await page.waitForSelector('text=Loaded');
await page.waitForURL('/dashboard');

// Assertions
await expect(page.locator('text=Success')).toBeVisible();
await expect(page.locator('input')).toHaveValue('text');
await expect(page.locator('input')).toBeDisabled();
```

## Troubleshooting

### Test timeout
- Tăng timeout trong `playwright.config.ts`
- Chạy single browser thay vì parallel

### Element not found
- Sử dụng `page.pause()` để debug
- Kiểm tra selector chính xác
- Đảm bảo element đã tải

### Port 3000 đã được sử dụng
- Tắt server hiện tại: `npx kill-port 3000`
- Hoặc thay đổi port trong `playwright.config.ts`

## Best Practices

✅ **Nên:**
- Test user workflows, không implementation
- Sử dụng semantic selectors (text, role)
- Tách test thành các test nhỏ, cụ thể
- Avoid hard waits, sử dụng wait conditions

❌ **Không nên:**
- Test chi tiết CSS styling
- Sử dụng XPath phức tạp
- Hard-code waits (waitForTimeout)
- Test implementation details

## CI/CD Integration

Tests chạy tự động trên CI:

```yaml
# .github/workflows/e2e-tests.yml
- run: pnpm install
- run: pnpm run build
- run: pnpm run test:e2e
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API](https://playwright.dev/docs/api/class-page)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Liên hệ

Nếu có câu hỏi về testing, liên hệ team QA hoặc developer.
