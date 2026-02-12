import { ApiResponse } from '../types';

/**
 * Tipos de errores personalizados
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, public service?: string) {
    super(message, 503, 'EXTERNAL_API_ERROR');
    this.name = 'ExternalAPIError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, 504, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

/**
 * Handler centralizado de errores para API Routes
 */
export function handleAPIError(error: unknown): {
  response: Response;
  logged: boolean;
} {
  console.error('[API Error]', error);

  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  } else if (error instanceof Error) {
    message = error.message;

    // Errores DNS comunes
    if (error.message.includes('ENOTFOUND')) {
      statusCode = 404;
      code = 'DOMAIN_NOT_FOUND';
      message = 'Domain not found';
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      statusCode = 504;
      code = 'CONNECTION_TIMEOUT';
      message = 'Connection timeout';
    } else if (error.message.includes('ECONNRESET')) {
      statusCode = 503;
      code = 'CONNECTION_RESET';
      message = 'Connection reset';
    }
  }

  const response: ApiResponse<null> = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  return {
    response: new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Code': code,
      },
    }),
    logged: true,
  };
}

/**
 * Wrapper para funciones async con manejo de errores
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    console.error(errorMessage || 'Error in tryCatch:', error);

    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: errorMessage || 'Unknown error occurred' };
  }
}

/**
 * Logger de errores (puede extenderse para enviar a servicio externo)
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  };

  console.error('[Error Log]', JSON.stringify(errorLog, null, 2));

  // TODO: Enviar a servicio de logging externo (Sentry, LogRocket, etc.)
}

/**
 * Validar response de API externa
 */
export function validateExternalAPIResponse(
  response: any,
  service: string
): void {
  if (!response) {
    throw new ExternalAPIError(`Empty response from ${service}`, service);
  }

  if (response.error || response.errors) {
    const errorMessage = response.error || response.errors[0]?.message || 'Unknown error';
    throw new ExternalAPIError(`${service}: ${errorMessage}`, service);
  }
}

/**
 * Crear response exitosa estandarizada
 */
export function createSuccessResponse<T>(
  data: T,
  cached: boolean = false,
  headers?: Record<string, string>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    cached,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cached ? 'public, max-age=300' : 'no-cache',
      ...headers,
    },
  });
}

/**
 * Crear response de error estandarizada
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  headers?: Record<string, string>
): Response {
  const response: ApiResponse<null> = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
