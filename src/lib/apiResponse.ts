import { NextResponse } from 'next/server';

/**
 * Standard API response types
 * Ensures consistent response format across all endpoints
 */

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: string[] | Record<string, any>;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error codes for common scenarios
 */
export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Input Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // File Operations
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // CSRF
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',

  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Success response builder
 * Usage: return successResponse(data, 'Operation completed')
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Error response builder
 * Usage: return errorResponse('Not found', 404, ApiErrorCode.NOT_FOUND)
 */
export function errorResponse(
  error: string,
  status: number = 500,
  code?: ApiErrorCode | string,
  details?: string[] | Record<string, any>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Pre-built error responses for common scenarios
 */
export const CommonErrors = {
  unauthorized: (message: string = 'Unauthorized - Please login to continue') =>
    errorResponse(message, 401, ApiErrorCode.UNAUTHORIZED),

  forbidden: (message: string = 'Forbidden - You do not have permission to access this resource') =>
    errorResponse(message, 403, ApiErrorCode.FORBIDDEN),

  notFound: (resource: string = 'Resource') =>
    errorResponse(`${resource} not found`, 404, ApiErrorCode.NOT_FOUND),

  validationError: (details: string[] | Record<string, any>) =>
    errorResponse('Validation failed', 400, ApiErrorCode.VALIDATION_ERROR, details),

  invalidInput: (message: string = 'Invalid input provided') =>
    errorResponse(message, 400, ApiErrorCode.INVALID_INPUT),

  conflict: (message: string = 'Resource already exists or conflict detected') =>
    errorResponse(message, 409, ApiErrorCode.CONFLICT),

  rateLimitExceeded: (retryAfter: number) =>
    errorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      429,
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      { retryAfter }
    ),

  csrfInvalid: () =>
    errorResponse('Invalid or missing CSRF token', 403, ApiErrorCode.CSRF_TOKEN_INVALID),

  internalError: (message: string = 'Internal server error') =>
    errorResponse(message, 500, ApiErrorCode.INTERNAL_ERROR),

  databaseError: () =>
    errorResponse('Database operation failed', 500, ApiErrorCode.DATABASE_ERROR),
};

/**
 * Paginated response builder
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
  message?: string
): NextResponse<ApiSuccessResponse<PaginatedData<T>>> {
  const totalPages = Math.ceil(total / pageSize);

  const data: PaginatedData<T> = {
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };

  return successResponse(data, message);
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ApiResponse
): response is ApiErrorResponse {
  return response.success === false;
}
