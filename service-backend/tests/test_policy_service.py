"""
Testes unitarios do PolicyService
Cobre: defaults, load YAML, reload, freeze windows, validate_promotion
"""
import pytest
from unittest.mock import patch, mock_open, MagicMock
from datetime import datetime
from src.domain.services.policy_service import PolicyService, FreezeWindow


class TestFreezeWindow:
    """Testes da classe FreezeWindow"""

    def test_frozen_within_normal_window(self):
        """Dentro da janela (start < end) deve retornar True"""
        window = FreezeWindow(env="PROD", start="22:00", end="23:59", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "22:30"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is True

    def test_not_frozen_outside_normal_window(self):
        """Fora da janela (start < end) deve retornar False"""
        window = FreezeWindow(env="PROD", start="22:00", end="23:59", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "10:00"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is False

    def test_frozen_wraps_midnight_before(self):
        """Janela que cruza meia-noite (start > end), horario >= start"""
        window = FreezeWindow(env="PROD", start="23:00", end="01:00", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "23:30"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is True

    def test_frozen_wraps_midnight_after(self):
        """Janela que cruza meia-noite (start > end), horario <= end"""
        window = FreezeWindow(env="PROD", start="23:00", end="01:00", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "00:30"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is True

    def test_not_frozen_wraps_midnight_outside(self):
        """Janela que cruza meia-noite, horario fora"""
        window = FreezeWindow(env="PROD", start="23:00", end="01:00", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "15:00"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is False

    def test_frozen_at_exact_start(self):
        """Exatamente no horario de inicio deve estar congelado"""
        window = FreezeWindow(env="PROD", start="22:00", end="23:59", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "22:00"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is True

    def test_frozen_at_exact_end(self):
        """Exatamente no horario de fim deve estar congelado"""
        window = FreezeWindow(env="PROD", start="22:00", end="23:59", tz="America/Sao_Paulo")
        mock_now = MagicMock()
        mock_now.strftime.return_value = "23:59"
        with patch('src.domain.services.policy_service.datetime') as mock_dt:
            mock_dt.now.return_value = mock_now
            assert window.is_frozen_now() is True

    def test_repr(self):
        """Teste do __repr__"""
        window = FreezeWindow(env="PROD", start="22:00", end="23:59", tz="America/Sao_Paulo")
        assert "PROD" in repr(window)
        assert "22:00" in repr(window)
        assert "23:59" in repr(window)


class TestPolicyServiceDefaults:
    """Testes dos valores padrao quando policy.yaml nao existe"""

    def test_default_min_approvals(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert service.get_min_approvals() == 1

    def test_default_min_score(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert service.get_min_score() == 70

    def test_default_freeze_windows_count(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert len(service.freeze_windows) == 1

    def test_default_freeze_window_is_prod(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert service.freeze_windows[0].env == "PROD"

    def test_default_freeze_window_times(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert service.freeze_windows[0].start == "22:00"
        assert service.freeze_windows[0].end == "23:59"

    def test_default_timezone(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert service.global_timezone == "America/Sao_Paulo"


class TestPolicyServiceLoadYaml:
    """Testes de carregamento do arquivo YAML"""

    def test_load_custom_values(self):
        yaml_content = "minApprovals: 3\nminScore: 85\nfreezeWindows:\n  - env: PROD\n    start: '20:00'\n    end: '06:00'\n    timezone: UTC\ntimezone: UTC\n"
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data=yaml_content)):
                service = PolicyService()
        assert service.get_min_approvals() == 3
        assert service.get_min_score() == 85

    def test_load_custom_freeze_window(self):
        yaml_content = "minApprovals: 1\nminScore: 70\nfreezeWindows:\n  - env: PROD\n    start: '20:00'\n    end: '06:00'\n    timezone: UTC\ntimezone: UTC\n"
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data=yaml_content)):
                service = PolicyService()
        assert service.freeze_windows[0].start == "20:00"
        assert service.freeze_windows[0].end == "06:00"

    def test_empty_yaml_uses_defaults(self):
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data="")):
                service = PolicyService()
        assert service.get_min_approvals() == 1
        assert service.get_min_score() == 70

    def test_corrupted_yaml_uses_defaults(self):
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', side_effect=Exception("read error")):
                service = PolicyService()
        assert service.get_min_approvals() == 1

    def test_load_multiple_freeze_windows(self):
        yaml_content = (
            "minApprovals: 1\nminScore: 70\n"
            "freezeWindows:\n"
            "  - env: PROD\n    start: '22:00'\n    end: '23:59'\n    timezone: UTC\n"
            "  - env: PRE_PROD\n    start: '20:00'\n    end: '21:00'\n    timezone: UTC\n"
            "timezone: UTC\n"
        )
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data=yaml_content)):
                service = PolicyService()
        assert len(service.freeze_windows) == 2
        assert service.freeze_windows[0].env == "PROD"
        assert service.freeze_windows[1].env == "PRE_PROD"

    def test_freeze_windows_not_list_uses_empty(self):
        yaml_content = "minApprovals: 1\nminScore: 70\nfreezeWindows: invalid\ntimezone: UTC\n"
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data=yaml_content)):
                service = PolicyService()
        assert len(service.freeze_windows) == 0


class TestPolicyServiceReload:
    """Testes do reload"""

    def test_reload_updates_values(self):
        with patch('os.path.exists', return_value=False):
            service = PolicyService()
        assert service.get_min_approvals() == 1

        yaml_content = "minApprovals: 5\nminScore: 90\nfreezeWindows: []\n"
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data=yaml_content)):
                service.reload_policy()
        assert service.get_min_approvals() == 5
        assert service.get_min_score() == 90
        assert len(service.freeze_windows) == 0

    def test_reload_restores_defaults_when_file_removed(self):
        yaml_content = "minApprovals: 5\nminScore: 90\nfreezeWindows: []\n"
        with patch('os.path.exists', return_value=True):
            with patch('builtins.open', mock_open(read_data=yaml_content)):
                service = PolicyService()
        assert service.get_min_approvals() == 5

        with patch('os.path.exists', return_value=False):
            service.reload_policy()
        assert service.get_min_approvals() == 1
        assert service.get_min_score() == 70


