export class DomainException extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class AuthenticationException extends DomainException {
  constructor(message: string = 'Authentication failed') {
    super('AUTH_FAILED', message, 401);
    this.name = 'AuthenticationException';
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends DomainException {
  constructor(message: string = 'Not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundException';
  }
}

export class ValidationException extends DomainException {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationException';
  }
}

export class BackendException extends DomainException {
  constructor(message: string = 'Backend service unavailable') {
    super('BACKEND_UNAVAILABLE', message, 502);
    this.name = 'BackendException';
  }
}
