"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionUseCase = void 0;
const exceptions_1 = require("../../domain/exceptions");
const logger_1 = require("../../core/logger");
class PromotionUseCase {
    constructor(backendClient) {
        this.backendClient = backendClient;
    }
    async validateProductionPromotion(releaseId, context) {
        if (!context.user) {
            throw new exceptions_1.ForbiddenException('User context required');
        }
        logger_1.logger.info({ requestId: context.requestId, userId: context.user.id, releaseId }, 'Validating production promotion');
        const authHeader = { Authorization: `Bearer ${context.user.token || ''}` };
        // 1. Buscar release do backend
        const releaseResponse = await this.backendClient.get(`/releases/${releaseId}`, context.requestId, authHeader);
        const release = releaseResponse.data?.data || releaseResponse.data;
        const score = release.evidenceScore ?? release.evidence_score ?? 0;
        const evidenceUrl = release.evidenceUrl ?? release.evidence_url ?? '';
        // 2. Buscar approvals do release
        const approvalsResponse = await this.backendClient.get(`/approvals?release_id=${releaseId}`, context.requestId, authHeader);
        const approvalsData = approvalsResponse.data?.data;
        const approvals = Array.isArray(approvalsData)
            ? approvalsData
            : (approvalsData?.data || []);
        const approvedCount = approvals.filter((a) => a.outcome === 'APPROVED').length;
        // 3. Validar contra policy (valores padrao do policy.yaml)
        const minScore = 70;
        const minApprovals = 1;
        const hasMinScore = score >= minScore;
        const hasApprovals = approvedCount >= minApprovals;
        const hasEvidenceUrl = !!evidenceUrl && evidenceUrl.trim() !== '';
        const isFrozen = false; // Backend valida freeze na hora do promote real
        const allowed = hasMinScore && hasApprovals && hasEvidenceUrl && !isFrozen;
        const reasons = [];
        if (!hasApprovals)
            reasons.push(`Requer ${minApprovals} aprovacao(oes), tem ${approvedCount}`);
        if (!hasEvidenceUrl)
            reasons.push('Evidence URL e obrigatoria');
        if (!hasMinScore)
            reasons.push(`Score ${score} abaixo do minimo ${minScore}`);
        logger_1.logger.info({ requestId: context.requestId, releaseId, score, minScore, approvedCount, allowed }, 'Production validation result');
        return {
            allowed,
            score,
            minScore,
            approvalCount: approvedCount,
            minApprovals,
            hasEvidenceUrl,
            isFrozen,
            reason: allowed ? 'Todos os requisitos atendidos' : reasons.join('; '),
        };
    }
}
exports.PromotionUseCase = PromotionUseCase;
