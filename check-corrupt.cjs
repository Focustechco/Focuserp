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
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let corruptCount = 0;

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Check for weird character sequences like Ã, Â, , \uFFFD
    const matches = content.match(/[ÃÂ\uFFFD]/g);
    if (matches) {
        console.log(`Corrupt match in ${filePath}:`, matches.length, 'matches');
        corruptCount++;
    }
});

console.log(`Total files with remaining corrupt characters: ${corruptCount}`);
