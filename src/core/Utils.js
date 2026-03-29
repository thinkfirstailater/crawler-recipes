import { config } from '../config/env.js';

export const randomDelay = () => {
    const delay = Math.floor(Math.random() * (config.MAX_DELAY - config.MIN_DELAY + 1)) + config.MIN_DELAY;
    return new Promise(resolve => setTimeout(resolve, delay));
};

export const randomScroll = async (page) => {
    await page.evaluate(async () => {
        const scrollHeight = document.body.scrollHeight;
        const viewportHeight = window.innerHeight;
        const maxScrolls = Math.floor(Math.random() * 3) + 2; // 2-4 scrolls
        for (let i = 0; i < maxScrolls; i++) {
            const y = Math.floor(Math.random() * (scrollHeight - viewportHeight));
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            await new Promise(r => setTimeout(r, Math.random() * 800 + 400));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 500));
    });
};
