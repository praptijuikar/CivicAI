const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('ThemeProvider')) {
  content = content.replace(
    'import { loadDemoReports, updateDemoReport } from "./lib/demoStorage.ts";',
    `import { loadDemoReports, updateDemoReport } from "./lib/demoStorage.ts";\nimport { ThemeProvider } from "./lib/ThemeContext.tsx";`
  );

  content = content.replace(
    'return (\n    <div key={language} className="municipal-app min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col relative">',
    'return (\n    <ThemeProvider>\n      <div key={language} className="municipal-app min-h-screen bg-background text-foreground flex flex-col relative transition-colors duration-300">'
  );

  // Close the ThemeProvider at the end
  content = content.replace(
    '    </div>\n  );\n}',
    '    </div>\n    </ThemeProvider>\n  );\n}'
  );

  fs.writeFileSync('src/App.tsx', content, 'utf8');
  console.log('App.tsx wrapped with ThemeProvider');
}
