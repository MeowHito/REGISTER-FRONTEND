import { CONTEXT_URL } from "constants/helper";
import createRequest from "./request";

/**
 * Frontend Error Logger
 * Logs errors to console and optionally sends to backend for storage
 * 
 * Usage:
 *   errorLogger.error('PaymentFlow', error, { orderId: '123', action: 'createQR' });
 *   errorLogger.warn('CouponValidation', 'Invalid coupon', { couponCode: 'ABC' });
 */

const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info'
};

const LOG_ENDPOINT = 'api/log/frontend-error';

const REDACTED = '[REDACTED]';
const OMITTED = '[OMITTED]';

const CREDENTIAL_ENDPOINTS = [
    '/public-api/register',
    '/public-api/login',
    '/public-api/checkUserEmail',
    '/public-api/updateUserToken',
    '/api/user/updatePassword',
    '/api/user/resetPassword'
];

const isCredentialEndpoint = (url) =>
    CREDENTIAL_ENDPOINTS.some((endpoint) => (url || '').toLowerCase().includes(endpoint.toLowerCase()));

const SENSITIVE_KEY_EXACT = /^(pin|otp|cvv|npw|pwd|token|secret|password|authorization)$/i;

const SENSITIVE_KEY_PART = /(password|passwd|token|secret|cardnumber|idno|idcard|citizenid|accesskey|apikey|authorization)/i;

const isSensitiveKey = (key) => {
    const normalized = String(key).replace(/[_-]/g, '');
    return SENSITIVE_KEY_EXACT.test(normalized) || SENSITIVE_KEY_PART.test(normalized);
};

const redactValue = (value) => {
    if (Array.isArray(value)) return value.map(redactValue);

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [
                key,
                isSensitiveKey(key) ? REDACTED : redactValue(val)
            ])
        );
    }

    return value;
};

const redactPayload = (data) => {
    if (data == null) return data;

    if (typeof data === 'string') {
        try {
            return JSON.stringify(redactValue(JSON.parse(data)));
        } catch {
            return SENSITIVE_KEY_PART.test(data.replace(/[_-]/g, '')) ? REDACTED : data;
        }
    }

    return redactValue(data);
};

// The backend stores requestData as text, so it must always leave here as a string
// (an object — e.g. an upload's FormData — fails to deserialize and the log is lost).
// A FormData body is described by field name only, never its file contents.
const describeRequestData = (data) => {
    if (data == null) return data;
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
        const fields = [...data.entries()].map(([key, val]) => {
            if (typeof File !== 'undefined' && val instanceof File) return `${key}=<file ${val.name}, ${val.size} bytes>`;
            return `${key}=${isSensitiveKey(key) ? REDACTED : String(val)}`;
        });
        return `FormData(${fields.join(', ')})`;
    }
    const redacted = redactPayload(data);
    return typeof redacted === 'string' ? redacted : JSON.stringify(redacted);
};

const buildLogPayload = (level, context, message, meta = {}) => {
    return {
        level,
        context,
        message: message instanceof Error ? message.message : String(message),
        stack: message instanceof Error ? message.stack : undefined,
        url: globalThis.location?.href,
        userAgent: navigator?.userAgent,
        timestamp: new Date().toISOString(),
        ...meta
    };
};

const sendToBackend = async (rawPayload) => {
    const url = `${CONTEXT_URL}/${LOG_ENDPOINT}`;
    const payload = redactValue(rawPayload);

    try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const sent = navigator.sendBeacon(url, blob);

        console.log('[ErrorLogger] sendBeacon to:', url, 'success:', sent);

        if (!sent) {
            console.log('[ErrorLogger] Fallback to axios POST');
            await createRequest.post(LOG_ENDPOINT, payload).catch((err) => {
                console.warn('[ErrorLogger] Axios fallback failed:', err?.message);
            });
        }
    } catch (err) {
        console.warn('[ErrorLogger] sendToBackend failed:', err?.message);
    }
};

const errorLogger = {
    /**
     * Log an error (critical issues that need attention)
     * @param {string} context - Where the error occurred (e.g., 'PaymentFlow', 'CouponValidation')
     * @param {Error|string} error - The error object or message
     * @param {object} meta - Additional context (orderId, userId, etc.)
     */
    error: (context, error, meta = {}) => {
        const payload = buildLogPayload(LOG_LEVELS.ERROR, context, error, meta);
        console.error(`[${context}]`, payload);
        sendToBackend(payload);
        return payload;
    },

    /**
     * Log a warning (issues that don't break functionality)
     * @param {string} context - Where the warning occurred
     * @param {string} message - Warning message
     * @param {object} meta - Additional context
     */
    warn: (context, message, meta = {}) => {
        const payload = buildLogPayload(LOG_LEVELS.WARN, context, message, meta);
        console.warn(`[${context}]`, payload);
        return payload;
    },

    /**
     * Log info (for tracking important events, not errors)
     * @param {string} context - Where the event occurred
     * @param {string} message - Info message
     * @param {object} meta - Additional context
     */
    info: (context, message, meta = {}) => {
        const payload = buildLogPayload(LOG_LEVELS.INFO, context, message, meta);
        if (!import.meta.env.PROD) {
            console.info(`[${context}]`, payload);
        }
        return payload;
    },

    apiError: (axiosError, meta = {}) => {
        const url = axiosError?.config?.url;
        const payload = buildLogPayload(LOG_LEVELS.ERROR, 'API_ERROR', axiosError?.message, {
            url,
            method: axiosError?.config?.method?.toUpperCase(),
            status: axiosError?.response?.status,
            statusText: axiosError?.response?.statusText,
            responseData: redactPayload(axiosError?.response?.data),
            requestData: isCredentialEndpoint(url) ? OMITTED : describeRequestData(axiosError?.config?.data),
            ...meta
        });
        console.error('[API_ERROR]', payload);
        sendToBackend(payload);
        return payload;
    }
};

export default errorLogger;
