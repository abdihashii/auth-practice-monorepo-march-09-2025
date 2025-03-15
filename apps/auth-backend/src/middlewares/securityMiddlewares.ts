// Third-party imports
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

// Local imports

/**
 * CSRF protection middleware configuration
 *
 * This middleware is used to protect the API from CSRF attacks by
 * preventing Cross-Site Request Forgery (CSRF) attacks by requiring
 * a CSRF token in the request headers.
 *
 * It checks the CSRF token in the request headers and validates it.
 * If the token is invalid, the request is rejected with a 403 error.
 */
export const csrfMiddleware = csrf({
  origin: process.env.FRONTEND_URL, // Only allow requests from the frontend URL
});

/**
 * Security headers middleware configuration
 * These HTTP headers help protect against common web vulnerabilities
 */
export const securityHeadersMiddleware = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["self"], // Only allow resources from the same origin
    scriptSrc: ["self"], // Only allow scripts from the same origin
    styleSrc: ["self"], // Only allow styles from the same origin
    imgSrc: ["self", "data:", "blob:"], // Allow images from the same origin + data/blob URLs
    connectSrc: ["self", "ws:", "wss:"], // Allow WebSocket connections
  },
  xFrameOptions: "DENY", // Prevent site from being embedded in iframes
  xContentTypeOptions: "nosniff", // Prevent MIME type sniffing
  referrerPolicy: "strict-origin-when-cross-origin", // Control referrer information
  // Only enable HSTS in production
  ...(process.env.NODE_ENV === "production"
    ? {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      }
    : {}),
});
