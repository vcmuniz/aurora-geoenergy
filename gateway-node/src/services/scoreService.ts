import { CustomRequest, ApiResponse } from '../types/common';
import { ProxyService } from './proxyService';
import { logger } from '../middleware/logger';

export class ScoreService {
  static async validateProductionPromotion(
    policyId: string,
    context: CustomRequest['context']
  ): Promise<{ allowed: boolean; score: number; minScore: number; reason?: string }> {
    logger.info(
      {
        requestId: context.requestId,
        userId: context.user?.id,
        policyId,
      },
      'Validating production promotion'
    );

    try {
      const scoreData = await ProxyService.getEvidenceScore(policyId, context.requestId);

      const score = scoreData.score || 0;
      const minScore = scoreData.min_score || 70;
      const allowed = score >= minScore;

      logger.info(
        {
          requestId: context.requestId,
          userId: context.user?.id,
          policyId,
          score,
          minScore,
          allowed,
        },
        'Production promotion validation result'
      );

      return {
        allowed,
        score,
        minScore,
        reason: allowed ? 'Score meets minimum requirement' : `Score ${score} below minimum ${minScore}`,
      };
    } catch (error) {
      logger.error(
        {
          requestId: context.requestId,
          userId: context.user?.id,
          policyId,
          error,
        },
        'Error during production promotion validation'
      );
      throw error;
    }
  }
}
