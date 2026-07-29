const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
const keys = new Set();

files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.matchAll(/useLocalStorageState(?:<[^>]+>)?\(\s*['"]([^'"]+)['"]/g);
    for (const match of matches) {
        keys.add(match[1]);
    }
});

console.log('All storage keys used in the codebase:', Array.from(keys));
