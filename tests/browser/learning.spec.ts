import { test, expect } from "@playwright/test";

test("adult preparation, isolated preview, child lesson and mobile layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/teacher");
  await expect(page.locator(".learning-hub")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { name: "Ở lớp và tại nhà" })).toBeVisible();
  await page.getByRole("textbox", { name: "Biệt danh hoặc tên lớp" }).fill("Bé Nắng");
  await page.getByRole("button", { name: "Thêm hồ sơ", exact: true }).click();
  await page.reload();
  await expect(page.locator(".learning-hub")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#learning-context")).toContainText("Bé Nắng");
  await page.getByRole("button", { name: "Câu chuyện có sẵn", exact: true }).click();
  await page.getByRole("button", { name: "Xem trước tại đây" }).click();
  const modal = page.getByRole("dialog");
  await expect(modal.getByText("Xem trước · Không lưu tiến độ")).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem("kvtt.learning.v2.guest"));
  await modal.getByRole("button", { name: "Nghe Mầm kể" }).click();
  await modal.getByRole("button", { name: "Bắt đầu!", exact: true }).click();
  await expect(modal.getByRole("button", { name: "mặt trời", exact: true })).toBeVisible();
  await page.screenshot({ path: "docs/previews/lesson-preview-desktop.png" });
  expect(await page.evaluate(() => localStorage.getItem("kvtt.learning.v2.guest"))).toBe(before);
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "docs/previews/adult-desktop.png", fullPage: true });
  await page.goto("/learn/garden");
  await page.getByRole("button", { name: "Nghe Mầm kể" }).click();
  await page.getByRole("button", { name: "Bắt đầu!", exact: true }).click();
  await page.getByRole("button", { name: "mặt trời", exact: true }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("kvtt.learning.v2.guest") || "{}").events?.length ?? 0,
      ),
    )
    .toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/adventures");
  await expect(page.getByText("Đang học cùng")).toBeVisible();
  await expect(page.locator("#learning-context")).toContainText("Bé Nắng");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await page.screenshot({ path: "docs/previews/adventures-mobile.png", fullPage: true });
  await page.goto("/teacher");
  await expect(page.getByRole("heading", { name: "Ở lớp và tại nhà" })).toBeVisible();
  await page.screenshot({ path: "docs/previews/adult-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
