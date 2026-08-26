import crypto from "crypto";

export interface AuditEntry {
    sequence: number;
    timestamp: string;
    actorUserId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: Record<string, unknown>;
    previousHash: string;
    hash: string;
}

const entries: AuditEntry[] = [];

export function appendAuditEntry(input: Omit<AuditEntry, "sequence" | "timestamp" | "previousHash" | "hash">): AuditEntry {
    const previousHash = entries.at(-1)?.hash || "GENESIS";
    const entryBase = {
        sequence: entries.length + 1,
        timestamp: new Date().toISOString(),
        ...input,
        previousHash,
    };
    const hash = crypto.createHash("sha256").update(JSON.stringify(entryBase)).digest("hex");
    const entry = { ...entryBase, hash };
    entries.push(entry);
    return entry;
}

export function getAuditEntries(): AuditEntry[] {
    return entries.map((entry) => ({ ...entry, details: { ...entry.details } }));
}

export function verifyAuditChain(): { valid: boolean; checkedEntries: number; brokenSequence?: number } {
    let previousHash = "GENESIS";
    for (const entry of entries) {
        const { hash, ...entryBase } = entry;
        const expectedHash = crypto.createHash("sha256").update(JSON.stringify(entryBase)).digest("hex");
        if (entry.previousHash !== previousHash || entry.hash !== expectedHash) {
            return { valid: false, checkedEntries: entry.sequence - 1, brokenSequence: entry.sequence };
        }
        previousHash = entry.hash;
    }
    return { valid: true, checkedEntries: entries.length };
}
