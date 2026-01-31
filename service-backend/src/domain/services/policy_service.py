import yaml
import os
from datetime import datetime
from pytz import timezone as pytz_timezone
from typing import Optional, Dict, List


class FreezeWindow:
    """Representa uma janela de congelamento"""
    def __init__(self, env: str, start: str, end: str, tz: str):
        self.env = env
        self.start = start  # HH:MM
        self.end = end      # HH:MM
        self.timezone_name = tz

    def is_frozen_now(self) -> bool:
        """Verifica se está dentro da janela de congelamento agora"""
        tz = pytz_timezone(self.timezone_name)
        now = datetime.now(tz)
        current_time = now.strftime("%H:%M")
        
        if self.start < self.end:
            return self.start <= current_time <= self.end
        else:
            return current_time >= self.start or current_time <= self.end

    def __repr__(self):
        return f"FreezeWindow({self.env} {self.start}-{self.end} {self.timezone_name})"


class PolicyService:
    """Service de domínio: Carrega e valida policy.yaml em runtime"""
    
    POLICY_FILE = "policy.yaml"
    
    DEFAULT_POLICY = {
        "minApprovals": 1,
        "minScore": 70,
        "freezeWindows": [
            {
                "env": "PROD",
                "start": "22:00",
                "end": "23:59",
                "timezone": "America/Sao_Paulo"
            }
        ],
        "timezone": "America/Sao_Paulo"
    }

    def __init__(self):
        self.policy = self._load_policy()
        self.min_approvals = self.policy.get("minApprovals", 1)
        self.min_score = self.policy.get("minScore", 70)
        self.global_timezone = self.policy.get("timezone", "America/Sao_Paulo")
        self.freeze_windows = self._parse_freeze_windows()

    def _load_policy(self) -> Dict:
        """Carrega policy.yaml se existir, caso contrário usa padrão"""
        try:
            if os.path.exists(self.POLICY_FILE):
                with open(self.POLICY_FILE, 'r') as f:
                    loaded = yaml.safe_load(f)
                return loaded or self.DEFAULT_POLICY
            else:
                return self.DEFAULT_POLICY
        except Exception:
            return self.DEFAULT_POLICY

    def _parse_freeze_windows(self) -> List[FreezeWindow]:
        """Parse freeze windows do policy"""
        windows = []
        freeze_data = self.policy.get("freezeWindows", [])
        
        if not isinstance(freeze_data, list):
            return windows
        
        for window in freeze_data:
            try:
                tz = window.get("timezone", self.global_timezone)
                windows.append(FreezeWindow(
                    env=window.get("env"),
                    start=window.get("start"),
                    end=window.get("end"),
                    tz=tz
                ))
            except Exception:
                pass
        
        return windows

    def get_min_approvals(self) -> int:
        """Retorna minApprovals obrigatório"""
        return self.min_approvals

    def get_min_score(self) -> int:
        """Retorna minScore obrigatório"""
        return self.min_score

    def is_frozen_for_env(self, env: str) -> bool:
        """Verifica se ambiente está em freeze window agora"""
        for window in self.freeze_windows:
            if window.env == env:
                return window.is_frozen_now()
        return False

    def validate_promotion(self, from_env: str, to_env: str, 
                          approval_count: int = 0, 
                          evidence_score: int = 0,
                          evidence_url: Optional[str] = None) -> tuple:
        """
        Valida se promoção é permitida baseado na policy
        
        Returns:
            (is_valid, message)
        """
        
        # 1. Verificar freeze window
        if self.is_frozen_for_env(to_env):
            return False, f"Ambiente {to_env} está congelado (freeze window ativa)"
        
        # 2. Regras por transição
        if from_env == "DEV" and to_env == "PRE_PROD":
            return True, "Promoção DEV → PRE_PROD permitida"
        
        elif from_env == "PRE_PROD" and to_env == "PROD":
            # Verificar approvals
            if approval_count < self.min_approvals:
                return False, f"Requer {self.min_approvals} aprovação(ões), tem {approval_count}"
            
            # Verificar evidence URL
            if not evidence_url or evidence_url.strip() == "":
                return False, "Evidence URL é obrigatória para PROD"
            
            # Verificar score
            if evidence_score < self.min_score:
                return False, f"Score mínimo é {self.min_score}, obteve {evidence_score}"
            
            return True, "Promoção PRE_PROD → PROD validada"
        
        else:
            return True, f"Promoção {from_env} → {to_env} permitida"

    def reload_policy(self):
        """Recarrega policy do arquivo"""
        self.policy = self._load_policy()
        self.min_approvals = self.policy.get("minApprovals", 1)
        self.min_score = self.policy.get("minScore", 70)
        self.global_timezone = self.policy.get("timezone", "America/Sao_Paulo")
        self.freeze_windows = self._parse_freeze_windows()


_policy_service: Optional[PolicyService] = None


def get_policy_service() -> PolicyService:
    """Factory para obter PolicyService (singleton)"""
    global _policy_service
    if _policy_service is None:
        _policy_service = PolicyService()
    return _policy_service
