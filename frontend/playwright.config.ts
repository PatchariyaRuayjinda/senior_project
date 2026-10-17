import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:4173",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        "../backend/node_modules/.bin/bun ../backend/scripts/e2e-server.ts",
      url: "http://127.0.0.1:3101/api/health",
      timeout: 60000,
      gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
    },
    {
      command: "yarn start --port 4173",
      env: { API_PROXY_TARGET: "http://127.0.0.1:3101" },
      url: "http://localhost:4173",
    },
  ],
});
