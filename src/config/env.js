import dotenv from 'dotenv';
dotenv.config();

export const config = {
    ENABLE_ADBLOCKER: process.env.ENABLE_ADBLOCKER === 'true',
    PROXY_URL: process.env.PROXY_URL || '',
    PAGINATION_LIMIT: parseInt(process.env.PAGINATION_LIMIT || '500', 10),
    BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '50', 10),
    SCRAPE_LIMIT: parseInt(process.env.SCRAPE_LIMIT || '500', 10),
    MIN_DELAY: parseInt(process.env.MIN_DELAY || '3000', 10),
    MAX_DELAY: parseInt(process.env.MAX_DELAY || '7000', 10),
};
