const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_GET_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 300;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryStatus = (status) => status === 408 || status === 429 || status >= 500;

const isRetryableNetworkError = (error) => {
    if (!error) return false;
    return error.name === "AbortError" || error instanceof TypeError;
};

const getBackoffDelay = (attempt) => {
    const jitter = Math.floor(Math.random() * 120);
    return RETRY_BASE_DELAY_MS * (2 ** attempt) + jitter;
};

const apiRequest = async (input, init = {}) => {
    const method = (init.method || "GET").toUpperCase();
    const timeoutMs = init.timeoutMs ?? (method === "GET" ? DEFAULT_TIMEOUT_MS : 0);
    const retries = method === "GET" ? (init.retries ?? DEFAULT_GET_RETRIES) : 0;
    const { timeoutMs: _, retries: __, signal: callerSignal, ...requestInit } = init;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        let timedOut = false;
        let timeoutId = null;

        const forwardAbort = () => controller.abort();
        if (callerSignal) {
            if (callerSignal.aborted) {
                controller.abort();
            } else {
                callerSignal.addEventListener("abort", forwardAbort, { once: true });
            }
        }

        if (timeoutMs > 0) {
            timeoutId = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, timeoutMs);
        }

        try {
            const response = await fetch(input, { ...requestInit, signal: controller.signal });

            if (attempt < retries && shouldRetryStatus(response.status)) {
                await wait(getBackoffDelay(attempt));
                continue;
            }

            return response;
        } catch (error) {
            if (timedOut) {
                error = new Error("Request timed out");
            }

            if (attempt < retries && isRetryableNetworkError(error)) {
                await wait(getBackoffDelay(attempt));
                continue;
            }

            throw error;
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (callerSignal) {
                callerSignal.removeEventListener("abort", forwardAbort);
            }
        }
    }

    throw new Error("Request failed");
};

export default apiRequest;
