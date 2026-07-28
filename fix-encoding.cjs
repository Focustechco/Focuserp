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
    if (content.includes('Ã')) {
        let fixed = content;
        try {
            // Convert latin1-interpreted utf-8 back to clean utf-8
            fixed = Buffer.from(content, 'binary').toString('utf8');
        } catch (e) {
            console.error('Error fixing', filePath, e);
        }

        // Targeted replacements fallback for common remnants
        const replacements = [
            [/Ã§/g, 'ç'],
            [/Ã³/g, 'ó'],
            [/Ã¡/g, 'á'],
            [/Ã£/g, 'ã'],
            [/Ã©/g, 'é'],
            [/Ãª/g, 'ê'],
            [/Ã­/g, 'í'],
            [/Ã´/g, 'ô'],
            [/Ãº/g, 'ú'],
            [/Ã€/g, 'À'],
            [/Ã/g, 'Á'],
            [/Ã‰/g, 'É'],
            [/Ã“/g, 'Ó'],
            [/Ãš/g, 'Ú'],
            [/Âº/g, 'º'],
            [/Âª/g, 'ª']
        ];

        replacements.forEach(([regex, rep]) => {
            fixed = fixed.replace(regex, rep);
        });

        if (fixed !== content) {
            fs.writeFileSync(filePath, fixed, 'utf-8');
            console.log('Fixed encoding in:', filePath);
            fixedCount++;
        }
    }
});

console.log(`Total files fixed: ${fixedCount}`);
