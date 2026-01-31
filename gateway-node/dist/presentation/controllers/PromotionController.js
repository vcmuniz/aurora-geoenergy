"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const logger_1 = require("../../core/logger");
const utils_1 = require("../../core/utils");
class PromotionController {
    constructor(promotionUseCase) {
        this.promotionUseCase = promotionUseCase;
    }
    async validateProductionPromotion(req, res) {
        try {
            const { releaseId } = req.body;
            if (!releaseId) {
                return res.status(400).json((0, utils_1.formatResponse)(false, undefined, 'releaseId is required', 'VALIDATION_ERROR', req.context.requestId));
            }
            const result = await this.promotionUseCase.validateProductionPromotion(releaseId, req.context);
            res.status(200).json((0, utils_1.formatResponse)(true, result, undefined, undefined, req.context.requestId));
        }
        catch (error) {
            logger_1.logger.error({ requestId: req.context.requestId, error: error.message }, 'Promotion validation failed');
            throw error;
        }
    }
}
exports.PromotionController = PromotionController;
