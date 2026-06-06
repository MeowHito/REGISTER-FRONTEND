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

/**
 * Build structured log payload
 */
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

/**
 * Send log to backend (fire-and-forget)
 */
const sendToBackend = async (payload) => {
    const url = `${CONTEXT_URL}/${LOG_ENDPOINT}`;
    
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

    /**
     * Log API error with structured format
     * @param {object} axiosError - Axios error object
     * @param {object} meta - Additional context
     */
    apiError: (axiosError, meta = {}) => {
        const payload = buildLogPayload(LOG_LEVELS.ERROR, 'API_ERROR', axiosError?.message, {
            url: axiosError?.config?.url,
            method: axiosError?.config?.method?.toUpperCase(),
            status: axiosError?.response?.status,
            statusText: axiosError?.response?.statusText,
            responseData: axiosError?.response?.data,
            requestData: axiosError?.config?.data,
            ...meta
        });
        console.error('[API_ERROR]', payload);
        sendToBackend(payload);
        return payload;
    }
};

export default errorLogger;
