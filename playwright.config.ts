import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  use: {
    baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? "http://127.0.0.1:8081",
    headless: true,
    launchOptions: process.env["PLAYWRIGHT_CHROME_PATH"]
      ? { executablePath: process.env["PLAYWRIGHT_CHROME_PATH"] }
      : undefined,
    screenshot: "only-on-failure",
  },
  reporter: "list",
});
