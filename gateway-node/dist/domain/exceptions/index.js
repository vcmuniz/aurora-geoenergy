"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendException = exports.ValidationException = exports.NotFoundException = exports.ForbiddenException = exports.UnauthorizedException = exports.AuthenticationException = exports.DomainException = void 0;
class DomainException extends Error {
    constructor(code, message, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'DomainException';
    }
}
exports.DomainException = DomainException;
class AuthenticationException extends DomainException {
    constructor(message = 'Authentication failed') {
        super('AUTH_FAILED', message, 401);
        this.name = 'AuthenticationException';
    }
}
exports.AuthenticationException = AuthenticationException;
class UnauthorizedException extends DomainException {
    constructor(message = 'Unauthorized') {
        super('UNAUTHORIZED', message, 401);
        this.name = 'UnauthorizedException';
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends DomainException {
    constructor(message = 'Forbidden') {
        super('FORBIDDEN', message, 403);
        this.name = 'ForbiddenException';
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends DomainException {
    constructor(message = 'Not found') {
        super('NOT_FOUND', message, 404);
        this.name = 'NotFoundException';
    }
}
exports.NotFoundException = NotFoundException;
class ValidationException extends DomainException {
    constructor(message = 'Validation failed', details) {
        super('VALIDATION_ERROR', message, 400, details);
        this.name = 'ValidationException';
    }
}
exports.ValidationException = ValidationException;
class BackendException extends DomainException {
    constructor(message = 'Backend service unavailable') {
        super('BACKEND_UNAVAILABLE', message, 502);
        this.name = 'BackendException';
    }
}
exports.BackendException = BackendException;
