import { randomBytes, createHmac } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development';

/**
 * Generates a CSRF token for the current session
 * Token is tied to user's session to prevent token fixation attacks
 */
export async function generateCsrfToken(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'anonymous';

  // Generate random token
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');

  // Create HMAC signature to bind token to user session
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${token}:${userId}`);
  const signature = hmac.digest('hex');

  // Combine token and signature
  return `${token}.${signature}`;
}

/**
 * Validates a CSRF token against the current session
 * Returns true if token is valid, false otherwise
 */
export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) {
    return false;
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || 'anonymous';

  // Split token and signature
  const [tokenPart, signature] = token.split('.');
  if (!tokenPart || !signature) {
    return false;
  }

  // Verify signature
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${tokenPart}:${userId}`);
  const expectedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * Middleware helper to validate CSRF token from request
 * Checks for token in X-CSRF-Token header or csrfToken field in body
 */
export async function validateCsrfFromRequest(req: NextRequest): Promise<boolean> {
  // Get token from header (preferred)
  let token = req.headers.get('X-CSRF-Token');

  // If not in header, try to get from body (for form submissions)
  if (!token) {
    try {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const body = await req.json();
        token = body.csrfToken;
      } else if (contentType?.includes('multipart/form-data') || contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        token = formData.get('csrfToken') as string;
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  return validateCsrfToken(token);
}

/**
 * API route helper to validate CSRF token
 * Call this at the beginning of POST/PUT/PATCH/DELETE handlers
 */
export async function requireCsrfToken(req: NextRequest): Promise<void> {
  const isValid = await validateCsrfFromRequest(req);

  if (!isValid) {
    throw new Error('Invalid or missing CSRF token');
  }
}
