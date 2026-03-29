import { CookpadScraper } from './src/sites/CookpadScraper.js';

async function main() {
    const args = process.argv.slice(2);
    const siteArg = args.find(a => a.startsWith('--site='));
    const site = siteArg ? siteArg.split('=')[1] : 'cookpad';

    console.log(`Bắt đầu chạy scraper cho site: ${site}`);

    if (site === 'cookpad') {
        const scraper = new CookpadScraper();
        await scraper.run();
    } else {
        console.error(`Không tìm thấy module cho site: ${site}`);
    }
}

main().catch(err => {
    console.error("Lỗi quá trình khởi chạy: ", err);
    process.exit(1);
});
