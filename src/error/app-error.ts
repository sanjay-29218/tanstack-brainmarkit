// type is the type of the error
type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'internal'
  | 'validation'
  | 'offline'
export const ErrorType = {
  BAD_REQUEST: 'bad_request',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit',
  INTERNAL: 'internal',
  VALIDATION: 'validation',
  OFFLINE: 'offline',
} as const

// surface is the context in which the error occurred
export type ErrorSurface = 'api' | 'auth' | 'chat' | 'database' | 'payment' | 'upload'
export const ErrorSurface = {
  API: 'api',
  AUTH: 'auth',
  CHAT: 'chat',
  database: 'database',
  PAYMENT: 'payment',
  UPLOAD: 'upload',
  API_KEY: 'api_key',
  DOCUMENT: 'document',
} as const

export type ErrorVisibility = 'RESPONSE' | 'LOG_ONLY' | 'NONE'

export interface AppErrorOptions {
  cause?: unknown
  visibility?: ErrorVisibility
  metadata?: Record<string, unknown>
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly surface: ErrorSurface
  public readonly code: string // e.g. BAD_REQUEST:API
  public readonly status: number // HTTP status
  public readonly summary: string
  public readonly visibility: ErrorVisibility
  public readonly metadata?: Record<string, unknown>
  public readonly cause?: unknown

  constructor(
    surface: ErrorSurface,
    type: ErrorType,
    summary: string,
    options: AppErrorOptions = {},
  ) {
    // this super call is calling the constructor of the Error class
    super(summary)

    this.type = type
    this.surface = surface
    this.cause = options.cause
    this.metadata = options.metadata
    this.visibility = options.visibility ?? 'RESPONSE'
    this.summary = summary
    this.code = `${type}:${surface}`
    this.status = AppError.mapStatus(type)

    // Necessary line for extending built-in classes in TS
    Object.setPrototypeOf(this, new.target.prototype)
  }

  //   private means it is only accessible within the class
  // static means it is accessible without creating an instance of the class

  private static mapStatus(type: ErrorType): number {
    switch (type) {
      case ErrorType.BAD_REQUEST:
        return 400
      case ErrorType.UNAUTHORIZED:
        return 401
      case ErrorType.FORBIDDEN:
        return 403
      case ErrorType.NOT_FOUND:
        return 404
      case ErrorType.RATE_LIMIT:
        return 429
      case ErrorType.INTERNAL:
        return 500
      case ErrorType.VALIDATION:
        return 400
      default:
        return 500
    }
  }

  //   this is public method to return a response
  toResponse() {
    if (this.visibility === 'NONE') {
      return new Response(null, { status: this.status })
    }

    if (this.visibility === 'LOG_ONLY') {
      console.error(`[ERROR: ${this.code}]`, {
        message: this.message,
        cause: this.cause,
      })
      const responseMessage =
        this.message ?? 'Something went wrong. Please try again later.'
      return Response.json(
        { code: this.code, summary: responseMessage },
        { status: this.status },
      )
    }

    // visibility = RESPONSE
    return Response.json(
      {
        code: this.code,
        summary: this.message,
        ...(this.metadata ? { metadata: this.metadata } : {}),
      },
      { status: this.status },
    )
  }
}

