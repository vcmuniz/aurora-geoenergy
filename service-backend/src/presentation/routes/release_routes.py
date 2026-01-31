from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from src.infrastructure.database import get_db
from src.application.usecases.release_usecase import ReleaseUseCase
from src.application.dtos.release_dtos import ReleaseRequest, ReleaseResponse
from src.application.dtos.api_response import ApiResponse

router = APIRouter(prefix="/releases", tags=["Releases"])


@router.post("", response_model=dict)
def create_release(request: ReleaseRequest, db = Depends(get_db)):
    try:
        use_case = ReleaseUseCase(db)
        result = use_case.create(request)
        dto = ReleaseResponse.from_orm(result)
        return ApiResponse.success_response(dto.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{release_id}", response_model=dict)
def get_release(release_id: UUID, db = Depends(get_db)):
    try:
        use_case = ReleaseUseCase(db)
        result = use_case.get_by_id(release_id)
        dto = ReleaseResponse.from_orm(result)
        return ApiResponse.success_response(dto.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/application/{app_id}", response_model=dict)
def list_releases_by_application(app_id: UUID, skip: int = 0, limit: int = 100, db = Depends(get_db)):
    try:
        use_case = ReleaseUseCase(db)
        results = use_case.list_by_application(app_id, skip, limit)
        dtos = [ReleaseResponse.from_orm(r).model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{release_id}/status", response_model=dict)
def update_release_status(release_id: UUID, status: str, db = Depends(get_db)):
    try:
        use_case = ReleaseUseCase(db)
        result = use_case.update_status(release_id, status)
        dto = ReleaseResponse.from_orm(result)
        return ApiResponse.success_response(dto.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{release_id}", response_model=dict)
def delete_release(release_id: UUID, db = Depends(get_db)):
    try:
        use_case = ReleaseUseCase(db)
        use_case.delete(release_id)
        return ApiResponse.success_response({"deleted": True}, None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
