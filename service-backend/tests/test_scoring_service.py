import pytest
from src.domain.services.scoring_service import ScoringService


class TestScoringService:
    """Testes unitários para ScoringService"""

    def test_invalid_url_returns_zero(self):
        """URL inválida deve retornar 0"""
        assert ScoringService.calculate_score("not-a-url") == 0
        assert ScoringService.calculate_score("") == 0
        assert ScoringService.calculate_score("   ") == 0

    def test_https_url_gives_points(self):
        """URL com HTTPS deve dar +20 pts"""
        score = ScoringService.calculate_score("https://example.com")
        assert score >= 20

    def test_http_url_gives_points(self):
        """URL com HTTP deve dar +10 pts"""
        score = ScoringService.calculate_score("http://example.com")
        assert score >= 10

    def test_test_pattern_gives_points(self):
        """URL com 'test' deve dar +20 pts"""
        score = ScoringService.calculate_score("https://example.com/test-report")
        assert score >= 40  # HTTPS (20) + test pattern (20)

    def test_report_pattern_gives_points(self):
        """URL com 'report' deve dar +20 pts"""
        score = ScoringService.calculate_score("https://example.com/report.pdf")
        assert score >= 50  # HTTPS (20) + report (20) + .pdf (10)

    def test_pass_keyword_gives_points(self):
        """URL com 'PASS' deve dar +30 pts"""
        score = ScoringService.calculate_score("https://example.com/test-PASS")
        assert score >= 50  # HTTPS (20) + PASS (30)

    def test_success_keyword_gives_points(self):
        """URL com 'SUCCESS' deve dar +20 pts"""
        score = ScoringService.calculate_score("https://example.com/SUCCESS")
        assert score >= 40  # HTTPS (20) + SUCCESS (20)

    def test_file_extension_gives_points(self):
        """URL com extensão válida deve dar +10 pts"""
        assert ScoringService.calculate_score("https://example.com/report.pdf") >= 30
        assert ScoringService.calculate_score("https://example.com/results.html") >= 30
        assert ScoringService.calculate_score("https://example.com/data.json") >= 30

    def test_combined_keywords_accumulate(self):
        """Múltiplos keywords devem acumular pontos"""
        url = "https://example.com/test-report-PASS.pdf"
        score = ScoringService.calculate_score(url)
        # HTTPS (20) + test pattern (20) + report (20) + PASS (30) + .pdf (10) = 100 (max)
        assert score == 100

    def test_score_capped_at_max(self):
        """Score nunca deve ultrapassar MAX_SCORE (100)"""
        url = "https://example.com/test-report-PASS-SUCCESS.pdf"
        score = ScoringService.calculate_score(url)
        assert score == ScoringService.MAX_SCORE
        assert score <= 100

    def test_high_quality_evidence_url(self):
        """URL de alta qualidade deve ter score alto"""
        score = ScoringService.calculate_score(
            "https://reports.company.com/test-results-PASS.html"
        )
        assert score >= 80

    def test_low_quality_evidence_url(self):
        """URL de baixa qualidade deve ter score baixo"""
        score = ScoringService.calculate_score("http://example.com")
        assert score < 30

    def test_deterministic_results(self):
        """Score deve ser determinístico (sempre mesmo resultado)"""
        url = "https://example.com/test-report-PASS.pdf"
        score1 = ScoringService.calculate_score(url)
        score2 = ScoringService.calculate_score(url)
        assert score1 == score2

    def test_case_insensitive_matching(self):
        """Matching deve ser case-insensitive"""
        url1 = "https://example.com/test-PASS"
        url2 = "https://example.com/TEST-pass"
        score1 = ScoringService.calculate_score(url1)
        score2 = ScoringService.calculate_score(url2)
        assert score1 == score2
