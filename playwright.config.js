import { defineConfig, devices } from "@playwright/test";

const localPort = process.env.TEST_PORT || "4177";
const localURL = `http://127.0.0.1:${localPort}`;
const externalBaseURL = process.env.TEST_BASE_URL;
const hostResolverRules = process.env.TEST_HOST_RESOLVER_RULES;

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: externalBaseURL || localURL,
    channel: "chrome",
    launchOptions: hostResolverRules
      ? { args: [`--host-resolver-rules=${hostResolverRules}`] }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: externalBaseURL ? undefined : {
    command: "node scripts/serve.mjs",
    url: localURL,
    env: { ...process.env, PORT: localPort },
    reuseExistingServer: false,
    timeout: 20_000,
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
  ],
});