class TestValidatePromotion:
    """Testes da validacao de promocao"""

    @pytest.fixture
    def policy(self):
        with patch('os.path.exists', return_value=False):
            svc = PolicyService()
        # Garante que freeze window nao interfere nos testes de validacao
        with patch.object(svc, 'is_frozen_for_env', return_value=False):
            yield svc

    def test_dev_to_preprod_always_allowed(self, policy):
        is_valid, msg = policy.validate_promotion("DEV", "PRE_PROD")
        assert is_valid is True

    def test_preprod_to_prod_all_requirements_met(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=1,
            evidence_score=80, evidence_url="https://ci.example.com/report.pdf"
        )
        assert is_valid is True

    def test_preprod_to_prod_missing_approvals(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=0,
            evidence_score=80, evidence_url="https://ci.example.com/report.pdf"
        )
        assert is_valid is False
        assert "aprovação" in msg.lower()

    def test_preprod_to_prod_low_score(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=1,
            evidence_score=50, evidence_url="https://ci.example.com/report.pdf"
        )
        assert is_valid is False
        assert "score" in msg.lower()

    def test_preprod_to_prod_missing_evidence_url(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=1,
            evidence_score=80, evidence_url=None
        )
        assert is_valid is False
        assert "evidence" in msg.lower()

    def test_preprod_to_prod_empty_evidence_url(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=1,
            evidence_score=80, evidence_url="   "
        )
        assert is_valid is False

    def test_preprod_to_prod_score_at_minimum(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=1,
            evidence_score=70, evidence_url="https://ci.example.com/report.pdf"
        )
        assert is_valid is True

    def test_preprod_to_prod_score_one_below_minimum(self, policy):
        is_valid, msg = policy.validate_promotion(
            "PRE_PROD", "PROD", approval_count=1,
            evidence_score=69, evidence_url="https://ci.example.com/report.pdf"
        )
        assert is_valid is False

    def test_freeze_window_blocks_promotion(self):
        with patch('os.path.exists', return_value=False):
            svc = PolicyService()
        with patch.object(svc, 'is_frozen_for_env', return_value=True):
            is_valid, msg = svc.validate_promotion(
                "PRE_PROD", "PROD", approval_count=1,
                evidence_score=80, evidence_url="https://ci.example.com/report.pdf"
            )
        assert is_valid is False
        assert "congelado" in msg.lower()

    def test_freeze_window_not_active_allows(self):
        with patch('os.path.exists', return_value=False):
            svc = PolicyService()
        with patch.object(svc, 'is_frozen_for_env', return_value=False):
            is_valid, msg = svc.validate_promotion(
                "PRE_PROD", "PROD", approval_count=1,
                evidence_score=80, evidence_url="https://ci.example.com/report.pdf"
            )
        assert is_valid is True

    def test_unknown_transition_allowed(self, policy):
        is_valid, msg = policy.validate_promotion("STAGING", "QA")
        assert is_valid is True

    def test_is_frozen_for_env_no_window(self):
        """Ambiente sem freeze window nao esta congelado"""
        with patch('os.path.exists', return_value=False):
            svc = PolicyService()
        result = svc.is_frozen_for_env("DEV")
        assert result is False

    def test_dev_to_preprod_with_defaults(self, policy):
        """DEV para PRE_PROD nao precisa de aprovacoes nem score"""
        is_valid, msg = policy.validate_promotion(
            "DEV", "PRE_PROD", approval_count=0,
            evidence_score=0, evidence_url=None
        )
        assert is_valid is True

    def test_freeze_blocks_dev_to_preprod_too(self):
        """Freeze window bloqueia qualquer promocao para o ambiente"""
        with patch('os.path.exists', return_value=False):
            svc = PolicyService()
        with patch.object(svc, 'is_frozen_for_env', return_value=True):
            is_valid, msg = svc.validate_promotion("DEV", "PRE_PROD")
        assert is_valid is False
        assert "congelado" in msg.lower()
