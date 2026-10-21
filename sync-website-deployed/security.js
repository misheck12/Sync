/**
 * SECURITY UTILITIES
 * XSS Prevention and Input Sanitization
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes dangerous characters
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize user input for display
 * More aggressive than sanitizeHTML
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
}

/**
 * Sanitize URL to prevent javascript: protocol
 */
function sanitizeURL(url) {
    if (typeof url !== 'string') return '#';
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerURL = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
        if (lowerURL.startsWith(protocol)) {
            return '#';
        }
    }
    
    return url;
}

/**
 * Rate limiting for form submissions
 */
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
        this.attempts = new Map();
    }
    
    isAllowed(key) {
        const now = Date.now();
        const userAttempts = this.attempts.get(key) || [];
        
        // Remove old attempts outside the window
        const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
        
        if (recentAttempts.length >= this.maxAttempts) {
            return false;
        }
        
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);
        return true;
    }
    
    reset(key) {
        this.attempts.delete(key);
    }
}

// Global rate limiter instances
const contactFormLimiter = new RateLimiter(3, 60000); // 3 attempts per minute
const signupFormLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes

/**
 * Secure fetch wrapper with timeout and error handling
 */
async function secureFetch(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

/**
 * Create safe DOM element with text content
 */
function createSafeElement(tag, textContent, className = '') {
    const element = document.createElement(tag);
    if (textContent) {
        element.textContent = textContent; // Safe - no HTML parsing
    }
    if (className) {
        element.className = className;
    }
    return element;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        sanitizeInput,
        isValidEmail,
        isValidPhone,
        sanitizeURL,
        RateLimiter,
        contactFormLimiter,
        signupFormLimiter,
        secureFetch,
        createSafeElement
    };
}
