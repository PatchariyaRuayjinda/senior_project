import { HttpError } from '../errors';

export function createRateLimiter(now = () => Date.now()) {
    const attempts = new Map<string, { count: number; until: number }>();
    return (key: string, limit: number) => {
        const time = now();
        for (const [entryKey, value] of attempts) {
            if (value.until <= time) attempts.delete(entryKey);
        }
        let entry = attempts.get(key);
        if (!entry) {
            // Keep memory bounded. Deny new buckets when saturated instead of evicting active limits.
            if (attempts.size >= 10000) throw new HttpError(429, 'RATE_LIMITED', 'Please try again later.');
            entry = { count: 0, until: time + 60000 };
            attempts.set(key, entry);
        }
        if (++entry.count > limit) throw new HttpError(429, 'RATE_LIMITED', 'Please try again later.');
    };
}
