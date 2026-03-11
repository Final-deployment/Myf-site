/**
 * @fileoverview Rate limiter utility for API call protection
 * @module utils/rateLimiter
 */

/**
 * Rate limit configuration for an action
 */
interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Optional message when rate limited */
    message?: string;
}

/**
 * Rate limit state for an action
 */
interface RateLimitState {
    /** Timestamps of recent requests */
    requests: number[];
    /** Whether currently blocked */
    isBlocked: boolean;
    /** Time when block expires */
    blockedUntil: number | null;
}

/**
 * Default rate limit configurations for different actions
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    /** Login attempts */
    login: {
        maxRequests: 5,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many login attempts. Please try again later.',
    },
    /** API calls */
    api: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many requests. Please slow down.',
    },
    /** Form submissions */
    form: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many form submissions. Please wait.',
    },
    /** Search queries */
    search: {
        maxRequests: 30,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many search requests. Please wait.',
    },
    /** Export operations */
    export: {
        maxRequests: 5,
        windowMs: 5 * 60 * 1000, // 5 minutes
        message: 'Too many export requests. Please wait.',
    },
};

/**
 * Rate limiter class using token bucket algorithm
 * 
 * @example
 * ```ts
 * const limiter = new RateLimiter();
 * 
 * // Check if action is allowed
 * if (limiter.isAllowed('login')) {
 *   // Perform login
 * } else {
 *   const remaining = limiter.getRemainingTime('login');
 *   console.log(`Try again in ${remaining}ms`);
 * }
 * ```
 */
export class RateLimiter {
    private state: Map<string, RateLimitState> = new Map();
    private configs: Map<string, RateLimitConfig> = new Map();

    constructor(customConfigs?: Record<string, RateLimitConfig>) {
        // Initialize with default configs
        Object.entries(RATE_LIMIT_CONFIGS).forEach(([key, config]) => {
            this.configs.set(key, config);
        });

        // Add custom configs
        if (customConfigs) {
            Object.entries(customConfigs).forEach(([key, config]) => {
                this.configs.set(key, config);
            });
        }
    }

    /**
     * Get or create state for an action
     */
    private getState(action: string): RateLimitState {
        if (!this.state.has(action)) {
            this.state.set(action, {
                requests: [],
                isBlocked: false,
                blockedUntil: null,
            });
        }
        return this.state.get(action)!;
    }

    /**
     * Get config for an action
     */
    private getConfig(action: string): RateLimitConfig {
        return (
            this.configs.get(action) || {
                maxRequests: 60,
                windowMs: 60 * 1000,
            }
        );
    }

    /**
     * Clean up old requests outside the time window
     */
    private cleanupRequests(action: string): void {
        const state = this.getState(action);
        const config = this.getConfig(action);
        const now = Date.now();
        const windowStart = now - config.windowMs;

        state.requests = state.requests.filter((time) => time > windowStart);

        // Check if block has expired
        if (state.blockedUntil && now > state.blockedUntil) {
            state.isBlocked = false;
            state.blockedUntil = null;
        }
    }

    /**
     * Check if an action is allowed and record the request
     * 
     * @param action - The action identifier
     * @returns Whether the action is allowed
     */
    isAllowed(action: string): boolean {
        this.cleanupRequests(action);

        const state = this.getState(action);
        const config = this.getConfig(action);

        // Check if currently blocked
        if (state.isBlocked) {
            return false;
        }

        // Check if within limits
        if (state.requests.length >= config.maxRequests) {
            // Block for the remaining window time
            state.isBlocked = true;
            state.blockedUntil = Date.now() + config.windowMs;
            return false;
        }

        // Record the request
        state.requests.push(Date.now());
        return true;
    }

    /**
     * Get remaining time until the action is allowed again
     * 
     * @param action - The action identifier
     * @returns Remaining time in milliseconds, or 0 if allowed
     */
    getRemainingTime(action: string): number {
        this.cleanupRequests(action);

        const state = this.getState(action);

        if (state.blockedUntil) {
            return Math.max(0, state.blockedUntil - Date.now());
        }

        return 0;
    }

    /**
     * Get the rate limit message for an action
     * 
     * @param action - The action identifier
     * @returns The rate limit message
     */
    getMessage(action: string): string {
        const config = this.getConfig(action);
        return config.message || 'Rate limit exceeded. Please try again later.';
    }

    /**
     * Get remaining requests allowed in current window
     * 
     * @param action - The action identifier
     * @returns Number of remaining requests
     */
    getRemainingRequests(action: string): number {
        this.cleanupRequests(action);

        const state = this.getState(action);
        const config = this.getConfig(action);

        return Math.max(0, config.maxRequests - state.requests.length);
    }

    /**
     * Reset rate limit for an action
     * 
     * @param action - The action identifier
     */
    reset(action: string): void {
        this.state.delete(action);
    }

    /**
     * Reset all rate limits
     */
    resetAll(): void {
        this.state.clear();
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

export default rateLimiter;
