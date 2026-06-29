import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

const env = loadEnv('test', process.cwd(), '');

for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1';
const localWebServerURL = 'http://127.0.0.1:4173';
const shouldStartWebServer = !skipWebServer &&
  /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(baseURL);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: shouldStartWebServer ? {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: localWebServerURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  } : undefined,
  projects: [
    {
      name: 'chromium',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      grep: /@mobile/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
