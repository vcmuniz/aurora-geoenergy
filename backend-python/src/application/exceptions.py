from typing import Optional


class ApplicationException(Exception):
    """Exceção base para erros de aplicação"""
    
    def __init__(
        self, 
        error_code: str, 
        message: str, 
        status_code: int = 400,
        details: Optional[dict] = None
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(ApplicationException):
    """Levantada quando email ou senha é inválido"""
    
    def __init__(self, message: str = "Email ou senha incorretos"):
        super().__init__(
            error_code="AUTH_INVALID_CREDENTIALS",
            message=message,
            status_code=401
        )


class UserNotFoundError(ApplicationException):
    """Levantada quando usuário não é encontrado"""
    
    def __init__(self, message: str = "Usuário não encontrado"):
        super().__init__(
            error_code="USER_NOT_FOUND",
            message=message,
            status_code=404
        )


class UserInactiveError(ApplicationException):
    """Levantada quando usuário está inativo"""
    
    def __init__(self, message: str = "Usuário inativo"):
        super().__init__(
            error_code="USER_INACTIVE",
            message=message,
            status_code=403
        )


class ValidationError(ApplicationException):
    """Levantada quando há erro de validação"""
    
    def __init__(self, message: str = "Erro de validação", details: Optional[dict] = None):
        super().__init__(
            error_code="VALIDATION_ERROR",
            message=message,
            status_code=400,
            details=details
        )
