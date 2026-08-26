import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

const dict = {
  "Citizen Portal": "citizenPortal",
  "Integrity Portal": "integrityPortal",
  "Admin Dashboard": "adminDashboard",
  "Field Operations": "fieldOperations",
  "System Analytics": "systemAnalytics",
  "System Status": "systemStatus",
  "Operational": "operational",
  "SECURE": "secure",
  "Switch Persona & Role": "switchPersona",
  "Citizen": "citizen",
  "Vault": "vault",
  "Admin": "admin",
  "Field": "field",
  "Analytics": "analytics",
  "Language": "language",
  "Citizen Accountability Dashboard": "Citizen Accountability Dashboard",
  "Integrity Evidence Vault": "Integrity Evidence Vault",
  "Neighborhood Live Issue Map": "Neighborhood Live Issue Map",
  "High Urgency Neighborhood Alerts": "High Urgency Neighborhood Alerts",
  "Start Report": "Start Report",
  "Open Vault": "Open Vault",
  "Field Officer Operations": "Field Officer Operations",
  "Total Assigned": "Total Assigned",
  "In Progress": "In Progress",
  "Critical Urgency": "Critical Urgency",
  "Resolved": "Resolved",
  "Report Issue": "Report Issue",
  "Submit Report": "Submit Report",
  "Cancel": "Cancel",
  "Close": "Close",
  "Description": "Description",
  "Category": "Category",
  "Department": "Department",
  "Assigned Officer": "Assigned Officer",
  "Search": "Search",
  "Refresh": "Refresh",
  "Loading...": "Loading...",
  "No issues found": "No issues found"
};

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Ensure useTranslation is imported
  if (!content.includes('useTranslation')) {
    content = `import { useTranslation } from "react-i18next";\n` + content;
    changed = true;
  }

  // Very naive replacement - we must be careful with quotes
  for (const [english, key] of Object.entries(dict)) {
    // Replace {"Text"} or >Text<
    const regex1 = new RegExp(`>\\s*${english}\\s*<`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `>{t('${key}')}<`);
      changed = true;
    }
  }

  if (changed) {
    // Inject t hook if it's a function component
    // Finding standard function signature
    content = content.replace(/export (default )?function ([A-Z][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/g, (match) => {
      if (!content.includes('const { t } = useTranslation();')) {
        return match + '\n  const { t } = useTranslation();';
      }
      return match;
    });

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Migrated ${file}`);
  }
}
console.log('Migration complete');
