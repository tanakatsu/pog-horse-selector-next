import { test as base, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const screenshotsDir = path.join(process.cwd(), 'screenshots')

export const test = base.extend<{ autoScreenshot: void }>({
  autoScreenshot: [
    async ({ page }, use, testInfo) => {
      await use()
      if (testInfo.status === 'skipped') return
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true })
      }
      await page.screenshot({
        path: path.join(screenshotsDir, `${testInfo.title}.png`),
        fullPage: true,
      })
    },
    { auto: true },
  ],
})

export { expect }
export type { Page }
