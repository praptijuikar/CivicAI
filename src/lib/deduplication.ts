import type { CivicIssue } from "../types";

// Earth radius in meters
const R = 6371e3;

/**
 * Calculate the Haversine distance in meters between two coordinates.
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === 0 && lon1 === 0) return Infinity; // Prevent merging 0,0 locations
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate Jaccard similarity index between two strings.
 */
function calculateTextSimilarity(str1: string, str2: string): number {
  const getWords = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  
  const set1 = getWords(str1);
  const set2 = getWords(str2);
  
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  
  let intersectionSize = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      intersectionSize++;
    }
  }
  
  const unionSize = set1.size + set2.size - intersectionSize;
  return intersectionSize / unionSize;
}

/**
 * Group and merge similar issues together.
 * Modifies and returns a cloned list representing the new state.
 */
export function deduplicateComplaints(complaints: CivicIssue[]): CivicIssue[] {
  // Sort oldest first so the original issue becomes the "master"
  const sorted = [...complaints].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  // To keep track of masters. The list of returned issues.
  const processedIssues: CivicIssue[] = [];
  
  // Track which issues have been merged so we don't process them twice
  const mergedIds = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const issue = { ...sorted[i] }; // Clone to avoid direct mutation issues
    
    // If it's already been merged into a master, skip to the next
    if (mergedIds.has(issue.id)) continue;
    
    // Initialize properties if they don't exist
    if (!issue.duplicateIds) issue.duplicateIds = [];
    if (!issue.mergedReporterEmails) issue.mergedReporterEmails = issue.reporterContact ? [issue.reporterContact] : [];
    
    // Compare against upcoming issues
    for (let j = i + 1; j < sorted.length; j++) {
      if (mergedIds.has(sorted[j].id)) continue;
      
      const candidate = sorted[j];
      
      // Check 1: Same category
      if (issue.category !== candidate.category) continue;
      
      // Check 2: Distance within 100 meters
      const distance = calculateHaversineDistance(issue.latitude, issue.longitude, candidate.latitude, candidate.longitude);
      if (distance > 100) continue;
      
      // Check 3: Text similarity (Title + Description) > 80% (0.8)
      const text1 = `${issue.title} ${issue.description}`;
      const text2 = `${candidate.title} ${candidate.description}`;
      const similarity = calculateTextSimilarity(text1, text2);
      
      if (similarity > 0.8) {
        // It's a match! Merge candidate into current issue (master)
        issue.reportCount = (issue.reportCount || 1) + (candidate.reportCount || 1);
        issue.duplicateIds.push(candidate.id);
        
        if (candidate.reporterContact && !issue.mergedReporterEmails.includes(candidate.reporterContact)) {
          issue.mergedReporterEmails.push(candidate.reporterContact);
        }
        
        // Push candidate to processed list as a resolved duplicate
        processedIssues.push({
          ...candidate,
          status: 'duplicate_resolved',
          masterIssueId: issue.id,
        });
        
        mergedIds.add(candidate.id);
      }
    }
    
    // Push the master issue itself
    processedIssues.push(issue);
  }
  
  return processedIssues;
}
