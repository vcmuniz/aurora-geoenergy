from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from src.infrastructure.database import get_db
from src.application.usecases.approval_usecase import ApprovalUseCase
from src.application.dtos.approval_dtos import ApprovalRequest, ApprovalResponse
from src.application.dtos.api_response import ApiResponse

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("", response_model=dict)
def list_approvals(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    try:
        use_case = ApprovalUseCase(db)
        results = use_case.list_all(skip, limit)
        dtos = [r.model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{release_id}", response_model=dict)
def create_approval(release_id: UUID, approver_email: str, request: ApprovalRequest, db = Depends(get_db)):
    try:
        use_case = ApprovalUseCase(db)
        result = use_case.create(release_id, approver_email, request)
        return ApiResponse.success_response(result.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{approval_id}", response_model=dict)
def get_approval(approval_id: UUID, db = Depends(get_db)):
    try:
        use_case = ApprovalUseCase(db)
        result = use_case.get_by_id(approval_id)
        return ApiResponse.success_response(result.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/release/{release_id}", response_model=dict)
def list_approvals_by_release(release_id: UUID, db = Depends(get_db)):
    try:
        use_case = ApprovalUseCase(db)
        results = use_case.list_by_release(release_id)
        dtos = [r.model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/approver/{approver_email}", response_model=dict)
def list_pending_by_approver(approver_email: str, db = Depends(get_db)):
    try:
        use_case = ApprovalUseCase(db)
        results = use_case.list_pending_by_approver(approver_email)
        dtos = [r.model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
