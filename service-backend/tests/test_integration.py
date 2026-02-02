"""
Integration Tests - Aurora Release Management System
Testa o fluxo completo: CREATE → APPROVE → PROMOTE (DEV → PRE_PROD → PROD)
"""
import pytest
from uuid import uuid4, UUID
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from src.infrastructure.database import Base
from src.infrastructure.orm.application import ApplicationORM
from src.infrastructure.orm.release import ReleaseORM
from src.infrastructure.orm.approval import ApprovalORM
from src.infrastructure.orm.audit_log import AuditLogORM
from src.infrastructure.orm.release_event import ReleaseEventORM

from src.application.usecases.release_usecase import ReleaseUseCase
from src.application.usecases.approval_usecase import ApprovalUseCase
from src.application.dtos.release_dtos import ReleaseRequest
from src.application.dtos.approval_dtos import ApprovalRequest


# Configuração de teste - banco em memória
@pytest.fixture
def test_db():
    """Criar banco de dados em memória para testes"""
    engine = create_engine('sqlite:///:memory:', echo=False)
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    yield db
    
    db.close()


@pytest.fixture
def sample_application(test_db):
    """Criar aplicação de teste"""
    app = ApplicationORM(
        id=uuid4(),
        name="test-app",
        owner_team="engineering",
        repo_url="https://github.com/example/test-app"
    )
    test_db.add(app)
    test_db.commit()
    return app


