from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserData(BaseModel):
    id: str
    email: str
    name: str
    role: str


class LoginData(BaseModel):
    access_token: str
    token_type: str
    user: UserData
