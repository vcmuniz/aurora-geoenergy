from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from src.infrastructure.database import get_db
from src.application.usecases.application_usecase import ApplicationUseCase
from src.application.dtos.application_dtos import ApplicationRequest, ApplicationResponse
from src.application.dtos.api_response import ApiResponse

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=dict)
def create_application(request: ApplicationRequest, db = Depends(get_db)):
    try:
        use_case = ApplicationUseCase(db)
        result = use_case.create(request)
        dto = ApplicationResponse.from_orm(result)
        return ApiResponse.success_response(dto.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{app_id}", response_model=dict)
def get_application(app_id: UUID, db = Depends(get_db)):
    try:
        use_case = ApplicationUseCase(db)
        result = use_case.get_by_id(app_id)
        dto = ApplicationResponse.from_orm(result)
        return ApiResponse.success_response(dto.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=dict)
def list_applications(skip: int = 0, limit: int = 100, db = Depends(get_db)):
    try:
        use_case = ApplicationUseCase(db)
        results = use_case.list_all(skip, limit)
        dtos = [ApplicationResponse.from_orm(r).model_dump(by_alias=True) for r in results]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{app_id}", response_model=dict)
def update_application(app_id: UUID, request: ApplicationRequest, db = Depends(get_db)):
    try:
        use_case = ApplicationUseCase(db)
        result = use_case.update(app_id, request)
        dto = ApplicationResponse.from_orm(result)
        return ApiResponse.success_response(dto.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{app_id}", response_model=dict)
def delete_application(app_id: UUID, db = Depends(get_db)):
    try:
        use_case = ApplicationUseCase(db)
        use_case.delete(app_id)
        return ApiResponse.success_response({"deleted": True}, None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
