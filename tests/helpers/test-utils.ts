/**
 * Test Utilities
 *
 * Common utility functions for tests
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ======================
// SESSION HELPERS
// ======================

/**
 * Create mock session for testing
 */
export const createMockSession = (role: 'admin' | 'akademik' | 'dosen' | 'mahasiswa', userId: string = '1') => {
  return {
    user: {
      id: userId,
      email: `${role}@test.com`,
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
};

/**
 * Mock getServerSession for API route tests
 */
export const mockServerSession = (session: any) => {
  jest.spyOn(require('next-auth'), 'getServerSession').mockResolvedValue(session);
};

// ======================
// FILE HELPERS
// ======================

/**
 * Create a test File object for upload tests
 */
export const createTestFile = (
  content: string | Buffer,
  filename: string,
  mimeType: string = 'application/pdf'
): File => {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return new File([buffer], filename, { type: mimeType });
};

/**
 * Create a large file for size validation tests
 */
export const createLargeFile = (sizeMB: number): File => {
  const buffer = Buffer.alloc(sizeMB * 1024 * 1024);
  return new File([buffer], 'large-file.pdf', { type: 'application/pdf' });
};

/**
 * Create a small valid PDF file
 */
export const createValidPDF = (): File => {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
trailer
<< /Size 4 /Root 1 0 R >>
%%EOF`;

  return createTestFile(pdfContent, 'test.pdf', 'application/pdf');
};

/**
 * Create a test image file
 */
export const createValidImage = (): File => {
  // Minimal valid JPEG (1x1 pixel)
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
  ]);

  return new File([jpegData], 'test.jpg', { type: 'image/jpeg' });
};

// ======================
// WAIT UTILITIES
// ======================

/**
 * Wait for a specified time (in milliseconds)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

// ======================
// ASSERTION HELPERS
// ======================

/**
 * Assert that an error was thrown with specific message
 */
export const expectError = async (
  fn: () => Promise<any>,
  expectedMessage?: string
): Promise<Error> => {
  try {
    await fn();
    throw new Error('Expected function to throw an error, but it did not');
  } catch (error: any) {
    if (expectedMessage && !error.message.includes(expectedMessage)) {
      throw new Error(
        `Expected error message to include "${expectedMessage}", but got: "${error.message}"`
      );
    }
    return error;
  }
};

/**
 * Assert that response has specific status code
 */
export const expectStatus = (response: Response, expectedStatus: number) => {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, but got ${response.status}`
    );
  }
};

/**
 * Assert that response body contains specific data
 */
export const expectResponseData = async (
  response: Response,
  expectedData: any
) => {
  const data = await response.json();

  for (const [key, value] of Object.entries(expectedData)) {
    if (data[key] !== value) {
      throw new Error(
        `Expected ${key} to be ${value}, but got ${data[key]}`
      );
    }
  }
};

// ======================
// DATE HELPERS
// ======================

/**
 * Create a date relative to now
 */
export const createDateRelative = (daysFromNow: number): Date => {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// ======================
// RANDOM DATA GENERATORS
// ======================

/**
 * Generate random string
 */
export const randomString = (length: number = 10): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate random email
 */
export const randomEmail = (): string => {
  return `test-${randomString(8)}@test.com`;
};

/**
 * Generate random NIM
 */
export const randomNIM = (): string => {
  return String(Math.floor(Math.random() * 10000000000)).padStart(10, '0');
};

// ======================
// API TEST HELPERS
// ======================

/**
 * Create mock NextRequest for testing
 */
export const createMockRequest = (
  method: string = 'GET',
  body?: any,
  headers?: Record<string, string>
): any => {
  return {
    method,
    headers: new Map(Object.entries(headers || {})),
    json: async () => body,
    formData: async () => body,
    nextUrl: {
      searchParams: new URLSearchParams(),
    },
  };
};

/**
 * Create mock NextResponse for testing
 */
export const createMockResponse = (data: any, status: number = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

// ======================
// CONSOLE HELPERS
// ======================

/**
 * Suppress console output during tests
 */
export const suppressConsole = () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
};

/**
 * Capture console output
 */
export const captureConsole = () => {
  const logs: string[] = [];
  const errors: string[] = [];

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args.join(' '));
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  return { logs, errors };
};

// ======================
// CLEANUP HELPERS
// ======================

/**
 * Clear all mocks after each test
 */
export const setupMockClearance = () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
};

/**
 * Reset all mocks after each test
 */
export const setupMockReset = () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
};
