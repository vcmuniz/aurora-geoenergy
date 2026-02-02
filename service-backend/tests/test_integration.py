"""
Teste de Integração E2E - Requisito do Desafio (Item 8)
Cobre: criar → aprovar → promover PRE_PROD→PROD (incluindo bloqueio por policy)
"""
import pytest
from uuid import uuid4, UUID

from src.infrastructure.orm.application import ApplicationORM
from src.infrastructure.orm.audit_log import AuditLogORM

from src.application.usecases.release_usecase import ReleaseUseCase
from src.application.usecases.approval_usecase import ApprovalUseCase
from src.application.dtos.release_dtos import ReleaseRequest
from src.application.dtos.approval_dtos import ApprovalRequest


@pytest.fixture
def sample_application(test_db):
    """Criar aplicação de teste"""
    app = ApplicationORM(
        id=uuid4(),
        name="test-app-e2e",
        owner_team="engineering",
        repo_url="https://github.com/example/test-app"
    )
    test_db.add(app)
    test_db.commit()
    return app


class TestIntegrationE2E:
    """Teste de integração E2E conforme Item 8 do desafio"""
    
    def test_complete_release_workflow_with_policy_validation(self, test_db, sample_application):
        """
        Teste E2E completo conforme Item 8 do desafio:
        1. Criar release em DEV com evidence_url
        2. Promover DEV → PRE_PROD (sem requisitos)
        3. Aprovar release em PRE_PROD (minApprovals)
        4. Promover PRE_PROD → PROD (validando policy: score >= 70, approvals >= 1)
        
        Este teste cobre o fluxo completo incluindo validações de policy.
        """
        # ===== PHASE 1: CREATE RELEASE IN DEV =====
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v1.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/test-PASS-report.json"  # Score alto (>=70)
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        
        # Validações Phase 1
        assert release.version == "v1.0.0"
        assert release.environment == "DEV"
        assert release.evidence_score >= 70  # Score suficiente para PROD
        
        # ===== PHASE 2: PROMOTE DEV -> PRE_PROD =====
        promoted_release = release_usecase.promote(release.id, "PRE_PROD")
        
        # Validações Phase 2
        assert promoted_release.environment == "PRE_PROD"
        
        # ===== PHASE 3: APPROVE IN PRE_PROD =====
        approval_request = ApprovalRequest(
            approverEmail="approver@aurora.local",
            notes="Release aprovado para PROD"
        )
        
        approval_usecase = ApprovalUseCase(test_db, actor_email="approver@aurora.local")
        approval = approval_usecase.create(
            release_id=UUID(release.id),
            approver_email="approver@aurora.local",
            request=approval_request
        )
        
        # Validações Phase 3
        assert approval.approver_email == "approver@aurora.local"
        test_db.commit()  # Garantir persistência
        
        # ===== PHASE 4: PROMOTE PRE_PROD -> PROD (VALIDAÇÕES DE POLICY) =====
        # Policy valida: minApprovals (OK=1), minScore (OK>=70), freezeWindow (OK fora do horário)
        final_release = release_usecase.promote(release.id, "PROD")
        
        # Validações Phase 4
        assert final_release.environment == "PROD"
        
        # Verificar audit logs foram criados
        audit_logs = test_db.query(AuditLogORM).all()
        assert len(audit_logs) >= 2  # CREATE + PROMOTE
        
        actions = [log.action for log in audit_logs]
        assert "CREATE" in actions
        assert "PROMOTE" in actions

        """
        Teste E2E completo conforme Item 8:
        1. Criar release em DEV com evidence_url
        2. Promover DEV → PRE_PROD
        3. Aprovar release (minApprovals)
        4. Promover PRE_PROD → PROD (valida policy: score, approvals, freeze window)
        5. Validar bloqueio por score baixo
        """
        # ===== PHASE 1: CREATE RELEASE IN DEV =====
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v1.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/test-PASS-report.json"  # Score alto
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        
        # Validações Phase 1
        assert release.version == "v1.0.0"
        assert release.environment == "DEV"
        assert release.evidence_score >= 70  # Score suficiente para PROD
        
        # ===== PHASE 2: PROMOTE DEV -> PRE_PROD =====
        promoted_release = release_usecase.promote(release.id, "PRE_PROD")
        
        # Validações Phase 2
        assert promoted_release.environment == "PRE_PROD"
        
        # ===== PHASE 3: APPROVE IN PRE_PROD =====
        approval_request = ApprovalRequest(
            approverEmail="approver@aurora.local",
            notes="Testes de integração passaram"
        )
        
        approval_usecase = ApprovalUseCase(test_db, actor_email="approver@aurora.local")
        approval = approval_usecase.create(
            release_id=UUID(release.id),
            approver_email="approver@aurora.local",
            request=approval_request
        )
        
        # Validações Phase 3
        assert approval.approver_email == "approver@aurora.local"
        test_db.commit()  # Commit approval antes de promover
        
        # ===== PHASE 4: PROMOTE PRE_PROD -> PROD (COM VALIDAÇÕES DE POLICY) =====
        final_release = release_usecase.promote(release.id, "PROD")
        
        # Validações Phase 4 - Policy validations OK
        assert final_release.environment == "PROD"
        
        # Verificar audit logs
        audit_logs = test_db.query(AuditLogORM).all()
        assert len(audit_logs) >= 2  # CREATE + PROMOTE
        
        # ===== PHASE 5: VALIDAR BLOQUEIO POR SCORE BAIXO =====
        # Criar release com score baixo
        low_score_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v2.0.0",
            environment="DEV",
            evidence_url="http://example.com/report"  # Score = 30 (< 70)
        )
        
        low_score_release = release_usecase.create(low_score_request)
        test_db.refresh(low_score_release)
        assert low_score_release.evidence_score < 70  # Score insuficiente
        
        # Promover para PRE_PROD
        promoted = release_usecase.promote(low_score_release.id, "PRE_PROD")
        test_db.commit()
        
        # Aprovar (passa minApprovals mas falha por score)
        approval = approval_usecase.create(
            release_id=UUID(low_score_release.id),
            approver_email="approver@aurora.local",
            request=ApprovalRequest(
                approverEmail="approver@aurora.local",
                notes="Aprovado"
            )
        )
        test_db.commit()  # Commit para persistir approval
        test_db.refresh(low_score_release)
        
        # Tentar promover para PROD
        # DEVE FALHAR: tem 1 aprovação (OK) mas score=30 < minScore=70
        with pytest.raises(ValueError):
            release_usecase.promote(low_score_release.id, "PROD")
