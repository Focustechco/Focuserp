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
let fixedCount = 0;

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf-8');
    let fixed = content;

    // Remove BOM and replacement characters at start or corrupt characters
    fixed = fixed.replace(/^\uFEFF/, '').replace(/[\uFFFD]/g, '');

    if (fixed !== content) {
        fs.writeFileSync(filePath, fixed, 'utf-8');
        console.log('Cleaned corrupt bytes in:', filePath);
        fixedCount++;
    }
});

console.log(`Total files cleaned: ${fixedCount}`);
