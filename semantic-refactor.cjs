const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Replace hardcoded light/dark classes with semantic variables
const replacements = [
  // Backgrounds
  { regex: /bg-\[#F9FAFB\]/g, replacement: 'bg-background' },
  { regex: /bg-white/g, replacement: 'bg-surface' },
  { regex: /bg-slate-50/g, replacement: 'bg-background' },
  { regex: /bg-slate-100\/50/g, replacement: 'bg-surface/50' },
  { regex: /bg-slate-100/g, replacement: 'bg-surface' },
  { regex: /bg-indigo-50\/50/g, replacement: 'bg-ashoka-navy/5' },
  { regex: /bg-indigo-50/g, replacement: 'bg-ashoka-navy/10' },

  // Text Colors
  { regex: /text-slate-900/g, replacement: 'text-foreground' },
  { regex: /text-slate-700/g, replacement: 'text-foreground/80' },
  { regex: /text-slate-500/g, replacement: 'text-foreground/60' },

  // Borders
  { regex: /border-slate-200/g, replacement: 'border-border-subtle' },
  { regex: /border-slate-300/g, replacement: 'border-border-subtle hover:border-foreground/20' },

  // Cyan -> Ashoka Navy or Saffron depending on context (I'll do general ones here, and manual fixes where needed)
  { regex: /bg-cyan-600/g, replacement: 'bg-saffron' },
  { regex: /hover:bg-cyan-500/g, replacement: 'hover:bg-saffron/90' },
  { regex: /text-cyan-400/g, replacement: 'text-ashoka-navy dark:text-ashoka-navy' },
  { regex: /text-cyan-600/g, replacement: 'text-ashoka-navy' },
  
  // Indigo -> Ashoka Navy
  { regex: /bg-indigo-600/g, replacement: 'bg-ashoka-navy' },
  { regex: /text-indigo-600/g, replacement: 'text-ashoka-navy' },

  // Emerald -> India Green
  { regex: /text-emerald-400/g, replacement: 'text-india-green' },
  { regex: /bg-emerald-500/g, replacement: 'bg-india-green' },
];

let changedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }

  // Update specific Landing Page elements that had hardcoded gradients
  if (file === 'LandingPage.tsx') {
    content = content.replace(/from-purple-500\/10/g, 'from-saffron/10');
    content = content.replace(/to-orange-500\/10/g, 'to-saffron/5');
    content = content.replace(/from-blue-500\/10/g, 'from-ashoka-navy/10');
    content = content.replace(/to-cyan-500\/10/g, 'to-ashoka-navy/5');
  }

  // Update specific Header elements for Toggle
  if (file === 'Header.tsx') {
    if (!content.includes('import { useTheme }')) {
      content = content.replace(
        'import { ShieldCheck, LogOut, Search, Compass, ShieldAlert, Sparkles, Terminal } from "lucide-react";',
        'import { ShieldCheck, LogOut, Search, Compass, ShieldAlert, Sparkles, Terminal, Sun, Moon } from "lucide-react";\nimport { useTheme } from "../lib/ThemeContext.tsx";'
      );
      content = content.replace(
        'const { t } = useTranslation();',
        'const { t } = useTranslation();\n  const { theme, toggleTheme } = useTheme();'
      );
      
      // Inject toggle button next to language switcher
      const target = '{/* Language Switcher */}';
      const replacement = `<button onClick={toggleTheme} className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl bg-surface/50 border border-border-subtle text-foreground/60 hover:text-foreground transition-colors mr-2">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Language Switcher */}`;
      content = content.replace(target, replacement);
    }
  }

  // Update Glassmorphism Adjustments
  // In light mode, use bg-white/80; in dark mode, use bg-slate-800/80 with a subtle white border (border-white/10).
  content = content.replace(/bg-surface\/80/g, 'bg-surface/80 dark:bg-slate-800/80 dark:border-white/10');
  content = content.replace(/bg-surface\/70/g, 'bg-surface/70 dark:bg-slate-800/80 dark:border-white/10');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
    changedCount++;
  }
}

console.log(`Finished updating ${changedCount} files.`);
