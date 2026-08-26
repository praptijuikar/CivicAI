import crypto from "crypto";

export type ComplaintQueueStatus = "queued" | "processing" | "completed" | "failed";

export interface ComplaintQueueJob<T> {
    token: string;
    userId: string;
    payload: T;
    status: ComplaintQueueStatus;
    attempts: number;
    createdAt: string;
    updatedAt: string;
    issueId?: string;
    error?: string;
}

type QueueOptions<T> = {
    maxSize: number;
    concurrency: number;
    process: (job: ComplaintQueueJob<T>) => Promise<{ issueId: string }>;
};

export class ComplaintQueue<T> {
    private readonly jobs = new Map<string, ComplaintQueueJob<T>>();
    private readonly pending: ComplaintQueueJob<T>[] = [];
    private activeWorkers = 0;

    constructor(private readonly options: QueueOptions<T>) { }

    enqueue(userId: string, payload: T): ComplaintQueueJob<T> | null {
        if (this.pending.length >= this.options.maxSize) return null;
        const now = new Date().toISOString();
        const job: ComplaintQueueJob<T> = {
            token: `cmp-${crypto.randomUUID()}`,
            userId,
            payload,
            status: "queued",
            attempts: 0,
            createdAt: now,
            updatedAt: now,
        };
        this.jobs.set(job.token, job);
        this.pending.push(job);
        this.drain();
        return job;
    }

    get(token: string): ComplaintQueueJob<T> | undefined {
        return this.jobs.get(token);
    }

    size(): number {
        return this.pending.length + this.activeWorkers;
    }

    private drain(): void {
        while (this.activeWorkers < this.options.concurrency && this.pending.length > 0) {
            const job = this.pending.shift();
            if (!job) return;
            this.activeWorkers += 1;
            void this.process(job).finally(() => {
                this.activeWorkers -= 1;
                this.drain();
            });
        }
    }

    private async process(job: ComplaintQueueJob<T>): Promise<void> {
        job.status = "processing";
        job.attempts += 1;
        job.updatedAt = new Date().toISOString();
        try {
            const result = await this.options.process(job);
            job.issueId = result.issueId;
            job.status = "completed";
            job.updatedAt = new Date().toISOString();
        } catch (error) {
            if (job.attempts < 3) {
                job.status = "queued";
                job.updatedAt = new Date().toISOString();
                setTimeout(() => {
                    this.pending.push(job);
                    this.drain();
                }, 2 ** job.attempts * 1000);
            } else {
                job.status = "failed";
                job.error = error instanceof Error ? error.message : "Complaint processing failed";
                job.updatedAt = new Date().toISOString();
            }
        }
    }
}
