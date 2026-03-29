import { BrowserCore } from './BrowserCore.js';
import { FileManager } from './FileManager.js';
import { config } from '../config/env.js';
import { randomDelay, randomScroll } from './Utils.js';

export class BaseScraper {
    constructor(siteName) {
        this.siteName = siteName;
        this.fileManager = new FileManager(siteName);
        this.urlsFile = 'all_urls.json';
        this.dataFile = 'raw_recipes.json';
    }

    /**
     * Tự định nghĩa trong class con (ví dụ: truy cập trang chủ và lấy toàn bộ thẻ <a>
     */
    async getLinksOnPage(page, pageIndex) {
        throw new Error('Cấp con phải override getLinksOnPage');
    }

    /**
     * Tự định nghĩa trong class con (ví dụ: dùng getText để lấy dish_name, ingredients...)
     */
    async getRecipeDetails(page, url) {
        throw new Error('Cấp con phải override getRecipeDetails');
    }

    async runPhase1() {
        console.log(`\n--- PHASE 1: LẤY LINKS TỪ [${this.siteName}] ---`);
        let urlData = await this.fileManager.loadJson(this.urlsFile, null);
        
        // Convert old format to object if necessary
        if (!urlData || Array.isArray(urlData)) {
            urlData = { last_page: 0, urls: Array.isArray(urlData) ? urlData : [] };
        }

        const startPage = urlData.last_page + 1;
        const endPage = config.PAGINATION_LIMIT;

        if (startPage > endPage) {
            console.log(`Đã quét đến trang ${urlData.last_page}, PAGINATION_LIMIT = ${config.PAGINATION_LIMIT}. Bỏ qua Phase 1.`);
            return urlData.urls;
        }

        console.log(`Bắt đầu quét từ trang ${startPage} đến ${endPage}...`);
        const browserCore = new BrowserCore();
        const browser = await browserCore.createBrowser();
        const currentUrls = new Set(urlData.urls);

        try {
            const page = await browserCore.createPage();
            for (let p = startPage; p <= endPage; p++) {
                console.log(`Đang quét trang ${p}...`);
                await randomDelay();
                try {
                    const links = await this.getLinksOnPage(page, p);
                    
                    if (!links || links.length === 0) {
                        console.log(`=> Trang ${p} không có link nào, có thể đã đi đến cuối. Dừng Phase 1.`);
                        break;
                    }
                    
                    links.forEach(l => currentUrls.add(l));
                    
                    urlData.last_page = p;
                    urlData.urls = Array.from(currentUrls);
                    await this.fileManager.saveJson(this.urlsFile, urlData);
                    
                    console.log(`=> Tìm thấy ${links.length} links. Tổng lưu trữ: ${currentUrls.size} links.`);
                } catch (err) {
                    console.error(`=> Lỗi quét trang ${p}: `, err.message);
                    break;
                }
            }
        } finally {
            await browserCore.close();
        }

        return Array.from(currentUrls);
    }

    async runPhase2(allLinks) {
        console.log(`\n--- PHASE 2: CÀO CHI TIẾT TỪ [${this.siteName}] ---`);
        if (!allLinks || allLinks.length === 0) {
            console.log('Không có link nào để cào.');
            return;
        }

        const existingData = await this.fileManager.loadJson(this.dataFile, []);
        const scrapedUrls = new Set(existingData.map(item => item.url));
        console.log(`Đã có dữ liệu của ${scrapedUrls.size} món trong ${this.dataFile}.`);
        
        let linksToScrape = allLinks.filter(link => !scrapedUrls.has(link));
        console.log(`Còn ${linksToScrape.length} món mới cần cào.`);
        
        if (linksToScrape.length > config.SCRAPE_LIMIT) {
            linksToScrape = linksToScrape.slice(0, config.SCRAPE_LIMIT);
            console.log(`Đã giới hạn cào ${config.SCRAPE_LIMIT} món (theo SCRAPE_LIMIT trong file .env).`);
        }

        if (linksToScrape.length === 0) return;

        const batches = [];
        for (let i = 0; i < linksToScrape.length; i += config.BATCH_SIZE) {
            batches.push(linksToScrape.slice(i, i + config.BATCH_SIZE));
        }

        console.log(`Đã chia làm ${batches.length} batch (BATCH_SIZE = ${config.BATCH_SIZE}).`);
        let itemCounter = 0;

        for (let b = 0; b < batches.length; b++) {
            const batch = batches[b];
            console.log(`\nKhởi động trình duyệt cho Batch ${b + 1}/${batches.length}...`);
            
            let browserCore = new BrowserCore();
            try {
                await browserCore.createBrowser();
                for (let i = 0; i < batch.length; i++) {
                    const url = batch[i];
                    itemCounter++;
                    console.log(`[${itemCounter}/${linksToScrape.length}] Đang cào: ${url}`);
                    
                    await randomDelay();
                    const detailPage = await browserCore.createPage();
                    
                    try {
                        await detailPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        await randomScroll(detailPage);
                        
                        const recipeData = await this.getRecipeDetails(detailPage, url);
                        
                        const fullItem = {
                            url,
                            ...recipeData,
                            scraped_at: new Date().toISOString()
                        };
                        
                        existingData.push(fullItem);
                        await this.fileManager.saveJson(this.dataFile, existingData); 
                        console.log(`=> Thành công: ${fullItem.dish_name || 'Không tìm thấy tên món'}`);
                    } catch (err) {
                        console.error(`=> Lỗi khi cào ${url}:`, err.message);
                    } finally {
                        await detailPage.close();
                    }
                }
            } catch (batchErr) {
                 console.error(`Lỗi nghiêm trọng Batch ${b + 1}: `, batchErr.message);
            } finally {
                await browserCore.close();
                console.log(`Đã đóng trình duyệt của Batch ${b + 1}.`);
            }
        }
        
        console.log('\n================ THỐNG KÊ ================');
        console.log(`Tổng số bản ghi bạn đang có: ${existingData.length}`);
    }

    async run() {
        try {
            const allLinks = await this.runPhase1();
            await this.runPhase2(allLinks);
            console.log(`\n--- HOÀN TẤT SCRAPE CHO [${this.siteName}] ---`);
        } catch (e) {
            console.error(`[${this.siteName}] Fatal error:`, e);
        }
    }
}
