const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Replace focus ring classes with saffron
const replacements = [
  { regex: /focus:ring-indigo-[0-9]+\/[0-9]+/g, replacement: 'focus:ring-saffron/50' },
  { regex: /focus:ring-\[#6366F1\]\/[0-9]+/g, replacement: 'focus:ring-saffron/50' },
  { regex: /focus:ring-\[#00F2FE\]\/[0-9]+/g, replacement: 'focus:ring-saffron/50' },
  { regex: /focus:ring-\[#00F2FE\]/g, replacement: 'focus:ring-saffron/50' },
  { regex: /ring-cyan-[0-9]+\/[0-9]+/g, replacement: 'ring-saffron/50' },
  { regex: /border-cyan-[0-9]+/g, replacement: 'border-saffron' },
  { regex: /focus:border-indigo-[0-9]+/g, replacement: 'focus:border-saffron' },
  { regex: /focus:border-\[#6366F1\]\/[0-9]+/g, replacement: 'focus:border-saffron' },
  { regex: /focus:border-\[#00F2FE\]/g, replacement: 'focus:border-saffron' },
];

let changedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated rings in ${file}`);
    changedCount++;
  }
}

console.log(`Finished updating rings in ${changedCount} files.`);
