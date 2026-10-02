const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: "list",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:8000",
    viewport: { width: 1440, height: 1024 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {
      launchOptions: {
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        args: ["--no-sandbox", "--no-zygote", "--disable-gpu", "--disable-dev-shm-usage"]
      }
    } : {})
  },
  webServer: {
    command: "python3 serve.py --host 0.0.0.0 --port 8000",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: !process.env.CI,
    timeout: 15000
  }
});
