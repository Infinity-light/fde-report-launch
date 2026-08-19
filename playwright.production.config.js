import { defineConfig, devices } from "@playwright/test";

const productionURL = process.env.PRODUCTION_URL || "https://fde.godpenai.com/";
const productionEdgeIP = process.env.PRODUCTION_EDGE_IP;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 2,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-production", open: "never" }]],
  outputDir: "test-results/production",
  use: {
    baseURL: productionURL,
    channel: "chrome",
    launchOptions: productionEdgeIP
      ? {
          args: [
            `--host-resolver-rules=MAP fde.godpenai.com ${productionEdgeIP}`,
            "--no-proxy-server",
          ],
        }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: "mobile-wide-chromium",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
