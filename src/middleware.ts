import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting storage (in-memory for development, use Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

// Endpoints that require stricter rate limiting
const STRICT_RATE_LIMIT_PATHS = [
  '/api/auth',
  '/api/upload',
  '/api/approvals/action',
];
const STRICT_RATE_LIMIT_MAX = 20; // requests per window

/**
 * Rate limiting middleware
 * Tracks requests per IP address and enforces limits
 */
function rateLimit(request: NextRequest): NextResponse | null {
  // Get client IP (works with various proxy setups)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const path = request.nextUrl.pathname;

  // Determine rate limit for this path
  const isStrictPath = STRICT_RATE_LIMIT_PATHS.some(p => path.startsWith(p));
  const maxRequests = isStrictPath ? STRICT_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;

  // Get or create rate limit entry
  const key = `${ip}:${path}`;
  let limitData = rateLimitMap.get(key);

  // Reset if window expired
  if (!limitData || now > limitData.resetTime) {
    limitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  // Increment request count
  limitData.count++;
  rateLimitMap.set(key, limitData);

  // Clean up old entries periodically (every 1000 requests)
  if (rateLimitMap.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < cutoff) {
        rateLimitMap.delete(k);
      }
    }
  }

  // Check if rate limit exceeded
  if (limitData.count > maxRequests) {
    const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': Math.max(0, maxRequests - limitData.count).toString(),
          'X-RateLimit-Reset': limitData.resetTime.toString(),
        },
      }
    );
  }

  return null; // No rate limit violation
}

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Continue with the request
  const response = NextResponse.next();

  // ============================================
  // Security Headers
  // ============================================

  // Content Security Policy (CSP)
  // Prevents XSS attacks by controlling which resources can be loaded
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind CSS requires unsafe-inline
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Prevent clickjacking
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests", // Upgrade HTTP to HTTPS
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  // Strict-Transport-Security (HSTS)
  // Forces HTTPS for 1 year, including subdomains
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // X-Frame-Options
  // Prevents clickjacking by blocking iframe embedding
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  // Enables browser XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  // Controls referrer information sent with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  // Restricts browser features that can be used
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC tracking
    'payment=()',
    'usb=()',
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // X-DNS-Prefetch-Control
  // Controls DNS prefetching
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cross-Origin-Embedder-Policy (COEP)
  // Prevents loading cross-origin resources without explicit permission
  // response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cross-Origin-Opener-Policy (COOP)
  // Prevents other origins from gaining access to window object
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  // Cross-Origin-Resource-Policy (CORP)
  // Prevents other origins from loading resources
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
