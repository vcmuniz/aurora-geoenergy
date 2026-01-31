"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPromotionRoutes = createPromotionRoutes;
const express_1 = require("express");
const PromotionController_1 = require("../controllers/PromotionController");
function createPromotionRoutes(backendClient) {
    const router = (0, express_1.Router)();
    const promotionController = new PromotionController_1.PromotionController(new (require('../../application/usecases/PromotionUseCase').PromotionUseCase)(backendClient));
    /**
     * @swagger
     * /internal/promotions/validate-production:
     *   post:
     *     summary: Validar promocao para PROD
     *     description: Valida se um release pode ser promovido para PROD conforme policy (score, approvals, evidence, freeze)
     *     tags:
     *       - Promotions
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - releaseId
     *             properties:
     *               releaseId:
     *                 type: string
     *                 description: ID do release a validar
     *     responses:
     *       200:
     *         description: Validacao realizada
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 data:
     *                   type: object
     *                   properties:
     *                     allowed:
     *                       type: boolean
     *                     score:
     *                       type: number
     *                     minScore:
     *                       type: number
     *                     approvalCount:
     *                       type: number
     *                     minApprovals:
     *                       type: number
     *                     hasEvidenceUrl:
     *                       type: boolean
     *                     isFrozen:
     *                       type: boolean
     *                     reason:
     *                       type: string
     *       400:
     *         description: releaseId nao fornecido
     */
    router.post('/internal/promotions/validate-production', (req, res) => promotionController.validateProductionPromotion(req, res).catch((err) => {
        throw err;
    }));
    return router;
}
