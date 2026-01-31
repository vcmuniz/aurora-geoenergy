"""
Testes unitarios das regras de promocao do ReleaseUseCase
"""
import pytest
from uuid import uuid4, UUID
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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


@pytest.fixture
def test_db():
    engine = create_engine('sqlite:///:memory:', echo=False)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    yield db
    db.close()


@pytest.fixture
def app(test_db):
    application = ApplicationORM(
        id=uuid4(), name="promo-test-app",
        owner_team="team", repo_url="https://github.com/test/app"
    )
    test_db.add(application)
    test_db.commit()
    return application


def _create_release(test_db, app, version="v1.0.0", env="DEV",
                    evidence_url="https://ci.example.com/v1.0.0-PASS-results.xml"):
    req = ReleaseRequest(
        application_id=str(app.id), version=version,
        environment=env, evidence_url=evidence_url
    )
    uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
    return uc.create(req)


def _approve_release(test_db, release_id, email="approver@test.com"):
    uc = ApprovalUseCase(test_db, actor_email=email)
    req = ApprovalRequest(
        approver_email=email,
        outcome="APPROVED",
        notes="OK"
    )
    return uc.create(
        release_id=UUID(release_id) if isinstance(release_id, str) else release_id,
        approver_email=email,
        request=req
    )


class TestPromotionDevToPreProd:
    """DEV -> PRE_PROD: sempre permitido"""

    def test_dev_to_preprod_succeeds(self, test_db, app):
        release = _create_release(test_db, app)
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        promoted = uc.promote(UUID(release.id), "PRE_PROD")
        assert promoted.environment == "PRE_PROD"

    def test_dev_to_preprod_no_approvals_needed(self, test_db, app):
        release = _create_release(test_db, app, version="v1.1.0")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        promoted = uc.promote(UUID(release.id), "PRE_PROD")
        assert promoted.environment == "PRE_PROD"

    def test_dev_to_preprod_low_score_allowed(self, test_db, app):
        release = _create_release(test_db, app, version="v1.2.0",
                                  evidence_url="http://example.com/basic")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        promoted = uc.promote(UUID(release.id), "PRE_PROD")
        assert promoted.environment == "PRE_PROD"


class TestPromotionPreProdToProd:
    """PRE_PROD -> PROD: requer approvals, score, evidence"""

    def test_full_requirements_met(self, test_db, app):
        release = _create_release(test_db, app, version="v2.0.0")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        _approve_release(test_db, release.id)
        promoted = uc.promote(UUID(release.id), "PROD")
        assert promoted.environment == "PROD"

    def test_blocked_without_approval(self, test_db, app):
        release = _create_release(test_db, app, version="v2.1.0")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        with pytest.raises(ValueError, match="[Rr]equer.*aprovação"):
            uc.promote(UUID(release.id), "PROD")

    def test_blocked_with_low_score(self, test_db, app):
        release = _create_release(test_db, app, version="v2.2.0",
                                  evidence_url="http://example.com/report")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        _approve_release(test_db, release.id)
        with pytest.raises(ValueError, match="[Ss]core"):
            uc.promote(UUID(release.id), "PROD")

    def test_blocked_without_evidence_url(self, test_db, app):
        release = _create_release(test_db, app, version="v2.3.0", evidence_url="")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        _approve_release(test_db, release.id)
        with pytest.raises(ValueError):
            uc.promote(UUID(release.id), "PROD")

    def test_blocked_by_freeze_window(self, test_db, app):
        release = _create_release(test_db, app, version="v2.4.0")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        _approve_release(test_db, release.id)
        with patch('src.domain.services.policy_service.PolicyService.is_frozen_for_env', return_value=True):
            with pytest.raises(ValueError, match="[Cc]ongelado|[Ff]reeze"):
                uc.promote(UUID(release.id), "PROD")


class TestPromotionAuditTrail:
    """Promocoes devem gerar audit logs e timeline events"""

    def test_promote_creates_audit_log(self, test_db, app):
        release = _create_release(test_db, app, version="v3.0.0")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        logs = test_db.query(AuditLogORM).filter(AuditLogORM.action == "PROMOTE").all()
        assert len(logs) == 1
        assert logs[0].actor == "dev@test.com"

    def test_promote_creates_timeline_event(self, test_db, app):
        release = _create_release(test_db, app, version="v3.1.0")
        uc = ReleaseUseCase(test_db, actor_email="dev@test.com")
        uc.promote(UUID(release.id), "PRE_PROD")
        events = test_db.query(ReleaseEventORM).filter(
            ReleaseEventORM.release_id == UUID(release.id),
            ReleaseEventORM.event_type == "PROMOTED"
        ).all()
        assert len(events) == 1
