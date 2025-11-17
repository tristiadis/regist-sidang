/**
 * Structured logging utility
 * Provides consistent, queryable logs for debugging and monitoring
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  userId?: string | number;
  requestId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel: LogLevel;

  constructor() {
    // Set minimum log level based on environment
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Checks if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Formats log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      return JSON.stringify(entry, null, 2);
    }
    // Single-line JSON for production (easier to parse)
    return JSON.stringify(entry);
  }

  /**
   * Core logging function
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Debug level logging
   * Use for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   * Use for error events
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log API request
   */
  apiRequest(
    method: string,
    endpoint: string,
    context?: Omit<LogContext, 'method' | 'endpoint'>
  ): void {
    this.info('API Request', {
      method,
      endpoint,
      ...context,
    });
  }

  /**
   * Log API response
   */
  apiResponse(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, 'API Response', {
      method,
      endpoint,
      status,
      duration,
      ...context,
    });
  }

  /**
   * Log database query
   */
  dbQuery(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug('Database Query', {
      operation,
      table,
      duration,
      ...context,
    });
  }

  /**
   * Log authentication event
   */
  auth(
    event: 'login' | 'logout' | 'session_created' | 'session_expired' | 'auth_failed',
    context?: LogContext
  ): void {
    this.info(`Authentication: ${event}`, context);
  }

  /**
   * Log security event
   */
  security(
    event: 'rate_limit_exceeded' | 'csrf_invalid' | 'unauthorized_access' | 'suspicious_activity',
    context?: LogContext
  ): void {
    this.warn(`Security: ${event}`, context);
  }

  /**
   * Log file operation
   */
  fileOperation(
    operation: 'upload' | 'download' | 'delete',
    filename: string,
    size?: number,
    context?: LogContext
  ): void {
    this.info(`File ${operation}`, {
      filename,
      ...(size && { size }),
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Helper to create request context from NextRequest
 */
export function createRequestContext(
  req: Request,
  additionalContext?: Partial<LogContext>
): LogContext {
  return {
    method: req.method,
    endpoint: new URL(req.url).pathname,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    ...additionalContext,
  };
}

/**
 * Performance timing helper
 */
export class PerformanceTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Log elapsed time
   */
  logElapsed(message: string, context?: LogContext): void {
    logger.debug(message, {
      duration: this.elapsed(),
      ...context,
    });
  }
}
