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
        error_msg = str(e)
        # Retornar 409 para conflitos de versão
        if "Conflict:" in error_msg:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error_msg)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)
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
def promote_release(release_id: UUID, body: dict = Body(...), db = Depends(get_db), authorization: str = Header(None), idempotency_key: str = Header(None)):
    try:
        from src.infrastructure.repositories.idempotency_key_repository import IdempotencyKeyRepository
        import json
        
        target_env = body.get('targetEnv')
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        
        if not target_env:
            raise ValueError("targetEnv é obrigatório")
        
        # IDEMPOTENCY: Verificar se requisição já foi processada
        idempotency_repo = IdempotencyKeyRepository(db)
        if idempotency_key:
            existing = idempotency_repo.get_by_key(idempotency_key)
            if existing:
                # Retornar resposta anterior
                return json.loads(existing.response_body)
        
        use_case = ReleaseUseCase(db, actor_email)
        
        # Promote release (updates environment in place, not creating new)
        promoted_release = use_case.promote(release_id, target_env)
        
        response_data = {
            'releaseId': str(release_id),
            'version': promoted_release.model_dump(by_alias=True)['version'],
            'targetEnv': target_env,
            'status': promoted_release.model_dump(by_alias=True)['status']
        }
        
        response = ApiResponse.success_response(response_data, None).model_dump()
        
        # IDEMPOTENCY: Armazenar resposta
        if idempotency_key:
            idempotency_repo.create(
                key=idempotency_key,
                request_method="POST",
                request_path=f"/releases/{release_id}/promote",
                response_body=response,
                status_code="200"
            )
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{release_id}/reject", response_model=dict, summary="Rejeitar Release", description="Rejeita uma release, alterando seu status para REJECTED")
def reject_release(release_id: UUID, body: dict = Body(default={}, description="Objeto contendo 'notes' (opcional) com o motivo da rejeição"), db = Depends(get_db), authorization: str = Header(None)):
    """
    Rejeita uma release alterando seu status para REJECTED.
    
    **Parâmetros:**
    - **release_id**: UUID da release a ser rejeitada
    - **notes**: Motivo da rejeição (opcional)
    
    **Validações:**
    - Release não pode já estar com status REJECTED
    - Cria registro no audit log com ação REJECT_RELEASE
    """
    try:
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        notes = body.get('notes', 'Release rejeitada')
        
        use_case = ReleaseUseCase(db, actor_email)
        rejected_release = use_case.reject_release(release_id, notes)
        
        return ApiResponse.success_response(rejected_release.model_dump(by_alias=True), None).model_dump()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{release_id}/deploy", response_model=dict, summary="Implantar Release em Produção", description="Implanta uma release em produção, alterando seu status para DEPLOYED")
def deploy_release(release_id: UUID, body: dict = Body(default={}, description="Objeto contendo 'notes' (opcional) com observações sobre a implantação"), db = Depends(get_db), authorization: str = Header(None)):
    """
    Implanta uma release em produção alterando seu status para DEPLOYED.
    
    **Parâmetros:**
    - **release_id**: UUID da release a ser implantada
    - **notes**: Observações sobre a implantação (opcional)
    
    **Validações:**
    - Release deve estar no ambiente PROD
    - Release deve ter status APPROVED
    - Cria registro no audit log com ação DEPLOY
    """
    try:
        token_payload = extract_user_from_token(authorization)
        actor_email = token_payload.email
        notes = body.get('notes', 'Release implantada em produção')
        
        use_case = ReleaseUseCase(db, actor_email)
        deployed_release = use_case.deploy_release(release_id, notes)
        
        return ApiResponse.success_response(deployed_release.model_dump(by_alias=True), None).model_dump()
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


@router.get("/{release_id}/checklist", response_model=dict)
def get_pre_launch_checklist(release_id: UUID, authorization: str = Header(None), db = Depends(get_db)):
    """Retorna checklist de pré-lançamento para PRE_PROD → PROD"""
    try:
        from src.domain.services.policy_service import get_policy_service
        from src.infrastructure.repositories.approval_repository import ApprovalRepository
        from src.infrastructure.repositories.release_repository import ReleaseRepository
        
        token_payload = extract_user_from_token(authorization)
        
        # Carregar release
        release_repo = ReleaseRepository(db)
        release = release_repo.get_by_id(release_id)
        if not release:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Release {release_id} não encontrado")
        
        # Carregar policy
        policy_service = get_policy_service()
        min_approvals = policy_service.get_min_approvals()
        min_score = policy_service.get_min_score()
        
        # Contar aprovações
        approval_repo = ApprovalRepository(db)
        approvals = approval_repo.list_by_release(release_id)
        approved_count = len([a for a in approvals if a.outcome == 'APPROVED'])
        
        # Verificar freeze window
        is_frozen = policy_service.is_frozen_for_env('PROD')
        freeze_message = f"Janela de freeze ativa para PROD" if is_frozen else ""
        
        # Montar checklist
        approvals_ok = approved_count >= min_approvals
        evidence_ok = bool(release.evidence_url)
        score_ok = release.evidence_score >= min_score
        freeze_ok = not is_frozen
        
        checklist = {
            'approvalsOk': approvals_ok,
            'evidenceOk': evidence_ok,
            'scoreOk': score_ok,
            'freezeOk': freeze_ok,
            'ready': approvals_ok and evidence_ok and score_ok and freeze_ok,
            'approvalCount': approved_count,
            'minApprovals': min_approvals,
            'evidenceUrl': release.evidence_url or '',
            'score': release.evidence_score,
            'minScore': min_score,
            'isFrozen': is_frozen,
            'freezeMessage': freeze_message
        }
        
        return ApiResponse.success_response(checklist, None).model_dump()
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

