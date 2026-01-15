type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'internal'
  | 'validation'
  | 'offline'

type ErrorSurface =
  | 'api'
  | 'auth'
  | 'chat'
  | 'database'
  | 'payment'
  | 'upload'
  | 'api_key'
  | 'stream'

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly surface: ErrorSurface
  public readonly code: string
  public readonly status: number
  public readonly summary: string

  constructor(type: ErrorType, surface: ErrorSurface, summary: string) {
    super(summary)
    this.type = type
    this.surface = surface
    this.code = `${type}:${surface}`
    this.status = AppError.mapStatus(type)
    this.summary = summary
    Object.setPrototypeOf(this, new.target.prototype)
  }

  private static mapStatus(type: ErrorType): number {
    switch (type) {
      case 'bad_request':
        return 400
      case 'unauthorized':
        return 401
      case 'forbidden':
        return 403
      case 'not_found':
        return 404
      case 'rate_limit':
        return 429
      case 'internal':
        return 500
      case 'validation':
        return 400
      default:
        return 500
    }
  }

  toResponse() {
    return Response.json(
      {
        code: this.code,
        summary: this.summary,
      },
      { status: this.status },
    )
  }
}

export class ChatSDKError extends Error {
  type: ErrorType
  surface: ErrorSurface
  statusCode: number
  summary?: string

  constructor(type: ErrorType, surface: ErrorSurface, summary?: string) {
    super()
    this.type = type
    this.surface = surface
    this.summary = summary
    this.message = summary || 'Something went wrong. Please try again later.'
    this.statusCode = ChatSDKError.mapStatus(type)
  }

  private static mapStatus(type: ErrorType): number {
    switch (type) {
      case 'bad_request':
        return 400
      case 'unauthorized':
        return 401
      case 'forbidden':
        return 403
      case 'not_found':
        return 404
      case 'rate_limit':
        return 429
      case 'offline':
        return 503
      default:
        return 500
    }
  }

  toResponse() {
    return Response.json(
      { code: `${this.type}:${this.surface}`, message: this.message },
      { status: this.statusCode },
    )
  }
}
