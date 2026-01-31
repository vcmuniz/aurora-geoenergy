from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from src.infrastructure.database import get_db
from src.application.usecases.audit_log_usecase import AuditLogUseCase
from src.application.dtos.api_response import ApiResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=dict)
def list_audit_logs(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    try:
        use_case = AuditLogUseCase(db)
        results = use_case.list_all(skip, limit)
        dtos = [r.model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/entity/{entity_type}/{entity_id}", response_model=dict)
def list_audit_logs_by_entity(entity_type: str, entity_id: UUID, skip: int = 0, limit: int = 100, db = Depends(get_db)):
    try:
        use_case = AuditLogUseCase(db)
        results = use_case.list_by_entity(entity_type, entity_id, skip, limit)
        dtos = [r.model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/actor/{actor_email}", response_model=dict)
def list_audit_logs_by_actor(actor_email: str, skip: int = 0, limit: int = 100, db = Depends(get_db)):
    try:
        use_case = AuditLogUseCase(db)
        results = use_case.list_by_actor(actor_email, skip, limit)
        dtos = [r.model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
