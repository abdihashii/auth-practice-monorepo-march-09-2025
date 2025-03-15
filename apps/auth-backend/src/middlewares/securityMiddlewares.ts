// Third-party imports
import type { CustomEnv } from "@/types";
import type { MiddlewareHandler } from "hono";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

/**
 * CSRF protection middleware configuration
 *
 * This middleware protects the API from Cross-Site Request Forgery (CSRF)
 * attacks by requiring and validating a CSRF token in the request headers.
 *
 * It checks the CSRF token in the request headers and validates it.
 * If the token is invalid, the request is rejected with a 403 error.
 */
export const csrfMiddleware = csrf({
  origin: process.env.FRONTEND_URL, // Only allow requests from the frontend URL
});

/**
 * Security headers middleware configuration
 *
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

/**
 * HTTPS enforcement middleware (only in production)
 *
 * Redirects HTTP requests to HTTPS in production environment
 */
export const httpsEnforcementMiddleware: MiddlewareHandler<CustomEnv> = async (
  c,
  next
) => {
  if (process.env.NODE_ENV === "production") {
    const proto = c.req.header("x-forwarded-proto");
    if (proto && proto !== "https") {
      const url = new URL(c.req.url);
      url.protocol = "https:";
      return c.redirect(url.toString(), 301);
    }
  }
  await next();
};

/**
 * Content-Type enforcement Middleware
 *
 * Ensures proper Content-Type headers are used for requests.
 * Enforces application/json for POST, PUT, PATCH requests
 */
export const contentTypeMiddleware: MiddlewareHandler<CustomEnv> = async (
  c,
  next
) => {
  const contentType = c.req.header("content-type");
  const method = c.req.method;

  // Only check content-type for POST, PUT, PATCH requests
  if (
    ["POST", "PUT", "PATCH"].includes(method) &&
    (!contentType || !contentType.includes("application/json"))
  ) {
    return c.json(
      {
        error: "Content-Type must be application/json",
      },
      415
    );
  }
  await next();
};

/**
 * Cookie security Middleware
 *
 * Sets secure cookie policies including HttpOnly, SameSite,
 * and Secure (in production)
 */
export const cookieMiddleware: MiddlewareHandler<CustomEnv> = async (
  c,
  next
) => {
  // Set secure cookie policy header
  c.header(
    "Set-Cookie",
    `Path=/; ${
      process.env.NODE_ENV === "production" ? "Secure; " : ""
    }HttpOnly; SameSite=Lax`
  );
  await next();
};

/**
 * Combined security middlewares
 *
 * Applies all security middlewares in the correct order
 */
export const securityMiddlewares: MiddlewareHandler<CustomEnv>[] = [
  httpsEnforcementMiddleware,
  contentTypeMiddleware,
  cookieMiddleware,
  securityHeadersMiddleware,
  csrfMiddleware,
];
