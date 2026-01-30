"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionUseCase = void 0;
const exceptions_1 = require("@domain/exceptions");
const logger_1 = require("@core/logger");
class PromotionUseCase {
    constructor(backendClient) {
        this.backendClient = backendClient;
    }
    async validateProductionPromotion(policyId, context) {
        if (!context.user) {
            throw new exceptions_1.ForbiddenException('User context required');
        }
        const isAdmin = context.user.role === 'admin' || context.user.role === 'senior';
        if (!isAdmin) {
            logger_1.logger.warn({ requestId: context.requestId, userId: context.user.id, role: context.user.role }, 'Unauthorized promotion validation attempt');
            throw new exceptions_1.ForbiddenException('Admin role required');
        }
        logger_1.logger.info({ requestId: context.requestId, userId: context.user.id, policyId }, 'Validating production promotion');
        const response = await this.backendClient.get(`/evidences/score?policy_id=${policyId}`, context.requestId);
        const score = response.data.score || 0;
        const minScore = response.data.min_score || 70;
        const allowed = score >= minScore;
        logger_1.logger.info({ requestId: context.requestId, userId: context.user.id, score, minScore, allowed }, 'Production validation result');
        return {
            allowed,
            score,
            minScore,
            reason: allowed ? 'Score meets minimum requirement' : `Score ${score} below minimum ${minScore}`,
        };
    }
}
exports.PromotionUseCase = PromotionUseCase;
