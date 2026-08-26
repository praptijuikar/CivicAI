import type { CivicIssue } from "../src/types.ts";

export interface BudgetOptions {
    budgetCap: number;
    crisisMode: boolean;
    crisisCategories: string[];
    neglectedWards: string[];
    wardOf: (issue: CivicIssue) => string;
    costOf: (issue: CivicIssue) => number;
}

export interface BudgetSelection {
    issueId: string;
    estimatedCost: number;
    baseScore: number;
    adjustedScore: number;
    impactPerDollar: number;
    reason: string;
}

export interface BudgetDeferral {
    issueId: string;
    estimatedCost: number;
    adjustedScore: number;
    reason: string;
}

export interface BudgetAllocation {
    budgetCap: number;
    allocatedCost: number;
    remainingBudget: number;
    totalImpact: number;
    selected: BudgetSelection[];
    deferred: BudgetDeferral[];
    audit: {
        generatedAt: string;
        formula: string;
        crisisMode: boolean;
        crisisMultiplier: number;
        equityBoost: number;
        selectedCount: number;
        deferredCount: number;
    };
}

const DEFAULT_COSTS: Record<string, number> = {
    "Roads & Infrastructure": 8500,
    "Water & Sewage": 12000,
    "Electrical & Lighting": 4200,
    "Sanitation & Waste": 2800,
    "Parks & Public Spaces": 5000,
    "Public Safety & Encroachment": 6500,
    "Public Property Defect": 7000,
};

function clampCost(value: number): number {
    return Math.max(1, Math.round(value));
}

export function estimateRepairCost(issue: CivicIssue): number {
    const explicitCost = (issue as CivicIssue & { estimatedRepairCost?: number }).estimatedRepairCost;
    if (typeof explicitCost === "number" && Number.isFinite(explicitCost)) return clampCost(explicitCost);
    return clampCost(DEFAULT_COSTS[issue.category] || 6000);
}

export function calculateBudgetAllocation(issues: CivicIssue[], options: BudgetOptions): BudgetAllocation {
    const candidates = issues.filter((issue) => !["resolved", "verified"].includes(issue.status));
    const crisisMultiplier = options.crisisMode ? 3 : 1;
    const equityBoost = 10;
    const items = candidates.map((issue) => {
        const baseScore = issue.priorityScore || issue.aiUrgencyScore || 10;
        const crisisBoost = options.crisisMode && options.crisisCategories.includes(issue.category) ? crisisMultiplier : 1;
        const equityBoostValue = options.neglectedWards.includes(options.wardOf(issue)) ? equityBoost : 0;
        const adjustedScore = Math.min(100, baseScore * crisisBoost + equityBoostValue);
        const estimatedCost = clampCost(options.costOf(issue));
        return { issue, baseScore, adjustedScore, estimatedCost, impactPerDollar: adjustedScore / estimatedCost };
    });

    const unit = 100;
    const capacity = Math.max(0, Math.floor(options.budgetCap / unit));
    const costs = items.map((item) => Math.ceil(item.estimatedCost / unit));
    const dp = Array.from({ length: items.length + 1 }, () => Array(capacity + 1).fill(0));
    const picks = Array.from({ length: items.length + 1 }, () => Array(capacity + 1).fill(false));

    for (let index = 1; index <= items.length; index += 1) {
        const item = items[index - 1];
        const cost = costs[index - 1];
        for (let budget = 0; budget <= capacity; budget += 1) {
            dp[index][budget] = dp[index - 1][budget];
            if (cost <= budget && dp[index - 1][budget - cost] + item.adjustedScore > dp[index][budget]) {
                dp[index][budget] = dp[index - 1][budget - cost] + item.adjustedScore;
                picks[index][budget] = true;
            }
        }
    }

    const selectedIds = new Set<string>();
    let remainingCapacity = capacity;
    for (let index = items.length; index > 0; index -= 1) {
        if (picks[index][remainingCapacity]) {
            selectedIds.add(items[index - 1].issue.id);
            remainingCapacity -= costs[index - 1];
        }
    }

    let selectedCost = items.filter((item) => selectedIds.has(item.issue.id)).reduce((total, item) => total + item.estimatedCost, 0);
    if (selectedCost > options.budgetCap) {
        const overBudget = items
            .filter((item) => selectedIds.has(item.issue.id))
            .sort((a, b) => a.impactPerDollar - b.impactPerDollar);
        for (const item of overBudget) {
            if (selectedCost <= options.budgetCap) break;
            selectedIds.delete(item.issue.id);
            selectedCost -= item.estimatedCost;
        }
    }

    const selected: BudgetSelection[] = items.filter((item) => selectedIds.has(item.issue.id)).map((item) => ({
        issueId: item.issue.id,
        estimatedCost: item.estimatedCost,
        baseScore: item.baseScore,
        adjustedScore: Math.round(item.adjustedScore),
        impactPerDollar: Number(item.impactPerDollar.toFixed(5)),
        reason: options.crisisMode && options.crisisCategories.includes(item.issue.category)
            ? "Crisis multiplier applied"
            : options.neglectedWards.includes(options.wardOf(item.issue)) ? "Equity boost applied" : "Highest feasible impact combination",
    }));
    const deferred: BudgetDeferral[] = items.filter((item) => !selectedIds.has(item.issue.id)).map((item) => ({
        issueId: item.issue.id,
        estimatedCost: item.estimatedCost,
        adjustedScore: Math.round(item.adjustedScore),
        reason: item.estimatedCost > options.budgetCap
            ? "Estimated repair cost exceeds the available budget"
            : "Deferred because another feasible combination produces greater total impact",
    }));

    const allocatedCost = selected.reduce((total, item) => total + item.estimatedCost, 0);
    return {
        budgetCap: options.budgetCap,
        allocatedCost,
        remainingBudget: Math.max(0, options.budgetCap - allocatedCost),
        totalImpact: selected.reduce((total, item) => total + item.adjustedScore, 0),
        selected,
        deferred,
        audit: {
            generatedAt: new Date().toISOString(),
            formula: "adjusted score = priority score x crisis multiplier + equity boost; maximize score under budget cap",
            crisisMode: options.crisisMode,
            crisisMultiplier,
            equityBoost,
            selectedCount: selected.length,
            deferredCount: deferred.length,
        },
    };
}
