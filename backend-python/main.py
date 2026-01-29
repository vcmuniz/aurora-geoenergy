from fastapi import FastAPI

app = FastAPI(
    title="Aurora Release Management API",
    description="API para gerenciamento de releases com policies configuráveis",
    version="1.0.0"
)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "OK",
        "service": "Aurora Release Management API",
        "version": app.version
    }
