const fs = require('fs');

const path = './server/db.ts';
let content = fs.readFileSync(path, 'utf8');

const syncFunction = `

// --- Firebase Realtime Database Synchronization ---
export function syncWithFirebase() {
  if (!firebaseDb) {
    console.log("[DB] Running in in-memory mode (Firebase disabled).");
    return;
  }
  
  console.log("[DB] Syncing with Firebase Realtime Database...");
  
  // Listeners for Realtime updates from Firebase
  firebaseDb.ref('users').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      // Need to modify exported constants
      const userList = Object.values(data);
      userList.forEach(u => {
        const idx = USERS.findIndex(existing => existing.id === u.id);
        if (idx >= 0) USERS[idx] = u;
        else USERS.push(u);
      });
    }
  });
  
  firebaseDb.ref('issues').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const issueList = Object.values(data);
      // We overwrite entirely or selectively merge. For simplicity, we just clear and push.
      ISSUES.length = 0;
      ISSUES.push(...issueList);
    }
  });
  
  firebaseDb.ref('integrityReports').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const reportList = Object.values(data);
      INTEGRITY_REPORTS.length = 0;
      INTEGRITY_REPORTS.push(...reportList);
    }
  });
}

// Helper to push updates to Firebase
function persistToFirebase(collection, id, data) {
  if (firebaseDb) {
    if (data === null) {
      firebaseDb.ref(collection).child(id).remove().catch(console.error);
    } else {
      firebaseDb.ref(collection).child(id).set(data).catch(console.error);
    }
  }
}
`;

// Append sync function if not already there
if (!content.includes('syncWithFirebase()')) {
  const dbIndex = content.indexOf('export const db = {');
  content = content.substring(0, dbIndex) + syncFunction + '\n' + content.substring(dbIndex);
}

// Ensure INTEGRITY_REPORTS is modifiable
content = content.replace('export const INTEGRITY_REPORTS', 'export let INTEGRITY_REPORTS');

// Replacements
content = content.replace(
  /USERS\.push\(newUser\);\n\s*return newUser;/g,
  'USERS.push(newUser);\n    persistToFirebase("users", newUser.id, newUser);\n    return newUser;'
);

content = content.replace(
  /ISSUES\.unshift\(newIssue\);\n\s*return newIssue;/g,
  'ISSUES.unshift(newIssue);\n    persistToFirebase("issues", newIssue.id, newIssue);\n    return newIssue;'
);

content = content.replace(
  /ISSUES\[idx\] = updated;\n\s*return updated;/g,
  'ISSUES[idx] = updated;\n    persistToFirebase("issues", updated.id, updated);\n    return updated;'
);

content = content.replace(
  /ISSUES\.splice\(idx, 1\);\n\s*return true;/g,
  'ISSUES.splice(idx, 1);\n    persistToFirebase("issues", id, null);\n    return true;'
);

content = content.replace(
  /INTEGRITY_REPORTS\.unshift\(newReport\);\n\s*return newReport;/g,
  'INTEGRITY_REPORTS.unshift(newReport);\n    persistToFirebase("integrityReports", newReport.id, newReport);\n    return newReport;'
);

content = content.replace(
  /INTEGRITY_REPORTS\[idx\] = updated;\n\s*return updated;/g,
  'INTEGRITY_REPORTS[idx] = updated;\n    persistToFirebase("integrityReports", updated.id, updated);\n    return updated;'
);

fs.writeFileSync(path, content);
console.log("Migration complete.");
