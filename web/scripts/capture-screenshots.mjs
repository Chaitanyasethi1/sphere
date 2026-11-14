import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, "../../docs/screenshots");

async function capture() {
  console.log("Launching browser for screenshots...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const viewports = [
    { name: "desktop-1920x1080.png", width: 1920, height: 1080 },
    { name: "desktop-1280x800.png", width: 1280, height: 800 },
    { name: "mobile-390x844.png", width: 390, height: 844, isMobile: true },
  ];

  for (const vp of viewports) {
    console.log(`Capturing ${vp.name}...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: !!vp.isMobile,
    });
    const page = await context.newPage();
    await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
    // Wait an extra 2.5s for WebGL/3D scene and layout to settle
    await page.waitForTimeout(2500);
    const dest = path.join(screenshotsDir, vp.name);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`Saved screenshot to ${dest}`);
    await context.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});
