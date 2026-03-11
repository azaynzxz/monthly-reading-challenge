import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'src', 'data');

for (let month = 1; month <= 3; month++) {
    const jsonPath = path.join(dataDir, `month${month}.json`);
    if (!fs.existsSync(jsonPath)) continue;

    const folderPath = path.join(dataDir, `month${month}`);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const item of data) {
        if (item.text) {
            const mdPath = path.join(folderPath, `day${item.day}.md`);
            // Add a proper markdown structure if needed, or just the text for now
            fs.writeFileSync(mdPath, item.text, 'utf8');
            delete item.text;
        }
    }

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 4), 'utf8');
}

console.log('Refactoring complete!');
