from fastapi import FastAPI
from src.presentation.middleware.exception_handler import setup_exception_handlers
from src.presentation.middleware.request_id_middleware import request_id_middleware
from src.presentation.controllers.auth_controller import router as auth_router

app = FastAPI(
    title="Aurora Release Management API",
    description="API para gerenciamento de releases com policies configuráveis",
    version="1.0.0"
)

# Registrar middleware
app.middleware("http")(request_id_middleware)

setup_exception_handlers(app)

# Registrar routers
app.include_router(auth_router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "OK",
        "service": "Aurora Release Management API",
        "version": app.version
    }
