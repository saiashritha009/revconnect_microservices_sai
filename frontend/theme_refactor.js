const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'C:\Users\para pavani\OneDrive\Desktop\REVCONNECT\revconnect-app';

const replacements = [
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/ig, replacement: 'var(--border-color)' },
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1\s*\)/ig, replacement: 'var(--border-color)' },
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/ig, replacement: 'var(--border-color-light)' },
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.04\s*\)/ig, replacement: 'var(--border-color-light)' },
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.02\s*\)/ig, replacement: 'var(--glass-highlight)' },
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/ig, replacement: 'var(--border-color-strong)' },
    { regex: /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.2\s*\)/ig, replacement: 'var(--border-color-strong)' },
    { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.7\s*\)/ig, replacement: 'var(--bg-glass)' },
    { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.6\s*\)/ig, replacement: 'var(--bg-glass-light)' },
    { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.8\s*\)/ig, replacement: 'var(--bg-glass-dark)' },
    { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.9\s*\)/ig, replacement: 'var(--bg-glass-dark)' },
    { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*0\.95\s*\)/ig, replacement: 'var(--bg-glass-dark)' },
    { regex: /rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*1\s*\)/ig, replacement: 'var(--bg-primary)' },
    { regex: /rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*0\.7\s*\)/ig, replacement: 'var(--card-glass)' },
    { regex: /rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*0\.6\s*\)/ig, replacement: 'var(--input-bg)' },
    { regex: /rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*0\.9\s*\)/ig, replacement: 'var(--input-bg-focus)' },
    { regex: /rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*0\.8\s*\)/ig, replacement: 'var(--card-glass-dark)' },
    { regex: /rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*0\.5\s*\)/ig, replacement: 'var(--card-glass-light)' },
    { regex: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.1\s*\)/ig, replacement: 'var(--shadow-sm-color)' },
    { regex: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.5\s*\)/ig, replacement: 'var(--shadow-glass)' },
    { regex: /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.6\s*\)/ig, replacement: 'var(--shadow-glass-strong)' },
    { regex: /#0f172a/gi, replacement: 'var(--bg-primary)' },
    { regex: /#1e293b/gi, replacement: 'var(--bg-secondary)' },
    { regex: /#f8fafc/gi, replacement: 'var(--text-primary)' },
    { regex: /#e2e8f0/gi, replacement: 'var(--text-muted)' },
    { regex: /#94a3b8/gi, replacement: 'var(--text-secondary)' },
    { regex: /#64748b/gi, replacement: 'var(--text-muted)' },
    { regex: /#475569/gi, replacement: 'var(--text-placeholder)' }
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (filePath.endsWith('.scss') || filePath.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk(rootDir);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(r => {
        content = content.replace(r.regex, r.replacement);
    });

    if (content !== original) {
        fs.writeFileSync(file, content);
        count++;
    }
});
console.log(`Replaced colors in ${count} files.`);