from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID
from src.infrastructure.database import get_db
from src.application.usecases.audit_log_usecase import AuditLogUseCase
from src.application.dtos.api_response import ApiResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=dict)
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    db = Depends(get_db)
):
    try:
        use_case = AuditLogUseCase(db)
        result = use_case.list_all(skip, limit)
        response_data = {
            'data': [r.model_dump(by_alias=True) for r in result.data],
            'total': result.total,
            'skip': result.skip,
            'limit': result.limit
        }
        return ApiResponse.success_response(response_data, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/entity/{entity_type}/{entity_id}", response_model=dict)
def list_audit_logs_by_entity(entity_type: str, entity_id: UUID, skip: int = Query(0), limit: int = Query(100), db = Depends(get_db)):
    try:
        use_case = AuditLogUseCase(db)
        result = use_case.list_by_entity(entity_type, entity_id, skip, limit)
        response_data = {
            'data': [r.model_dump(by_alias=True) for r in result.data],
            'total': result.total,
            'skip': result.skip,
            'limit': result.limit
        }
        return ApiResponse.success_response(response_data, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/actor/{actor_email}", response_model=dict)
def list_audit_logs_by_actor(actor_email: str, skip: int = Query(0), limit: int = Query(100), db = Depends(get_db)):
    try:
        use_case = AuditLogUseCase(db)
        result = use_case.list_by_actor(actor_email, skip, limit)
        response_data = {
            'data': [r.model_dump(by_alias=True) for r in result.data],
            'total': result.total,
            'skip': result.skip,
            'limit': result.limit
        }
        return ApiResponse.success_response(response_data, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
