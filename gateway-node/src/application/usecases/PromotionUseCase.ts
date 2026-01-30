import { IRequestContext, IPromotionValidation } from '@domain/entities';
import { IBackendClient } from '@infrastructure/http/IBackendClient';
import { ForbiddenException } from '@domain/exceptions';
import { logger } from '@core/logger';

export class PromotionUseCase {
  constructor(private backendClient: IBackendClient) {}

  async validateProductionPromotion(
    policyId: string,
    context: IRequestContext
  ): Promise<IPromotionValidation> {
    if (!context.user) {
      throw new ForbiddenException('User context required');
    }

    const isAdmin = context.user.role === 'admin' || context.user.role === 'senior';
    if (!isAdmin) {
      logger.warn(
        { requestId: context.requestId, userId: context.user.id, role: context.user.role },
        'Unauthorized promotion validation attempt'
      );
      throw new ForbiddenException('Admin role required');
    }

    logger.info(
      { requestId: context.requestId, userId: context.user.id, policyId },
      'Validating production promotion'
    );

    const response = await this.backendClient.get(
      `/evidences/score?policy_id=${policyId}`,
      context.requestId
    );

    const score = response.data.score || 0;
    const minScore = response.data.min_score || 70;
    const allowed = score >= minScore;

    logger.info(
      { requestId: context.requestId, userId: context.user.id, score, minScore, allowed },
      'Production validation result'
    );

    return {
      allowed,
      score,
      minScore,
      reason: allowed ? 'Score meets minimum requirement' : `Score ${score} below minimum ${minScore}`,
    };
  }
}
