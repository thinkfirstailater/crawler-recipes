import { BaseScraper } from '../core/BaseScraper.js';

export class CookpadScraper extends BaseScraper {
    constructor() {
        super('cookpad');
    }

    async getLinksOnPage(page, pageIndex) {
        const pageUrl = `https://cookpad.com/vn/tim-kiem/mon-an?page=${pageIndex}`;
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        return await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a.block-link__main'));
            return anchors
                .map(a => a.href)
                .filter(href => href.includes('/cong-thuc/') && !href.includes('/tao-moi'));
        });
    }

    async getRecipeDetails(page, url) {
        return await page.evaluate(() => {
            const getTextInside = (selectors) => {
                for (let sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el && el.innerText.trim()) return el.innerText.trim();
                }
                return '';
            };

            const dish_name = getTextInside([
                'h1.break-words', 
                'h1[itemprop="name"]', 
                '.recipe-title'
            ]);

            const author = getTextInside([
                'div.mb-sm span.block', 
                'span[itemprop="author"]', 
                '.author-name'
            ]);
            
            const ingredientsEls = document.querySelectorAll('div[itemprop="recipeIngredient"] div.whitespace-pre-wrap, .ingredient-list li');
            const ingredientsArr = Array.from(ingredientsEls)
                .map(el => el.innerText.trim())
                .filter(text => text.length > 0);
            const ingredients = Array.from(new Set(ingredientsArr));

            const instructionsEls = document.querySelectorAll('div[itemprop="recipeInstructions"] p.mb-sm, .step-list p');
            const instructionsArr = Array.from(instructionsEls)
                .map(el => el.innerText.trim())
                .filter(text => text.length > 0);
            const instructions = Array.from(new Set(instructionsArr));

            const totalTime = getTextInside(['div.mb-md time', '.total-time']);
            const servingSize = getTextInside(['div.mb-md span.text-cookpad-16', '.serving-size']);

            return {
                dish_name,
                author,
                ingredients,
                instructions,
                meta: {
                    totalTime,
                    servingSize
                }
            };
        });
    }
}
