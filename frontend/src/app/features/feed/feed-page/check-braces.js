
const fs = require('fs');
const content = fs.readFileSync('d:/REVCONNECT-Pavani/revconnect-ui/src/app/features/feed/feed-page/feed-page.scss', 'utf8');
let stack = [];
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
        if (line[j] === '{') stack.push({ line: i + 1, char: j + 1 });
        if (line[j] === '}') {
            if (stack.length === 0) {
                console.log(`Unexpected } at line ${i + 1}, char ${j + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}
if (stack.length > 0) {
    console.log('Unclosed braces:');
    stack.forEach(b => console.log(`  Line ${b.line}, Col ${b.char}`));
} else {
    console.log('Braces balanced.');
}
