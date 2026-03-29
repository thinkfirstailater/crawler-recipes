import fs from 'fs/promises';
import path from 'path';

export class FileManager {
    constructor(siteName) {
        this.siteName = siteName;
        const currentDir = process.cwd();
        this.baseDir = path.join(currentDir, 'data', siteName);
    }
    
    async init() {
        try {
            await fs.mkdir(this.baseDir, { recursive: true });
        } catch (e) {}
    }

    async loadJson(filename, defaultData) {
        try {
            const filePath = path.join(this.baseDir, filename);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return defaultData;
        }
    }

    async saveJson(filename, data) {
        await this.init();
        const filePath = path.join(this.baseDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
}
