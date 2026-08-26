const fs = require('fs');
const path = require('path');

const cssPath = './src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace the entire :root and add .dark and @theme
const newCssHead = `@import "tailwindcss";

:root {
  /* Digital India Semantic Variables - Light Mode */
  --bg-main: #F8FAFC;
  --bg-surface: #FFFFFF;
  --text-main: #0F172A;
  --color-saffron: #FF9933;
  --color-green: #138808;
  --color-navy: #000080;
  --border-color: #E2E8F0;
  
  --surface: rgba(255, 255, 255, 0.8);
  --border: rgba(0, 0, 0, 0.1);
  --border-hover: rgba(0, 0, 0, 0.2);
}

.dark {
  /* Digital India Semantic Variables - Dark Mode */
  --bg-main: #0F172A;
  --bg-surface: #1E293B;
  --text-main: #F1F5F9;
  --color-saffron: #FB923C;
  --color-green: #22C55E;
  --color-navy: #60A5FA;
  --border-color: #334155;
  
  --surface: rgba(30, 41, 59, 0.8);
  --border: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);
}

@theme {
  --color-background: var(--bg-main);
  --color-surface: var(--bg-surface);
  --color-foreground: var(--text-main);
  --color-saffron: var(--color-saffron);
  --color-india-green: var(--color-green);
  --color-ashoka-navy: var(--color-navy);
  --color-border-subtle: var(--border-color);
}

@layer base {
  body {
    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    overflow-x: hidden;
  }
`;

// Replace everything from start up to body { ... }
css = css.replace(/@import "tailwindcss";[\s\S]*?body\s*{[^}]*}/, newCssHead + '\n');
fs.writeFileSync(cssPath, css);
console.log('Updated index.css');
