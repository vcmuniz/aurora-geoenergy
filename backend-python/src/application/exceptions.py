class AuthenticationError(Exception):
    """Levantada quando email ou senha é inválido"""
    pass


class UserNotFoundError(Exception):
    """Levantada quando usuário não é encontrado"""
    pass


class UserInactiveError(Exception):
    """Levantada quando usuário está inativo"""
    pass
