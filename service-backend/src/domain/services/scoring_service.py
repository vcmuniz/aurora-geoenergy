from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


class ScoringService:
    """Service de domínio: Cálculo de score de evidência (0-100)
    
    Score é DETERMINÍSTICO, baseado apenas na análise da URL (sem HTTP requests).
    
    Regras:
    - URL válida (https): base +20 pts
    - Contém "test" ou "report": +20 pts
    - Contém "PASS": +30 pts
    - Contém "SUCCESS": +20 pts
    - Contém ".pdf" ou ".html": +10 pts
    - Total máximo: 100
    """

    MAX_SCORE = 100

    @staticmethod
    def calculate_score(evidence_url: str) -> int:
        """
        Calcula score determinístico de 0-100 para uma evidência.
        
        Análise puramente textual da URL - sem HTTP requests.

        Args:
            evidence_url: URL da evidência

        Returns:
            Score entre 0 e 100
        """
        score = 0

        # 1. Valida URL
        if not ScoringService._is_valid_url(evidence_url):
            logger.warning(f"Evidence URL inválida: {evidence_url}")
            return 0

        # Converte para uppercase para busca
        url_upper = evidence_url.upper()
        
        # 2. URL com HTTPS (segurança): +20 pts
        if url_upper.startswith("HTTPS://"):
            score += 20
            # logger.debug("URL com HTTPS", score_increment=20)
        elif url_upper.startswith("HTTP://"):
            score += 10  # HTTP (menos seguro): +10 pts
            # logger.debug("URL com HTTP", score_increment=10)

        # 3. Contém padrões de relatório/teste: +20 pts
        if any(pattern in url_upper for pattern in ["TEST", "REPORT", "RESULTS", "EVIDENCE"]):
            score += 20
            # logger.debug("Contém padrão de teste/relatório", score_increment=20)

        # 4. Contém "PASS": +30 pts
        if "PASS" in url_upper:
            score += 30
            # logger.debug("Encontrado PASS na URL", score_increment=30)

        # 5. Contém "SUCCESS": +20 pts
        if "SUCCESS" in url_upper:
            score += 20
            # logger.debug("Encontrado SUCCESS na URL", score_increment=20)

        # 6. Extensão de arquivo válida: +10 pts
        if any(ext in url_upper for ext in [".PDF", ".HTML", ".JSON", ".XML", ".PNG", ".JPG"]):
            score += 10
            # logger.debug("Extensão de arquivo válida", score_increment=10)

        # Limita ao máximo
        final_score = min(score, ScoringService.MAX_SCORE)

        logger.info(
            "Score calculado (determinístico)",
            url=evidence_url,
            score=final_score,
            has_pass="PASS" in url_upper,
            has_success="SUCCESS" in url_upper
        )

        return final_score

    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """Valida formato básico de URL"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