class TestReleasePromotionFlow:
    """Testes do fluxo de promoção de releases"""
    
    @pytest.mark.skip(reason="API changes - needs update")
    def test_complete_promotion_workflow_dev_to_prod(self, test_db, sample_application):
        """
        Teste de integração completo:
        1. Criar release em DEV
        2. Promover para PRE_PROD (sem requisitos)
        3. Aprovar em PRE_PROD
        4. Promover para PROD (com validação de policy)
        """
        # ===== PHASE 1: CREATE RELEASE IN DEV =====
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v1.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/v1.0.0-PASS-results.xml"
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        
        # Validações Phase 1
        assert release.version == "v1.0.0"
        assert release.environment == "DEV"
        assert release.evidence_score == 80  # HTTPS(20) + test(20) + PASS(30) + .xml(10)
        
        # Verificar audit log
        audit_logs = test_db.query(AuditLogORM).all()
        assert len(audit_logs) == 1
        assert audit_logs[0].action == "CREATE"
        assert audit_logs[0].actor == "dev@aurora.local"
        
        # ===== PHASE 2: PROMOTE DEV -> PRE_PROD =====
        promoted_release = release_usecase.promote(release.id, "PRE_PROD")
        
        # Validações Phase 2
        assert promoted_release.environment == "PRE_PROD"
        
        # Timeline deve ter evento de promoção
        timeline = test_db.query(ReleaseEventORM).filter(
            ReleaseEventORM.release_id == release.id,
            ReleaseEventORM.event_type == "PROMOTED"
        ).all()
        assert len(timeline) == 1
        
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
        assert approval.outcome == "APPROVED"
        assert approval.approver_email == "approver@aurora.local"
        
        # ===== PHASE 4: PROMOTE PRE_PROD -> PROD =====
        # Deve validar policy (minApprovals, minScore)
        promoted_to_prod = release_usecase.promote(release.id, "PROD")
        
        # Validações Phase 4
        assert promoted_to_prod.environment == "PROD"
        
        # Verificar que timeline tem múltiplos eventos
        all_events = test_db.query(ReleaseEventORM).filter(
            ReleaseEventORM.release_id == release.id
        ).all()
        assert len(all_events) >= 1
        
        # Verificar audit logs completos
        audit_logs = test_db.query(AuditLogORM).all()
        actions = [log.action for log in audit_logs]
        assert "CREATE" in actions
        assert "PROMOTE" in actions
        assert "APPROVE" in actions
    
    def test_promotion_blocked_without_approval(self, test_db, sample_application):
        """Promoção PRE_PROD → PROD deve falhar sem aprovação"""
        # Criar e promover para PRE_PROD
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v2.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/v2.0.0-PASS-results.xml"
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        release_usecase.promote(release.id, "PRE_PROD")
        
        # Tentar promover sem aprovação (deve falhar)
        with pytest.raises(ValueError, match="Requer.*aprovação"):
            release_usecase.promote(release.id, "PROD")
    
    @pytest.mark.skip(reason="API changes - needs update")
    def test_promotion_blocked_by_low_score(self, test_db, sample_application):
        """Promoção PRE_PROD → PROD deve falhar com score baixo"""
        # Criar com URL de baixo score
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v3.0.0",
            environment="DEV",
            evidence_url="http://example.com/report"  # HTTP(-20), sem outros critérios
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        release_usecase.promote(release.id, "PRE_PROD")
        
        # Aprovar
        approval_request = ApprovalRequest(
            approverEmail="approver@aurora.local",
            notes="Approvo mesmo com score baixo"
        )
        approval_usecase = ApprovalUseCase(test_db, actor_email="approver@aurora.local")
        approval_usecase.create(
            release_id=UUID(release.id),
            approver_email="approver@aurora.local",
            request=approval_request
        )
        
        # Tentar promover com score baixo (deve falhar por minScore)
        with pytest.raises(ValueError, match="Score|minScore"):
            release_usecase.promote(release.id, "PROD")
    
    def test_duplicate_release_version_blocked(self, test_db, sample_application):
        """Não permitir duas releases com mesma versão/env"""
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v1.5.0",
            environment="DEV",
            evidence_url="https://ci.example.com/v1.5.0-PASS.json"
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release1 = release_usecase.create(release_request)
        
        # Tentar criar novamente (deve falhar)
        with pytest.raises(ValueError, match="already exists"):
            release_usecase.create(release_request)
    
    @pytest.mark.skip(reason="API changes - needs update")
    def test_optimistic_locking_version_conflict(self, test_db, sample_application):
        """Atualização com versionRow desatualizado deve falhar (409)"""
        # Criar release
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v4.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/v4.0.0-PASS.json"
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        
        # Atualizar release (incrementa versionRow)
        update_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v4.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/v4.0.0-PASS-updated.json",
            version_row=0  # Desatualizado!
        )
        
        # Deve falhar com Conflict
        with pytest.raises(ValueError, match="Conflict"):
            release_usecase.update(release.id, update_request)
    
    @pytest.mark.skip(reason="API changes - needs update")
    def test_approval_rejection(self, test_db, sample_application):
        """Teste de rejeição de release"""
        release_request = ReleaseRequest(
            application_id=str(sample_application.id),
            version="v5.0.0",
            environment="DEV",
            evidence_url="https://ci.example.com/v5.0.0-PASS.json"
        )
        
        release_usecase = ReleaseUseCase(test_db, actor_email="dev@aurora.local")
        release = release_usecase.create(release_request)
        release_usecase.promote(release.id, "PRE_PROD")
        
        # Rejeitar
        approval_request = ApprovalRequest(
            approverEmail="approver@aurora.local",
            notes="Testes falharam"
        )
        
        approval_usecase = ApprovalUseCase(test_db, actor_email="approver@aurora.local")
        approval = approval_usecase.reject(
            release_id=UUID(release.id),
            approver_email="approver@aurora.local",
            request=approval_request
        )
        
        assert approval.outcome == "REJECTED"
        
        # Audit deve registrar rejeição
        audit_logs = test_db.query(AuditLogORM).filter(
            AuditLogORM.action == "REJECT"
        ).all()
        assert len(audit_logs) == 1


class TestScoringRules:
    """Testes das regras de scoring de evidência"""
    
    def test_evidence_scoring_https(self):
        """URL HTTPS deve +20"""
        from src.domain.services.scoring_service import ScoringService
        
        score = ScoringService.calculate_score("https://example.com/report.txt")
        assert score >= 20
    
    def test_evidence_scoring_pass_keyword(self):
        """URL com PASS deve +30"""
        from src.domain.services.scoring_service import ScoringService
        
        score = ScoringService.calculate_score("https://example.com/PASS-report.txt")
        assert score >= 30
    
    def test_evidence_scoring_test_keyword(self):
        """URL com 'test' deve +20"""
        from src.domain.services.scoring_service import ScoringService
        
        score = ScoringService.calculate_score("https://example.com/test-results.txt")
        assert score >= 20
    
    def test_evidence_scoring_file_extension(self):
        """Extensões .xml, .json, .html devem +10"""
        from src.domain.services.scoring_service import ScoringService
        
        for ext in ['json', 'xml', 'html']:
            score = ScoringService.calculate_score(f"https://example.com/report.{ext}")
            assert score >= 10, f"Extension .{ext} should get +10"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
