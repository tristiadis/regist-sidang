import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/csrf';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the current session
 * This token should be included in all state-changing requests
 */
export async function GET() {
  try {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        error: 'Unauthorized - Please login to get CSRF token'
      }, { status: 401 });
    }

    // Generate CSRF token
    const csrfToken = await generateCsrfToken();

    return NextResponse.json({
      success: true,
      csrfToken,
      expiresIn: 3600, // Token valid for 1 hour
    });
  } catch (error: any) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate CSRF token'
    }, { status: 500 });
  }
}
