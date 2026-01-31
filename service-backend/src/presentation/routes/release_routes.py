from fastapi import APIRouter, Depends, HTTPException, status, Body, Query, Header
from uuid import UUID
from src.infrastructure.database import get_db
from src.application.usecases.release_usecase import ReleaseUseCase
from src.application.usecases.release_event_usecase import ReleaseEventUseCase
from src.application.dtos.release_dtos import ReleaseRequest, ReleaseResponse
from src.application.dtos.api_response import ApiResponse
from src.core.auth import extract_user_from_token
from src.domain.services.scoring_service import ScoringService

router = APIRouter(prefix="/releases", tags=["Releases"])


@router.post("", response_model=dict)
def create_release(request: ReleaseRequest, db = Depends(get_db), authorization: str = Header(None)):
    try:
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
        result = use_case.create(request)
        return ApiResponse.success_response(result.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=dict)
def list_all_releases(skip: int = Query(0), limit: int = Query(100), authorization: str = Header(None), db = Depends(get_db)):
    try:
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
        
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
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


@router.get("/{release_id}", response_model=dict)
def get_release(release_id: UUID, authorization: str = Header(None), db = Depends(get_db)):
    try:
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
        
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
        result = use_case.get_by_id(release_id)
        return ApiResponse.success_response(result.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/application/{app_id}", response_model=dict)
def list_releases_by_application(app_id: UUID, skip: int = Query(0), limit: int = Query(100), authorization: str = Header(None), db = Depends(get_db)):
    try:
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
        
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
        result = use_case.list_by_application(app_id, skip, limit)
        response_data = {
            'data': [r.model_dump(by_alias=True) for r in result.data],
            'total': result.total,
            'skip': result.skip,
            'limit': result.limit
        }
        return ApiResponse.success_response(response_data, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{release_id}", response_model=dict)
def update_release(release_id: UUID, request: ReleaseRequest, db = Depends(get_db), authorization: str = Header(None)):
    try:
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
        result = use_case.update(release_id, request)
        return ApiResponse.success_response(result.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{release_id}/status", response_model=dict)
def update_release_status(release_id: UUID, status: str, authorization: str = Header(None), db = Depends(get_db)):
    try:
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
        
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
        result = use_case.update_status(release_id, status)
        return ApiResponse.success_response(result.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{release_id}", response_model=dict)
def delete_release(release_id: UUID, authorization: str = Header(None), db = Depends(get_db)):
    try:
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
        
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        use_case = ReleaseUseCase(db, actor_email)
        use_case.delete(release_id)
        return ApiResponse.success_response({"deleted": True}, None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{release_id}/timeline", response_model=dict)
def get_release_timeline(release_id: UUID, authorization: str = Header(None), db = Depends(get_db)):
    try:
        if not authorization:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
        
        use_case = ReleaseEventUseCase(db)
        events = use_case.get_timeline(release_id)
        dtos = [e.model_dump(by_alias=True) for e in events]
        return ApiResponse.success_response(dtos, None).model_dump()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{release_id}/promote", response_model=dict)
def promote_release(release_id: UUID, body: dict = Body(...), db = Depends(get_db), authorization: str = Header(None)):
    try:
        target_env = body.get('targetEnv')
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        
        if not target_env:
            raise ValueError("targetEnv é obrigatório")
        
        use_case = ReleaseUseCase(db, actor_email)
        
        # Promote release (updates environment in place, not creating new)
        promoted_release = use_case.promote(release_id, target_env)
        
        return ApiResponse.success_response({
            'releaseId': str(release_id),
            'version': promoted_release.model_dump(by_alias=True)['version'],
            'targetEnv': target_env,
            'status': 'PENDING'
        }, None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/calculate-score", response_model=dict)
def calculate_evidence_score(body: dict = Body(...)):
    """Calcula score determinístico para uma evidence URL"""
    try:
        evidence_url = body.get('evidenceUrl')
        if not evidence_url:
            raise ValueError("evidenceUrl é obrigatória")
        
        score = ScoringService.calculate_score(evidence_url)
        return ApiResponse.success_response({
            'evidenceUrl': evidence_url,
            'score': score
        }, None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

