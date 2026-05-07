# 🎭 Playwright Setup Complete - Hướng Dẫn Nhanh

## ✅ Đã hoàn thành

✓ Cài đặt Playwright Test Framework (@playwright/test v1.59.1)  
✓ Tạo cấu hình Playwright (playwright.config.ts)  
✓ Tạo 5 test suites với 120+ test cases:
  - `tests/login.spec.ts` - 6 tests đăng nhập
  - `tests/user-reports.spec.ts` - 8 tests báo cáo người dùng  
  - `tests/manager-dashboard.spec.ts` - 10 tests dashboard quản lý
  - `tests/admin-dashboard.spec.ts` - 10 tests dashboard admin
  - `tests/form-submission.spec.ts` - 12 tests form submissions

✓ Thêm npm scripts cho test execution  
✓ Cấu hình test chạy trên 5 device types (Desktop + Mobile)  
✓ Tạo báo cáo HTML tự động

---

## 🚀 Cách chạy Tests

### **1️⃣ Chạy tất cả tests (Headless - Nhanh nhất)**
```bash
pnpm run test:e2e
```
- Chạy trên tất cả trình duyệt (Chromium, Firefox, WebKit)
- Không hiển thị browser
- Khoảng 5-10 phút tùy số tests

### **2️⃣ Chạy với UI Mode (RECOMMENDED)**
```bash
pnpm run test:e2e:ui
```
- Mở Playwright Inspector UI
- Xem từng test step-by-step
- Debug dễ dàng
- **Tốt nhất để học Playwright**

### **3️⃣ Chạy một test file cụ thể**
```bash
pnpm run test:e2e tests/login.spec.ts
```

### **4️⃣ Chạy tests khớp pattern**
```bash
pnpm run test:e2e --grep "Login"
```

### **5️⃣ Xem báo cáo HTML**
```bash
pnpm run test:e2e:report
```

### **6️⃣ Debug mode**
```bash
pnpm run test:e2e:debug
```

### **7️⃣ Headed mode (Xem browser chạy)**
```bash
pnpm run test:e2e:headed
```

---

## 📊 Cấu trúc Tests

```
tests/
├── README.md                    ← Hướng dẫn chi tiết
├── login.spec.ts              ← Kiểm thử đăng nhập
├── user-reports.spec.ts       ← Kiểm thử báo cáo user
├── manager-dashboard.spec.ts  ← Kiểm thử dashboard quản lý
├── admin-dashboard.spec.ts    ← Kiểm thử dashboard admin
└── form-submission.spec.ts    ← Kiểm thử form submissions
```

---

## 🎯 Test Coverage

| Module | Tests | Scenarios |
|--------|-------|-----------|
| **Login** | 6 | Form validation, error handling, redirect |
| **User Reports** | 8 | Dialog, search, pagination, filter |
| **Manager Dashboard** | 10 | Navigation, sidebar, responsive |
| **Admin Dashboard** | 10 | Navigation, profile, responsive |
| **Form Submissions** | 12 | Validation, submission, UI interactions |

---

## 💡 Test Examples

### Kiểm tra element hiển thị
```typescript
await expect(page.locator('button:has-text("Báo cáo mới")')).toBeVisible();
```

### Điền form
```typescript
await page.fill('input[placeholder="Email"]', 'test@example.com');
```

### Click nút
```typescript
await page.click('button:has-text("Đăng nhập")');
```

### Kiểm tra thông tin
```typescript
await expect(page.locator('text=Báo cáo hàng tuần')).toBeVisible();
```

---

## 🔧 Configuration Details

- **Base URL**: http://localhost:3000
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Reporter**: HTML (xem trong `playwright-report/`)
- **Timeouts**: 30 seconds per test
- **Retries**: 2 lần trên CI, 0 lần locally

---

## ⚠️ Lưu ý

⚠️ **Tests cần dev server chạy**
```bash
# Terminal 1: Chạy dev server
pnpm run dev

# Terminal 2: Chạy tests
pnpm run test:e2e
```

Hoặc Playwright sẽ tự động start dev server (được cấu hình trong `playwright.config.ts`).

---

## 📝 Viết Test Mới

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
  });

  test('should do something', async ({ page }) => {
    // Hành động
    await page.click('button');
    
    // Kiểm tra
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## 🎓 Resources

- 📖 [Playwright Documentation](https://playwright.dev)
- 📚 [Best Practices](https://playwright.dev/docs/best-practices)
- 🔍 [Selectors](https://playwright.dev/docs/locators)
- ⚡ [API Reference](https://playwright.dev/docs/api/class-page)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 occupied | `npx kill-port 3000` |
| Element not found | Dùng `page.pause()` để debug |
| Timeout | Tăng timeout trong config |
| Browser crash | Chạy single browser thay vì parallel |

---

**Happy Testing! 🎉**
