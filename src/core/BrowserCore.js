import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import UserAgent from 'user-agents';
import { config } from '../config/env.js';

puppeteer.use(StealthPlugin());

if (config.ENABLE_ADBLOCKER) {
    puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
}

export class BrowserCore {
    constructor() {
        this.browser = null;
    }

    async createBrowser() {
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ];

        if (config.PROXY_URL) {
            args.push(`--proxy-server=${config.PROXY_URL}`);
        }

        this.browser = await puppeteer.launch({
            headless: true,
            args: args
        });
        
        return this.browser;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async createPage() {
        if (!this.browser) await this.createBrowser();
        const page = await this.browser.newPage();
        
        const userAgent = new UserAgent({ deviceCategory: 'desktop' });
        await page.setUserAgent(userAgent.toString());
        
        // Request Interception
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'font', 'stylesheet', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        if (config.PROXY_URL && config.PROXY_URL.includes('@')) {
            try {
                const proxyUrlObj = new URL(config.PROXY_URL);
                if (proxyUrlObj.username && proxyUrlObj.password) {
                    await page.authenticate({
                        username: proxyUrlObj.username,
                        password: proxyUrlObj.password,
                    });
                }
            } catch (e) {
                console.error("Lỗi cấu hình proxy", e);
            }
        }
        
        return page;
    }
}
