import { expect, test } from "@playwright/test";

test("roadmap: listen, speak along, retry, complete and resume with English female voice", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto("/roadmap");
  await expect(page.locator(".roadmap-page")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => {
    function FakeRecognition(this: {
      onresult?: (event: { results: [[{ transcript: string }]]; resultIndex: number }) => void;
      onend?: () => void;
      start: () => void;
      stop: () => void;
      abort: () => void;
    }) {
      (window as unknown as { lastRecognition: typeof this }).lastRecognition = this;
      this.start = () => {};
      this.stop = () => this.onend?.();
      this.abort = () => this.onend?.();
    }
    const recognitionWindow = window as unknown as {
      SpeechRecognition: unknown;
      webkitSpeechRecognition: unknown;
    };
    recognitionWindow.SpeechRecognition = FakeRecognition;
    recognitionWindow.webkitSpeechRecognition = FakeRecognition;
  });
  await page.screenshot({
    path: "docs/previews/roadmap-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Học bài 1: sun", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Let's begin!" }).click();
  await expect(dialog.getByRole("heading", { name: "Listen with Mầm" })).toBeVisible();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    dialog.getByText("Your voice is checked only for this turn.", { exact: false }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Try saying it" }).click();
  const consent = page.getByRole("alertdialog");
  await expect(consent.getByText("Grown-up permission")).toBeVisible();
  await consent.getByRole("button", { name: "Turn on microphone" }).click();
  await expect(dialog.getByRole("button", { name: "Listening… tap to stop" })).toBeVisible();
  await page.evaluate(() => {
    const recognition = (
      window as unknown as {
        lastRecognition: {
          onresult?: (event: { results: [[{ transcript: string }]]; resultIndex: number }) => void;
        };
      }
    ).lastRecognition;
    recognition.onresult?.({ results: [[{ transcript: "cloud" }]], resultIndex: 0 });
  });
  await expect(dialog.getByText("Try again! Mầm knows you can do it.")).toBeVisible();
  await expect(dialog.locator(".path-lesson__mascot")).toHaveAttribute("data-mood", "sad");
  await page.screenshot({ path: "docs/previews/roadmap-try-again.png", animations: "disabled" });
  await dialog.getByRole("button", { name: "Try saying it" }).click();
  await expect(dialog.getByRole("button", { name: "Listening… tap to stop" })).toBeVisible();
  await page.evaluate(() => {
    const recognition = (
      window as unknown as {
        lastRecognition: {
          onresult?: (event: { results: [[{ transcript: string }]]; resultIndex: number }) => void;
        };
      }
    ).lastRecognition;
    recognition.onresult?.({ results: [[{ transcript: "son" }]], resultIndex: 0 });
  });
  await expect(dialog.getByRole("heading", { name: "Which one did you hear?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Choose rain", exact: true }).click();
  await dialog.getByRole("button", { name: "Choose rain", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Choose sun", exact: true })).toHaveClass(
    /is-hint/,
  );
  await expect(dialog.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await page.screenshot({ path: "docs/previews/roadmap-lesson.png", animations: "disabled" });
  await page.reload();
  await expect(dialog.getByRole("heading", { name: "Which one did you hear?" })).toBeVisible();
  await page.evaluate(() => {
    function FakeRecognition(this: {
      onresult?: (event: { results: [[{ transcript: string }]]; resultIndex: number }) => void;
      onend?: () => void;
      start: () => void;
      stop: () => void;
      abort: () => void;
    }) {
      (window as unknown as { lastRecognition: typeof this }).lastRecognition = this;
      this.start = () => {};
      this.stop = () => this.onend?.();
      this.abort = () => this.onend?.();
    }
    const recognitionWindow = window as unknown as {
      SpeechRecognition: unknown;
      webkitSpeechRecognition: unknown;
    };
    recognitionWindow.SpeechRecognition = FakeRecognition;
    recognitionWindow.webkitSpeechRecognition = FakeRecognition;
  });
  await dialog.getByRole("button", { name: "Listen again", exact: true }).click();
  await dialog.getByRole("button", { name: "Choose sun", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await page.context().setOffline(true);
  await dialog.getByRole("button", { name: "Try saying it" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Turn on microphone" }).click();
  await expect(dialog.getByRole("button", { name: "Listening… tap to stop" })).toBeVisible();
  await page.evaluate(() => {
    const recognition = (
      window as unknown as {
        lastRecognition: {
          onresult?: (event: { results: [[{ transcript: string }]]; resultIndex: number }) => void;
        };
      }
    ).lastRecognition;
    recognition.onresult?.({ results: [[{ transcript: "sun" }]], resultIndex: 0 });
  });
  await expect(dialog.getByRole("heading", { name: "You made a flower bloom!" })).toBeVisible();
  await dialog.getByRole("button", { name: "Back to my path" }).click();
  await expect(
    page.getByRole("button", { name: "Học bài 1: sun · Đã khám phá", exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kvtt.learning.v2.guest")!),
  );
  expect(stored.progress["shared/garden/path-v1-sun"].completed).toBe(true);
  expect(stored.progress["shared/garden/standard"]).toBeUndefined();
  await page.context().setOffline(false);
  await page.getByRole("link", { name: "Khu vườn 2 Rainbow Meadow" }).click();
  await expect(page.getByRole("button", { name: "Học bài 1: red", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Khu vườn 3 Animal Express" }).click();
  await page.getByRole("button", { name: "Học bài 1: cat", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Học bài 1: cat", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/roadmap");
  await expect(page.locator(".roadmap-page")).toHaveAttribute("data-ready", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: "docs/previews/roadmap-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Học bài 2: rain", exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  await page.screenshot({
    path: "docs/previews/roadmap-lesson-mobile.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});

test("no voice and invalid lesson have recovery; voice settings use English only", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window.speechSynthesis, "getVoices", { value: () => [] });
  });
  await page.goto("/roadmap?world=garden&lesson=not-a-word");
  await expect(page.getByRole("heading", { name: "Lesson not found" }).last()).toBeVisible();
  await page.getByRole("button", { name: "Back to my path" }).click();
  await page.getByRole("button", { name: "Cài đặt giọng đọc và chuyển động" }).click();
  await expect(page.getByText("Giọng tiếng Anh · ưu tiên giọng nữ")).toBeVisible();
  await expect(page.getByText("Giọng tiếng Việt (hướng dẫn)")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Học bài 1: sun", exact: true }).click();
  await expect(page.getByText("No English voice is available.", { exact: false })).toBeVisible();
});
